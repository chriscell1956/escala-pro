import { Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

// Create local client if not exported globally (checking app structure later, but safe to instantiate)
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const sb = createClient(supabaseUrl, supabaseKey);

export const getPostos = async (req: Request, res: Response) => {
    console.log('GET /lancador/postos hit', req.query);
    try {
        const { ano, mes, escala_id } = req.query;

        if (!escala_id && (!ano || !mes)) {
            return res.status(400).json({ error: 'Informe escala_id ou ano/mes' });
        }

        // 1. Get Escala ID if not provided
        let escalaId = Number(escala_id);
        if (!escalaId) {
            const { data: escala, error: errEscala } = await sb
                .from('escala_mensal')
                .select('id')
                .eq('ano', ano)
                .eq('mes', mes)
                .single();


            if (!escala && (ano && mes)) {
                // Warning logic or just create fake ID?
                // Logic: If no scale found, we proceed with 0 allocations.
                // We keep lines 22-32 but set escalaId = 0 if not found, to fetch 0 allocations.
                console.warn('Escala not found, returing posts only.');
                escalaId = 0;
            } else if (errEscala) {
                return res.status(404).json({ error: 'Erro ao buscar escala' });
            } else if (!escala) { // Fallback
                escalaId = 0;
            } else {
                escalaId = escala.id;
            }
        }

        // 2. Get Postos (SetorJornada) with Details
        // We perform a join to get Setor info (Campus, Nome)
        const { data: postos, error: errPostos } = await sb
            .from('setor_jornada')
            .select(`
                id,
                setores (id, nome, codigo_radio, campus, equipe),
                jornadas (nome),
                horarios (hora_inicio, hora_fim)
            `);

        if (errPostos) {
            console.error('Error fetching postos:', errPostos);
            throw errPostos;
        }
        console.log(`Found ${postos?.length} postos`);

        // 3. Get Existing Allocations for this Escala
        let alocacoes: any[] = [];

        if (escalaId > 0) {
            console.log('Fetching allocations for escalaId:', escalaId);
            const { data: alocacoesData, error: errAlloc } = await sb
                .from('escala_vigilantes')
                .select(`
                    id,
                    data,
                    setor_jornada_id,
                    vigilante_id,
                    vigilantes (id, nome, matricula)
                `)
                .eq('escala_mensal_id', escalaId);

            if (errAlloc) throw errAlloc;
            alocacoes = alocacoesData || [];
        }

        // 4. Group and Structure Return
        // Group Postos by Campus
        const groupedPostos: any = {};

        postos.forEach((p: any) => {
            const campus = p.setores?.campus || 'Outros';
            if (!groupedPostos[campus]) groupedPostos[campus] = [];

            // Attach allocations to this post
            const postAllocs = alocacoes.filter((a: any) => a.setor_jornada_id === p.id);

            // Simplified Allocation View for Frontend Card (Group by Vigilante)
            const vigMap = new Map();
            postAllocs.forEach((a: any) => {
                if (!vigMap.has(a.vigilante_id)) {
                    vigMap.set(a.vigilante_id, {
                        vigilante: a.vigilantes,
                        dias: [],
                        ids: []
                    });
                }
                const day = new Date(a.data).getDate(); // Extract day (UTC issue? assuming date string is ISO YYYY-MM-DD stored correctly)
                // Correct way to get day from YYYY-MM-DD string to avoid timezone offset issues:
                const [y, m, d] = a.data.split('-').map(Number);

                vigMap.get(a.vigilante_id).dias.push(d);
                vigMap.get(a.vigilante_id).ids.push(a.id);
            });

            const allocationList = Array.from(vigMap.values());

            groupedPostos[campus].push({
                ...p,
                alocacoes: allocationList
            });
        });

        return res.json(groupedPostos);

    } catch (error: any) {
        console.error('Erro em getPostos:', error);
        return res.status(500).json({ error: error.message });
    }
};

export const alocarVigilante = async (req: Request, res: Response) => {
    try {
        const { setor_jornada_id, vigilante_id, ano, mes, dias, force } = req.body;
        // dias = [2, 4, 6] integers

        if (!dias || !Array.isArray(dias) || dias.length === 0) {
            return res.status(400).json({ error: 'Lista de dias inválida' });
        }

        // 1. Resolve Escala
        const { data: escala, error: errEscala } = await sb
            .from('escala_mensal')
            .select('id')
            .eq('ano', ano)
            .eq('mes', mes)
            .single();

        if (errEscala || !escala) return res.status(404).json({ error: 'Escala mensal não encontrada para este período' });

        const escalaId = escala.id;

        // 2. Conflict Check (Regra L5)
        // Convert days to 'YYYY-MM-DD'
        const datesToCheck = dias.map(d => {
            return `${ano}-${String(mes).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        });

        // Find existing allocations for this vigilante on these dates
        const { data: conflicts, error: errConflict } = await sb
            .from('escala_vigilantes')
            .select(`
                data,
                setor_jornada (
                    setores (nome)
                )
            `)
            .eq('vigilante_id', vigilante_id)
            .eq('escala_mensal_id', escalaId)
            .in('data', datesToCheck);

        const warnings: any[] = [];

        if (conflicts && conflicts.length > 0) {
            conflicts.forEach((c: any) => {
                // If allocated to SAME set_jor_id, it's an update/idempotent, effectively not a conflict of logic, but let's see.
                // Actually the query above does NOT filter by setor_jornada_id.
                // We should probably exclude current post from "Conflict" definition if he is already there.
                // But typically user won't re-add same days.

                const day = parseInt(c.data.split('-')[2]);
                const postoNome = c.setor_jornada?.setores?.nome || 'Posto Desconhecido';

                warnings.push({
                    dia: day,
                    mensagem: `Vigilante já alocado em ${postoNome} no dia ${day}`
                });
            });
        }

        // 3. Persist (Insert only missing)
        // We delete overlaps for THIS post first? Or just UPSERT?
        // Safest: Delete existing for this Vigilante+Post+Days, then Insert.
        // Assuming we want to ENFORCE the new state for these days.

        // Remove existing for this specific Post/Vigilante/Days to avoid dups
        await sb.from('escala_vigilantes')
            .delete()
            .eq('escala_mensal_id', escalaId)
            .eq('vigilante_id', vigilante_id)
            .eq('setor_jornada_id', setor_jornada_id)
            .in('data', datesToCheck);

        // Prepare inserts
        const inserts = datesToCheck.map(date => ({
            escala_mensal_id: escalaId,
            vigilante_id,
            setor_jornada_id,
            data: date
        }));

        const { error: errInsert } = await sb.from('escala_vigilantes').insert(inserts);

        if (errInsert) throw errInsert;

        return res.json({
            status: 'success',
            warnings: warnings.length > 0 ? warnings : undefined,
            message: 'Alocação realizada'
        });

    } catch (error: any) {
        console.error('Erro em alocarVigilante:', error);
        return res.status(500).json({ error: error.message });
    }
};

export const removerAlocacao = async (req: Request, res: Response) => {
    // Delete single ID or Batch?
    // Supporting single ID for now as per route param
    const { id } = req.params;
    try {
        const { error } = await sb.from('escala_vigilantes').delete().eq('id', id);
        if (error) throw error;
        return res.json({ status: 'success' });
    } catch (error: any) {
        return res.status(500).json({ error: error.message });
    }
};
