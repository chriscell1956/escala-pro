import { Request, Response } from 'express';
import { supabase } from '../config/supabase';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret';

export const login = async (req: Request, res: Response) => {
    const { matricula, senha } = req.body;

    try {
        // 1. Fetch user by matricula
        const { data: user, error } = await supabase
            .from('usuarios')
            .select('*')
            .eq('matricula', matricula)
            .single();

        if (error || !user) {
            return res.status(401).json({ message: 'Credenciais inválidas.' });
        }

        // 2. Validate password
        const validPassword = await bcrypt.compare(senha, user.senha);
        if (!validPassword) {
            return res.status(401).json({ message: 'Credenciais inválidas.' });
        }

        // 3. Generate Token
        const token = jwt.sign(
            { id: user.id, matricula: user.matricula, role: user.role },
            JWT_SECRET,
            { expiresIn: '8h' }
        );

        // 4. Return data (exclude password)
        res.json({
            token,
            user: {
                id: user.id,
                matricula: user.matricula,
                role: user.role,
                primeiro_acesso: user.primeiro_acesso,
                vigilante_id: user.vigilante_id
            }
        });

    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ message: 'Erro no servidor.' });
    }
};

export const changePassword = async (req: Request, res: Response) => {
    const { novaSenha } = req.body;
    const userId = req.user?.id; // From middleware

    if (!userId) return res.status(401).json({ message: 'Usuário não autenticado.' });

    try {
        // Hash new password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(novaSenha, salt);

        // Update in DB calling supabase
        const { error } = await supabase
            .from('usuarios')
            .update({
                senha: hashedPassword,
                primeiro_acesso: false
            })
            .eq('id', userId);

        if (error) throw error;

        res.json({ message: 'Senha alterada com sucesso.' });

    } catch (err) {
        console.error('Change Password error:', err);
        res.status(500).json({ message: 'Erro ao alterar senha.' });
    }
};
