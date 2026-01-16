import { supabase } from '../config/supabase';
import { EscalaMensal, SetorJornada } from '../types';

export class EscalaService {
    static async criarEscala(ano: number, mes: number) {
        // 1. Create Header
        const { data: escala, error: errEscala } = await supabase
            .from('escala_mensal')
            .insert({ ano, mes, status: 'PROVISORIA' })
            .select()
            .single();

        if (errEscala) {
            // Check for unique constraint violation (code 23505)
            if (errEscala.code === '23505') {
                throw new Error('Já existe uma escala para este mês/ano.');
            }
            throw new Error(`Erro ao criar escala: ${errEscala.message}`);
        }

        // 2. Fetch Active Configurations (Setor + Jornada + Horario)
        const { data: configs, error: errConfigs } = await supabase
            .from('setor_jornada')
            .select('*');

        if (errConfigs) throw new Error(`Erro ao buscar configurações: ${errConfigs.message}`);

        if (configs && configs.length > 0) {
            // 3. Replicate Sectors (Snapshot)
            // We explicitly map only the fields we need to be safe
            const snapshotData = configs.map((cfg: any) => ({
                escala_mensal_id: escala.id,
                setor_jornada_id: cfg.id
            }));

            const { error: errSnapshot } = await supabase
                .from('escala_setores')
                .insert(snapshotData);

            if (errSnapshot) {
                // If snapshot fails, we might want to rollback (delete escala), 
                // but Supabase JS doesn't support transactions easily without RPC.
                // For now, we throw, and the user might see a partial state or we can try to clean up.
                await supabase.from('escala_mensal').delete().eq('id', escala.id);
                throw new Error(`Erro ao replicar setores: ${errSnapshot.message}`);
            }
        }

        return escala;
    }

    static async listarEscalas() {
        const { data, error } = await supabase
            .from('escala_mensal')
            .select('*')
            .order('ano', { ascending: false })
            .order('mes', { ascending: false });

        if (error) throw new Error(error.message);
        return data;
    }

    static async getEspelho(escalaId: number) {
        // 1. Fetch all Allocations for this Escala
        const { data: alocacoes, error: errAlloc } = await supabase
            .from('escala_vigilantes')
            .select(`
                id,
                data,
                vigilante_id,
                vigilantes (id, nome, matricula),
                setor_jornada (
                    id,
                    setores (nome, campus, codigo_radio),
                    horarios (hora_inicio, hora_fim),
                    jornadas (nome)
                )
            `)
            .eq('escala_mensal_id', escalaId);

        if (errAlloc) throw new Error(`Erro ao buscar alocações: ${errAlloc.message}`);

        // 2. Fetch All Active Vigilantes (to show even those without allocations)
        const { data: vigilantes, error: errVig } = await supabase
            .from('vigilantes')
            .select('id, nome, matricula')
            .order('nome');

        if (errVig) throw new Error(`Erro ao buscar vigilantes: ${errVig.message}`);

        // 3. Build the Grid
        // Map: VigilanteID -> { vigilante, dias: { [day]: { tipo, setor, ... } } }
        const grid = new Map();

        // Initialize all vigilantes
        vigilantes.forEach((v: any) => {
            grid.set(v.id, {
                vigilante: v,
                dias: {} // 1..31
            });
        });

        // Fill Allocations
        if (alocacoes) {
            alocacoes.forEach((alloc: any) => {
                const entry = grid.get(alloc.vigilante_id);
                if (entry) {
                    const day = parseInt(alloc.data.split('-')[2]); // YYYY-MM-DD

                    entry.dias[day] = {
                        tipo: 'TRABALHO',
                        posto: alloc.setor_jornada?.setores?.nome,
                        campus: alloc.setor_jornada?.setores?.campus,
                        horario: `${alloc.setor_jornada?.horarios?.hora_inicio?.slice(0, 5)} - ${alloc.setor_jornada?.horarios?.hora_fim?.slice(0, 5)}`,
                        sigla: alloc.setor_jornada?.setores?.codigo_radio || 'PT'
                    };
                }
            });
        }

        return Array.from(grid.values());
    }
}
