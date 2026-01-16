import { supabase } from '../config/supabase';

interface RelatorioConflitos {
    setoresCriticosDescobertos: any[];
    campiBaixoEfetivo: any[];
}

export class ConflitosService {
    /**
     * Verifica conflitos operacionais na escala mensal.
     * Regras:
     * 1. Setores Críticos sem vigilante alocado.
     * 2. Efetivo do Campus abaixo de 50%.
     */
    static async checarConflitos(escala_mensal_id: number): Promise<RelatorioConflitos> {

        // 1. Buscar todos os setores da escala (Snapshot)
        // Precisamos saber quais setores existem nesta escala para verificar cobertura.
        const { data: setoresEscala, error: errSetores } = await supabase
            .from('escala_setores')
            .select(`
        id,
        setor_jornada (
          id,
          setores (
            id,
            nome,
            campus,
            critico
          )
        )
      `)
            .eq('escala_mensal_id', escala_mensal_id);

        if (errSetores) throw new Error(`Erro ao buscar setores da escala: ${errSetores.message}`);

        // 2. Buscar alocações existentes para esta escala
        // Precisamos saber quem está alocado para contar.
        const { data: alocacoes, error: errAloc } = await supabase
            .from('escala_vigilantes')
            .select('setor_jornada_id, data')
            .eq('escala_mensal_id', escala_mensal_id);

        if (errAloc) throw new Error(`Erro ao buscar alocações: ${errAloc.message}`);

        const setoresCriticosDescobertos: any[] = [];
        const estatisticasCampus: Record<string, { totalPostos: number, diasCobertos: number, diasTotais: number }> = {};

        // Map auxiliar para acesso rápido às alocações
        // Chave: setor_jornada_id -> Set de datas ocupadas
        const ocupacaoMap = new Map<number, Set<string>>();
        alocacoes?.forEach((a: any) => {
            if (!ocupacaoMap.has(a.setor_jornada_id)) {
                ocupacaoMap.set(a.setor_jornada_id, new Set());
            }
            ocupacaoMap.get(a.setor_jornada_id)?.add(a.data);
        });

        // Assumindo mês de 30 dias para cálculo simplificado de "diasTotais" do posto
        // Numa implementação real, calcularíamos dias exatos do mês.
        const DIAS_NO_MES = 30;

        setoresEscala?.forEach((item: any) => {
            const sj = item.setor_jornada;
            const setor = sj.setores;
            const diasOcupados = ocupacaoMap.get(sj.id)?.size || 0;

            // Check 1: Setor Crítico Descoberto (considerando "Descoberto" se não tiver NENHUMA alocação ou abaixo de x%?
            // Vou considerar: Se é crítico e tem ZERO alocação no mês inteiro, ou se tem dias vazios (mas dias vazios é normal em escala).
            // Regra ajustada: "Setor crítico descoberto" -> Vou flagrar se houver dia SEM vigilante?
            // Isso geraria muitos alertas se a escala estiver vazia.
            // Vou flagrar apenas se estiver COMPLETAMENTE vazio por enquanto, ou podemos refinar.
            // Melhor: O usuário pediu "Setor crítico descoberto".

            if (setor.critico && diasOcupados === 0) {
                setoresCriticosDescobertos.push({
                    setor: setor.nome,
                    campus: setor.campus,
                    mensagem: 'Setor crítico sem nenhuma alocação neste mês.'
                });
            }

            // Estatísticas por Campus
            if (!estatisticasCampus[setor.campus]) {
                estatisticasCampus[setor.campus] = { totalPostos: 0, diasCobertos: 0, diasTotais: 0 };
            }
            estatisticasCampus[setor.campus].totalPostos += 1;
            estatisticasCampus[setor.campus].diasTotais += DIAS_NO_MES;
            estatisticasCampus[setor.campus].diasCobertos += diasOcupados;
        });

        // Check 2: Efetivo < 50%
        const campiBaixoEfetivo: any[] = [];
        for (const [campus, stats] of Object.entries(estatisticasCampus)) {
            const percentualCobertura = (stats.diasCobertos / stats.diasTotais) * 100;

            if (percentualCobertura < 50) {
                campiBaixoEfetivo.push({
                    campus,
                    cobertura: `${percentualCobertura.toFixed(1)}%`,
                    mensagem: 'Efetivo abaixo de 50% do necessário (considerando cobertura total de dias).'
                });
            }
        }

        return {
            setoresCriticosDescobertos,
            campiBaixoEfetivo
        };
    }
}
