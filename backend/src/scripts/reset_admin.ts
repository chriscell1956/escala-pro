import { supabase } from '../config/supabase';
import bcrypt from 'bcryptjs';

async function resetAdmin() {
    const matricula = 'admin';
    const senha = 'admin';

    console.log(`Connecting to Supabase...`);
    console.log(`Targeting user: ${matricula}`);

    try {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(senha, salt);

        const { data: existingUser, error: findError } = await supabase
            .from('usuarios')
            .select('*')
            .eq('matricula', matricula)
            .single();

        if (findError && findError.code !== 'PGRST116') { // PGRST116 is "Row not found"
            console.error('Error finding user:', findError);
            return;
        }

        if (existingUser) {
            console.log('User found (ID: ' + existingUser.id + '), updating password...');
            const { error: updateError } = await supabase
                .from('usuarios')
                .update({
                    senha: hashedPassword,
                    role: 'admin',
                    primeiro_acesso: false
                })
                .eq('matricula', matricula);

            if (updateError) {
                console.error('Error updating user:', updateError);
            } else {
                console.log('User updated successfully.');
            }
        } else {
            console.log('User not found, creating new admin...');
            const { error: insertError } = await supabase
                .from('usuarios')
                .insert({
                    matricula,
                    senha: hashedPassword,
                    role: 'admin',
                    primeiro_acesso: false
                });

            if (insertError) {
                console.error('Error creating user:', insertError);
            } else {
                console.log('User created successfully.');
            }
        }

        console.log('-----------------------------------');
        console.log('Credentials ready:');
        console.log('Matrícula: admin');
        console.log('Senha:     admin');
        console.log('-----------------------------------');

    } catch (err) {
        console.error('Unexpected error:', err);
    }
}

resetAdmin();
