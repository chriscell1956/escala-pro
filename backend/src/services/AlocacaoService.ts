import { supabase } from '../config/supabase';

export class AlocacaoService {
    static async alocar(escala_mensal_id: number, vigilante_id: number, data: string, setor_jornada_id: number) {
        if (!vigilante_id) throw new Error('Vigilante ID é obrigatório para alocação.');

        // 1. Double Booking Check
        const { data: existing, error: errExist } = await supabase
            .from('escala_vigilantes')
            .select('id')
            .eq('vigilante_id', vigilante_id)
            .eq('data', data)
            .maybeSingle();

        if (existing) {
            throw new Error(`O vigilante já está alocado neste dia (ID: ${existing.id}).`);
        }

        // 2. Vacation Check
        const { data: ferias } = await supabase
            .from('ferias')
            .select('id')
            .eq('vigilante_id', vigilante_id)
            .lte('data_inicio', data)
            .gte('data_fim', data)
            .maybeSingle();

        if (ferias) {
            throw new Error('O vigilante está de férias nesta data.');
        }

        // 3. Absence Check
        const { data: afastamento } = await supabase
            .from('afastamentos')
            .select('id')
            .eq('vigilante_id', vigilante_id)
            .lte('data_inicio', data)
            .gte('data_fim', data)
            .maybeSingle();

        if (afastamento) {
            throw new Error('O vigilante está afastado por motivo médico/outros nesta data.');
        }

        // 4. Leave/Folga Check
        const { data: folga } = await supabase
            .from('solicitacoes_folga')
            .select('id')
            .eq('vigilante_id', vigilante_id)
            .eq('data', data)
            .eq('status', 'APROVADA')
            .maybeSingle();

        if (folga) {
            throw new Error('O vigilante possui uma folga aprovada nesta data.');
        }

        // 5. Perform Allocation
        const { data: alocacao, error } = await supabase
            .from('escala_vigilantes')
            .insert({
                escala_mensal_id,
                vigilante_id,
                data,
                setor_jornada_id
            })
            .select()
            .single();

        if (error) throw new Error(`Erro ao alocar: ${error.message}`);

        return alocacao;
    }

    static async remover(id: number) {
        const { error } = await supabase
            .from('escala_vigilantes')
            .delete()
            .eq('id', id);

        if (error) throw new Error(error.message);
        return { success: true };
    }

    static async listarPorEscala(escala_mensal_id: number) {
        const { data, error } = await supabase
            .from('escala_vigilantes')
            .select(`
        id,
        data,
        vigilante_id,
        vigilantes ( id, nome, matricula ),
        setor_jornada (
          id,
          setor_id,
          jornada_id,
          horario_id,
          setores ( nome, codigo_radio, campus ),
          jornadas ( nome ),
          horarios ( hora_inicio, hora_fim )
        )
      `)
            .eq('escala_mensal_id', escala_mensal_id);

        if (error) throw new Error(error.message);
        return data;
    }
}
