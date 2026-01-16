import { Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const sb = createClient(supabaseUrl, supabaseKey);

export const listarPostos = async (req: Request, res: Response) => {
    try {
        const { data, error } = await sb
            .from('setor_jornada')
            .select(`
                id,
                refeicao,
                setores (id, nome, campus, equipe, codigo_radio),
                jornadas (id, nome),
                horarios (id, hora_inicio, hora_fim)
            `);

        if (error) throw error;
        return res.json(data);
    } catch (error: any) {
        return res.status(500).json({ error: error.message });
    }
};

// Helper for validation
const validateTime = (t: string) => /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(t);

export const criarPosto = async (req: Request, res: Response) => {
    try {
        const { nome, campus, equipe, codigo_radio, jornada_nome, hora_inicio, hora_fim, refeicao } = req.body;

        // Validation
        if (!validateTime(hora_inicio)) return res.status(400).json({ error: 'Hora Início inválida (HH:MM)' });
        if (!validateTime(hora_fim)) return res.status(400).json({ error: 'Hora Fim inválida (HH:MM)' });

        if (refeicao && refeicao !== 'Sem Refeição') {
            // Expect "HH:MM - HH:MM"
            if (!refeicao.includes('-')) return res.status(400).json({ error: 'Formato de refeição inválido' });
            const [rStart, rEnd] = refeicao.split('-').map((s: string) => s.trim());
            if (!validateTime(rStart) || !validateTime(rEnd)) return res.status(400).json({ error: 'Horário de refeição inválido' });
        }

        // 1. Create or Find Setor
        // Since "Posto" is often synonymous with "Setor" in UI, we create a new Setor
        const { data: setor, error: errSetor } = await sb
            .from('setores')
            .insert({ nome, campus, equipe, codigo_radio: codigo_radio || 'PT' })
            .select()
            .single();

        if (errSetor) throw errSetor;

        // 2. Find or Create Horario
        // Check if exists
        let horario_id;
        const { data: existingHorario } = await sb
            .from('horarios')
            .select('id')
            .eq('hora_inicio', hora_inicio)
            .eq('hora_fim', hora_fim)
            .single();

        if (existingHorario) {
            horario_id = existingHorario.id;
        } else {
            const { data: newHorario, error: errHorario } = await sb
                .from('horarios')
                .insert({ hora_inicio, hora_fim })
                .select()
                .single();
            if (errHorario) throw errHorario;
            horario_id = newHorario.id;
        }

        // 3. Find or Create Jornada
        // Assuming jornada_nome passed like '12x36'
        let jornada_id;
        const { data: existingJornada } = await sb
            .from('jornadas')
            .select('id')
            .eq('nome', jornada_nome)
            .single();

        if (existingJornada) {
            jornada_id = existingJornada.id;
        } else {
            const { data: newJornada, error: errJornada } = await sb
                .from('jornadas')
                .insert({ nome: jornada_nome })
                .select()
                .single();
            if (errJornada) throw errJornada;
            jornada_id = newJornada.id;
        }

        // 4. Link in setor_jornada
        const { data: posto, error: errPosto } = await sb
            .from('setor_jornada')
            .insert({
                setor_id: setor.id,
                jornada_id,
                horario_id,
                refeicao
            })
            .select()
            .single();

        if (errPosto) throw errPosto;

        return res.json(posto);

    } catch (error: any) {
        console.error('Erro ao criar posto:', error);
        return res.status(500).json({ error: error.message });
    }
};

export const atualizarPosto = async (req: Request, res: Response) => {
    try {
        const { id } = req.params; // setor_jornada id
        const { nome, campus, equipe, codigo_radio, jornada_nome, hora_inicio, hora_fim, refeicao } = req.body;

        // Validation
        if (!validateTime(hora_inicio)) return res.status(400).json({ error: 'Hora Início inválida (HH:MM)' });
        if (!validateTime(hora_fim)) return res.status(400).json({ error: 'Hora Fim inválida (HH:MM)' });

        if (refeicao && refeicao !== 'Sem Refeição') {
            // Expect "HH:MM - HH:MM"
            if (!refeicao.includes('-')) return res.status(400).json({ error: 'Formato de refeição inválido' });
            const [rStart, rEnd] = refeicao.split('-').map((s: string) => s.trim());
            if (!validateTime(rStart) || !validateTime(rEnd)) return res.status(400).json({ error: 'Horário de refeição inválido' });
        }

        // 1. Get current link to find Setor ID
        const { data: currentLink, error: errLink } = await sb
            .from('setor_jornada')
            .select('setor_id')
            .eq('id', id)
            .single();

        if (errLink || !currentLink) throw new Error('Posto não encontrado');

        // 2. Update Setor (Nome, Campus, Equipe)
        const { error: errSetor } = await sb
            .from('setores')
            .update({ nome, campus, equipe, codigo_radio })
            .eq('id', currentLink.setor_id);

        if (errSetor) throw errSetor;

        // 3. Find or Create New Horario (if changed)
        // We cannot just update the horary row because it might be shared.
        // We find the ID for the new times.
        let horario_id;
        const { data: existingHorario } = await sb
            .from('horarios')
            .select('id')
            .eq('hora_inicio', hora_inicio)
            .eq('hora_fim', hora_fim)
            .single();

        if (existingHorario) {
            horario_id = existingHorario.id;
        } else {
            const { data: newHorario, error: errHorario } = await sb
                .from('horarios')
                .insert({ hora_inicio, hora_fim })
                .select()
                .single();
            if (errHorario) throw errHorario;
            horario_id = newHorario.id;
        }

        // 4. Find or Create New Jornada
        let jornada_id;
        const { data: existingJornada } = await sb
            .from('jornadas')
            .select('id')
            .eq('nome', jornada_nome)
            .single();

        if (existingJornada) {
            jornada_id = existingJornada.id;
        } else {
            const { data: newJornada, error: errJornada } = await sb
                .from('jornadas')
                .insert({ nome: jornada_nome })
                .select()
                .single();
            if (errJornada) throw errJornada;
            jornada_id = newJornada.id;
        }

        // 5. Update SetorJornada Link
        const { data: updatedLink, error: errUpdateLink } = await sb
            .from('setor_jornada')
            .update({
                horario_id,
                jornada_id,
                refeicao
            })
            .eq('id', id)
            .select()
            .single();

        if (errUpdateLink) throw errUpdateLink;

        return res.json({ success: true, data: updatedLink });

    } catch (error: any) {
        console.error('Erro ao atualizar posto:', error);
        return res.status(500).json({ error: error.message });
    }
};

export const deletarPosto = async (req: Request, res: Response) => {
    // Delete setor_jornada? And Setor?
    // Cascading delete usually handles it if configured, but let's be explicit
    const { id } = req.params;
    try {
        // 1. Get setor_id before deleting
        const { data: link, error: errLink } = await sb
            .from('setor_jornada')
            .select('setor_id')
            .eq('id', id)
            .single();

        if (errLink) throw errLink;
        if (!link) return res.status(404).json({ error: 'Posto não encontrado' });

        // 2. Delete the Link (setor_jornada)
        const { error: errDelLink } = await sb
            .from('setor_jornada')
            .delete()
            .eq('id', id);

        if (errDelLink) throw errDelLink;

        // 3. Delete the Setor (Physical Deletion as requested)
        // This ensures public.setores is cleaned up.
        const { error: errDelSetor } = await sb
            .from('setores')
            .delete()
            .eq('id', link.setor_id);

        if (errDelSetor) {
            // If this fails (e.g. other constraints like alocacoes?), we might warn but the link is gone.
            // But user wants "Consistency". If we can't delete sector, we have a problem.
            // Ideally we should delete everything related.
            throw errDelSetor;
        }

        return res.json({ success: true });
    } catch (error: any) {
        if (error.code === '23503') {
            return res.status(409).json({
                error: '⚠️ Não é possível excluir este posto pois ele está vinculado a uma escala existente.'
            });
        }
        return res.status(500).json({ error: error.message });
    }
};
