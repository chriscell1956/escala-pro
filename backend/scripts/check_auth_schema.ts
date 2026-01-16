import { supabase } from '../src/config/supabase';

async function checkSchema() {
    console.log('Verificando conexão e schema da tabela usuarios...');

    try {
        // Tenta selecionar todas as colunas esperadas de um usuário (ou retornar null se vazio)
        // Se a coluna não existir, o Supabase deve retornar erro.
        const { data, error } = await supabase
            .from('usuarios')
            .select('id, matricula, senha, role, primeiro_acesso')
            .limit(1);

        if (error) {
            console.error('❌ Erro ao acessar tabela usuarios:', error.message);
            if (error.message.includes('does not exist')) {
                console.error('⚠️  Provável causa: Coluna ou Tabela inexistente.');
            }
        } else {
            console.log('✅ Tabelausuarios verificada com sucesso!');
            console.log('Colunas acessíveis: id, matricula, senha, role, primeiro_acesso');
            if (data.length === 0) {
                console.log('ℹ️  A tabela está vazia. O usuário MASTER deve ser criado.');
            } else {
                console.log('ℹ️  Usuários encontrados:', data.length);
            }
        }
    } catch (err) {
        console.error('❌ Erro inesperado:', err);
    }
}

checkSchema();
