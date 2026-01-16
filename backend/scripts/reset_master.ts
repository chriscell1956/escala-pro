import { supabase } from '../src/config/supabase';
import bcrypt from 'bcryptjs';

async function resetMaster() {
    console.log('Iniciando reset de senha do MASTER...');

    try {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('123456', salt);

        // 1. Tentar atualizar se existir
        const { data, error } = await supabase
            .from('usuarios')
            .update({ senha: hashedPassword, role: 'MASTER', primeiro_acesso: false })
            .eq('matricula', 'MASTER')
            .select();

        if (error) {
            console.error('Erro ao atualizar:', error.message);
            return;
        }

        if (data && data.length > 0) {
            console.log('✅ Senha do usuário MASTER redefinida para "123456".');
        } else {
            // 2. Criar se não existir
            console.log('Usuário não encontrado, criando...');
            const { error: insertError } = await supabase
                .from('usuarios')
                .insert([{
                    matricula: 'MASTER',
                    senha: hashedPassword,
                    role: 'MASTER',
                    primeiro_acesso: false
                }]);

            if (insertError) {
                console.error('Erro ao criar:', insertError.message);
            } else {
                console.log('✅ Usuário MASTER criado com senha "123456".');
            }
        }

    } catch (err) {
        console.error('Erro inesperado:', err);
    }
}

resetMaster();
