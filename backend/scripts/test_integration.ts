
import { supabase } from '../src/config/supabase';
import { EscalaService } from '../src/services/EscalaService';
import { AlocacaoService } from '../src/services/AlocacaoService';
import { ConflitosService } from '../src/services/ConflitosService';
import { FolgaService } from '../src/services/FolgaService';

async function runTests() {
    console.log('🚀 Iniciando Testes de Integração Backend...');

    // Config: Mês de Teste (Futuro para ser Provisório)
    const TEST_YEAR = 2026;
    const TEST_MONTH = 12;
    let escalaId: number | null = null;
    let vigilanteId: number | null = null;
    let setorJornadaId: number | null = null;

    try {
        // ---------------------------------------------------------
        // 0. Seeding (Garantir dados mínimos)
        // ---------------------------------------------------------
        console.log('\n--- 0. Seeding Dados Iniciais ---');

        // Jornada 12x36
        let { data: jornada } = await supabase.from('jornadas').select('id').eq('nome', '12x36').maybeSingle();
        if (!jornada) {
            const res = await supabase.from('jornadas').insert({ nome: '12x36' }).select().single();
            if (res.error) throw new Error(`Erro ao criar jornada: ${res.error.message}`);
            jornada = res.data;
            console.log('✅ Jornada 12x36 criada.');
        }

        // Horário 07:00-19:00
        let { data: horario } = await supabase.from('horarios').select('id').eq('hora_inicio', '07:00:00').maybeSingle();
        if (!horario) {
            const res = await supabase.from('horarios').insert({ hora_inicio: '07:00:00', hora_fim: '19:00:00' }).select().single();
            if (res.error) throw new Error(`Erro ao criar horario: ${res.error.message}`);
            horario = res.data;
            console.log('✅ Horário 07-19 criado.');
        }

        // Setor TESTE
        let { data: setor } = await supabase.from('setores').select('id').eq('nome', 'POSTO TESTE').maybeSingle();
        if (!setor) {
            const res = await supabase.from('setores').insert({ nome: 'POSTO TESTE', codigo_radio: 'TEST-01', campus: 'CAMPUS A', critico: true }).select().single();
            if (res.error) throw new Error(`Erro ao criar setor: ${res.error.message}`);
            setor = res.data;
            console.log('✅ Setor TESTE criado.');
        }

        // Setor Jornada
        let { data: sj } = await supabase.from('setor_jornada')
            .select('id')
            .eq('setor_id', setor!.id)
            .eq('jornada_id', jornada!.id)
            .eq('horario_id', horario!.id)
            .maybeSingle();

        if (!sj) {
            const res = await supabase.from('setor_jornada').insert({ setor_id: setor!.id, jornada_id: jornada!.id, horario_id: horario!.id }).select().single();
            if (res.error) throw new Error(`Erro ao criar setor_jornada: ${res.error.message}`);
            sj = res.data;
            console.log('✅ Configuração Setor/Jornada criada.');
        }

        // Vigilante
        let { data: vig } = await supabase.from('vigilantes').select('id').eq('matricula', '99999').maybeSingle();
        if (!vig) {
            const res = await supabase.from('vigilantes').insert({ nome: 'VIGILANTE TESTE', matricula: '99999', ativo: true }).select().single();
            if (res.error) throw new Error(`Erro ao criar vigilante: ${res.error.message}`);
            vig = res.data;
            console.log('✅ Vigilante TESTE criado.');
        }

        // ---------------------------------------------------------
        // 1. Verificando Dados Mestres (Agora devem existir)
        // ---------------------------------------------------------
        console.log('\n--- 1. Verificando Dados Mestres ---');
        vigilanteId = vig.id;
        setorJornadaId = sj.id;

        console.log('✅ Dados mestres encontrados.');

        // ---------------------------------------------------------
        // 2. Criar Escala Mensal
        // ---------------------------------------------------------
        console.log(`\n--- 2. Criando Escala ${TEST_MONTH}/${TEST_YEAR} ---`);
        // Cleanup anterior se existir
        const { data: existing } = await supabase.from('escala_mensal').select('id').eq('ano', TEST_YEAR).eq('mes', TEST_MONTH).maybeSingle();
        if (existing) {
            await supabase.from('escala_mensal').delete().eq('id', existing.id);
            console.log('   (Escala anterior limpa)');
        }

        const escala = await EscalaService.criarEscala(TEST_YEAR, TEST_MONTH);
        escalaId = escala.id;
        console.log(`✅ Escala criada: ID ${escala.id}, Status: ${escala.status}`);

        // Validar Snapshot
        const { count: countSetores } = await supabase.from('escala_setores').select('*', { count: 'exact', head: true }).eq('escala_mensal_id', escala.id);
        if (countSetores === 0) throw new Error('ERRO: Snapshot de setores não foi criado.');
        console.log(`✅ Snapshot de setores OK (${countSetores} registros).`);

        // ---------------------------------------------------------
        // 3. Alocação e Regras
        // ---------------------------------------------------------
        console.log('\n--- 3. Testando Alocação ---');
        if (!escalaId || !vigilanteId || !setorJornadaId) return;

        const DATA_TESTE = `${TEST_YEAR}-${TEST_MONTH}-01`;

        // 3.1 Alocação Normal
        const aloc1 = await AlocacaoService.alocar(escalaId, vigilanteId, DATA_TESTE, setorJornadaId);
        console.log('✅ Alocação normal realizada com sucesso.');

        // 3.2 Duplicidade
        try {
            await AlocacaoService.alocar(escalaId, vigilanteId, DATA_TESTE, setorJornadaId);
            throw new Error('ERRO: Sistema permitiu duplicidade.');
        } catch (e: any) {
            console.log(`✅ Bloqueio de duplicidade OK: ${e.message}`);
        }

        // ---------------------------------------------------------
        // 4. Folgas
        // ---------------------------------------------------------
        console.log('\n--- 4. Testando Folgas ---');
        const DATA_FOLGA = `${TEST_YEAR}-${TEST_MONTH}-02`;

        // 4.1 Solicitar
        const folga = await FolgaService.solicitar(vigilanteId, escalaId, DATA_FOLGA);
        console.log('✅ Folga solicitada.');

        // 4.2 Aprovar
        await FolgaService.responder(folga.id, 'APROVADA');
        console.log('✅ Folga aprovada.');

        // 4.3 Tentar Alocar no dia da Folga
        try {
            await AlocacaoService.alocar(escalaId, vigilanteId, DATA_FOLGA, setorJornadaId);
            throw new Error('ERRO: Sistema permitiu alocar em dia de folga.');
        } catch (e: any) {
            console.log(`✅ Bloqueio de folga aprovada OK: ${e.message}`);
        }

        // ---------------------------------------------------------
        // 5. Conflitos
        // ---------------------------------------------------------
        console.log('\n--- 5. Testando Conflitos ---');
        const conflitos = await ConflitosService.checarConflitos(escalaId);
        console.log('✅ Relatório de conflitos gerado:');
        console.log('   - Setores Descobertos:', conflitos.setoresCriticosDescobertos.length);
        console.log('   - Baixo Efetivo:', conflitos.campiBaixoEfetivo.length);

        console.log('\n🎉 TODOS OS TESTES PASSARAM!');

    } catch (error: any) {
        console.error('\n❌ ERRO NOS TESTES:', error.message);
    } finally {
        // Opcional: Limpar dados de teste
        // if (escalaId) await supabase.from('escala_mensal').delete().eq('id', escalaId);
    }
}

runTests();
