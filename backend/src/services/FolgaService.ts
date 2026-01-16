import { supabase } from '../config/supabase';

export class FolgaService {

    /**
     * Registra uma nova solicitação de folga.
     * Regras: Limite de 2 dias por mês para o vigilante nesta escala.
     */
    static async solicitar(vigilante_id: number, escala_mensal_id: number, data: string) {
        // 1. Verificar limite de folgas no mês
        const { count, error: countErr } = await supabase
            .from('solicitacoes_folga')
            .select('id', { count: 'exact', head: true })
            .eq('vigilante_id', vigilante_id)
            .eq('escala_mensal_id', escala_mensal_id);

        if (countErr) throw new Error(`Erro ao verificar limite de folgas: ${countErr.message}`);

        if (count !== null && count >= 2) {
            throw new Error('Limite de 2 folgas por mês atingido.');
        }

        // 2. Criar solicitação
        const { data: folga, error } = await supabase
            .from('solicitacoes_folga')
            .insert({
                vigilante_id,
                escala_mensal_id,
                data,
                status: 'PENDENTE'
            })
            .select()
            .single();

        if (error) throw new Error(`Erro ao solicitar folga: ${error.message}`);
        return folga;
    }

    /**
     * Aprova ou Nega uma solicitação.
     */
    static async responder(id: number, status: 'APROVADA' | 'NEGADA') {
        const { data: folga, error } = await supabase
            .from('solicitacoes_folga')
            .update({ status })
            .eq('id', id)
            .select()
            .single();

        if (error) throw new Error(`Erro ao atualizar folga: ${error.message}`);
        return folga;
    }

    static async listarPendentes(escala_mensal_id: number) {
        const { data, error } = await supabase
            .from('solicitacoes_folga')
            .select(`
        *,
        vigilantes ( nome, matricula )
      `)
            .eq('escala_mensal_id', escala_mensal_id)
            .eq('status', 'PENDENTE');

        if (error) throw new Error(error.message);
        return data;
    }
}
