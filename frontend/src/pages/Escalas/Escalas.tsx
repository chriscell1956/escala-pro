import { useState } from 'react';
import { useEscalas } from '../../hooks/useEscalas';
import { Plus, Calendar, AlertCircle, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import styles from './Escalas.module.css';

export default function Escalas() {
    const { escalas, loading, error, criarEscala } = useEscalas();
    const navigate = useNavigate();
    const [creating, setCreating] = useState(false);

    const [modalOpen, setModalOpen] = useState(false);
    const { role } = useAuth();
    const [newAno, setNewAno] = useState(new Date().getFullYear().toString());
    const [newMes, setNewMes] = useState('');

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newAno || !newMes) return;

        setCreating(true);
        try {
            await criarEscala(Number(newAno), Number(newMes));
            setModalOpen(false);
            alert('Escala criada com sucesso!');
        } catch (err: any) {
            alert(err.message);
        } finally {
            setCreating(false);
        }
    };

    const getStatusColor = (status: string) => {
        return status === 'OFICIAL' ? styles.statusOficial : styles.statusProvisoria;
    };

    if (loading && escalas.length === 0) return <div className={styles.loading}>Carregando...</div>;

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1>Escalas Mensais</h1>
                {role !== 'USER' && (
                    <button className={styles.createButton} onClick={() => setModalOpen(true)}>
                        <Plus size={20} />
                        Nova Escala
                    </button>
                )}
            </div>

            {error && <div className={styles.error}>{error}</div>}

            <div className={styles.grid}>
                {escalas.map((escala) => (
                    <div key={escala.id} className={styles.card} onClick={() => navigate(`/escala/${escala.id}`)}>
                        <div className={styles.cardHeader}>
                            <span className={styles.ano}>{escala.ano}</span>
                            <span className={`${styles.status} ${getStatusColor(escala.status)}`}>
                                {escala.status === 'OFICIAL' ? <CheckCircle size={14} /> : <AlertCircle size={14} />}
                                {escala.status}
                            </span>
                        </div>
                        <div className={styles.mes}>
                            {new Date(escala.ano, escala.mes - 1).toLocaleString('pt-BR', { month: 'long' }).toUpperCase()}
                        </div>
                        <div className={styles.footer}>
                            <Calendar size={16} />
                            <span>Criado em {new Date(escala.criado_em).toLocaleDateString('pt-BR')}</span>
                        </div>
                    </div>
                ))}

                {escalas.length === 0 && !loading && (
                    <div className={styles.empty}>
                        Nenhuma escala encontrada. Crie a primeira!
                    </div>
                )}
            </div>

            {modalOpen && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modal}>
                        <h3>Nova Escala</h3>
                        <form onSubmit={handleCreate} className={styles.form}>
                            <div className={styles.field}>
                                <label>Ano</label>
                                <input
                                    type="number"
                                    value={newAno}
                                    onChange={e => setNewAno(e.target.value)}
                                    required
                                />
                            </div>
                            <div className={styles.field}>
                                <label>Mês (1-12)</label>
                                <input
                                    type="number"
                                    min="1"
                                    max="12"
                                    value={newMes}
                                    onChange={e => setNewMes(e.target.value)}
                                    required
                                    placeholder="Ex: 1"
                                />
                            </div>
                            <div className={styles.modalActions}>
                                <button type="button" onClick={() => setModalOpen(false)} className={styles.btnCancel}>Cancelar</button>
                                <button type="submit" className={styles.btnConfirm} disabled={creating}>
                                    {creating ? 'Criando...' : 'Criar Escala'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
