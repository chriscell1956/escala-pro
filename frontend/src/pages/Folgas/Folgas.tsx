import { useState } from 'react';
import { useFolgas } from '../../hooks/useFolgas';
import { useEscalas } from '../../hooks/useEscalas';
import { useAlocacao } from '../../hooks/useAlocacao'; // Reuse to get vigilantes
import { useAuth } from '../../contexts/AuthContext';
import styles from './Folgas.module.css';

export default function Folgas() {
    const { escalas } = useEscalas();
    const { role } = useAuth();
    const [selectedEscala, setSelectedEscala] = useState<number | undefined>(undefined);

    // We need vigilantes list. We can fetch from aux data or reuse hook
    const { vigilantes } = useAlocacao(selectedEscala || 0);

    const { pendentes, solicitar, responder } = useFolgas(selectedEscala);

    // Form State
    const [vigilanteId, setVigilanteId] = useState('');
    const [data, setData] = useState('');

    const handleSolicitar = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedEscala || !vigilanteId || !data) return;
        try {
            await solicitar(Number(vigilanteId), data);
            alert('Solicitação enviada!');
            setVigilanteId('');
            setData('');
        } catch (err: any) {
            alert(err.message);
        }
    };

    return (
        <div className={styles.container}>
            <h1>Gestão de Folgas</h1>

            <div className={styles.controls}>
                <label>Selecione a Escala:</label>
                <select
                    value={selectedEscala}
                    onChange={e => setSelectedEscala(Number(e.target.value))}
                    className={styles.select}
                >
                    <option value="">Selecione...</option>
                    {escalas.map(esc => (
                        <option key={esc.id} value={esc.id}>
                            {esc.mes}/{esc.ano} ({esc.status})
                        </option>
                    ))}
                </select>
            </div>

            {selectedEscala && (
                <div className={styles.content}>
                    {/* Section 1: Request (User View) */}
                    <div className={styles.card}>
                        <h3>Solicitar Folga</h3>
                        <form onSubmit={handleSolicitar} className={styles.form}>
                            <div className={styles.field}>
                                <label>Vigilante:</label>
                                <select
                                    value={vigilanteId}
                                    onChange={e => setVigilanteId(e.target.value)}
                                    required
                                >
                                    <option value="">Selecione...</option>
                                    {vigilantes.map(v => (
                                        <option key={v.id} value={v.id}>{v.nome}</option>
                                    ))}
                                </select>
                            </div>
                            <div className={styles.field}>
                                <label>Data:</label>
                                <input
                                    type="date"
                                    value={data}
                                    onChange={e => setData(e.target.value)}
                                    required
                                />
                            </div>
                            <button type="submit" className={styles.btnSubmit}>Solicitar</button>
                        </form>
                    </div>

                    {/* Section 2: Manage (Fiscal View) */}
                    {role !== 'USER' && (
                        <div className={styles.card}>
                            <h3>Pendentes de Aprovação (Fiscal)</h3>
                            {pendentes.length === 0 ? <p>Nenhuma solicitação pendente.</p> : (
                                <table className={styles.table}>
                                    <thead>
                                        <tr>
                                            <th>Vigilante</th>
                                            <th>Data</th>
                                            <th>Ações</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {pendentes.map(p => (
                                            <tr key={p.id}>
                                                <td>{p.vigilantes?.nome}</td>
                                                <td>{new Date(p.data).toLocaleDateString()}</td>
                                                <td className={styles.actions}>
                                                    <button
                                                        className={styles.btnApprove}
                                                        onClick={() => responder(p.id, 'APROVADA')}
                                                    >
                                                        Aprovar
                                                    </button>
                                                    <button
                                                        className={styles.btnDeny}
                                                        onClick={() => responder(p.id, 'NEGADA')}
                                                    >
                                                        Negar
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
