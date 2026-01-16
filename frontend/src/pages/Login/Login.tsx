import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import styles from './Login.module.css';
import { api } from '../../api';

export default function Login() {
    const { login } = useAuth();
    const navigate = useNavigate();

    // Login States
    const [matricula, setMatricula] = useState('');
    const [senha, setSenha] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Change Password States
    const [needsChange, setNeedsChange] = useState(false);
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            const data = await login(matricula, senha);

            // If API returns primeiro_acesso flag, force change
            if (data.primeiro_acesso) {
                setNeedsChange(true);
                setLoading(false);
                return;
            }

            // Otherwise, login successful
            navigate('/dashboard');
        } catch (err: any) {
            setError(err.message || 'Erro ao realizar login');
            setLoading(false);
        }
    };

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            setError('As senhas não coincidem');
            return;
        }
        if (newPassword.length < 6) {
            setError('A senha deve ter no mínimo 6 caracteres');
            return;
        }

        setLoading(true);
        try {
            await api.post('/auth/change-password', { matricula, novaSenha: newPassword });

            // Auto login after change or just alert?
            // Let's attempt to login with new password
            await login(matricula, newPassword);
            navigate('/dashboard');
        } catch (err: any) {
            setError(err.message || 'Erro ao alterar senha');
            setLoading(false);
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.loginCard}>
                <div className={styles.logo}>
                    <Shield size={32} color="var(--primary)" />
                    ESCALA PRO
                </div>

                {!needsChange ? (
                    <>
                        <h1 className={styles.title}>Bem-vindo</h1>
                        <p className={styles.subtitle}>Faça login para acessar o sistema</p>

                        {error && <div className={styles.error}>{error}</div>}

                        <form onSubmit={handleLogin} className={styles.form}>
                            <div className={styles.inputGroup}>
                                <label className={styles.label}>Matrícula</label>
                                <input
                                    type="text"
                                    className={styles.input}
                                    value={matricula}
                                    onChange={e => setMatricula(e.target.value)}
                                    placeholder="Ex: 12345"
                                    required
                                />
                            </div>
                            <div className={styles.inputGroup}>
                                <label className={styles.label}>Senha</label>
                                <input
                                    type="password"
                                    className={styles.input}
                                    value={senha}
                                    onChange={e => setSenha(e.target.value)}
                                    placeholder="••••••"
                                    required
                                />
                            </div>
                            <button type="submit" className={styles.button} disabled={loading}>
                                {loading ? 'Entrando...' : 'Entrar'}
                            </button>
                        </form>
                    </>
                ) : (
                    <>
                        <h1 className={styles.title} style={{ color: 'var(--warning)' }}>Troca de Senha</h1>
                        <p className={styles.subtitle}>Primeiro acesso detectado. Defina uma nova senha.</p>

                        {error && <div className={styles.error}>{error}</div>}

                        <form onSubmit={handleChangePassword} className={styles.form}>
                            <div className={styles.inputGroup}>
                                <label className={styles.label}>Nova Senha</label>
                                <input
                                    type="password"
                                    className={styles.input}
                                    value={newPassword}
                                    onChange={e => setNewPassword(e.target.value)}
                                    placeholder="Mínimo 6 caracteres"
                                    required
                                />
                            </div>
                            <div className={styles.inputGroup}>
                                <label className={styles.label}>Confirmar Senha</label>
                                <input
                                    type="password"
                                    className={styles.input}
                                    value={confirmPassword}
                                    onChange={e => setConfirmPassword(e.target.value)}
                                    placeholder="Repita a senha"
                                    required
                                />
                            </div>
                            <button type="submit" className={styles.button} disabled={loading}>
                                {loading ? 'Alterando...' : 'Salvar e Entrar'}
                            </button>
                        </form>
                    </>
                )}
            </div>
        </div>
    );
}
