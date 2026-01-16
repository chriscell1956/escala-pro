import { AlertTriangle, ShieldAlert } from 'lucide-react';
import styles from './AlertsPanel.module.css';

interface Props {
    conflitos: {
        setoresCriticosDescobertos: any[];
        campiBaixoEfetivo: any[];
    } | null;
}

export default function AlertsPanel({ conflitos }: Props) {
    if (!conflitos) return null;

    const hasCriticos = conflitos.setoresCriticosDescobertos.length > 0;
    const hasEfetivo = conflitos.campiBaixoEfetivo.length > 0;

    if (!hasCriticos && !hasEfetivo) return null;

    return (
        <div className={styles.container}>
            {hasCriticos && (
                <div className={styles.alertGroup}>
                    <h4 className={styles.titleCritico}>
                        <ShieldAlert size={16} /> Setores Críticos Descobertos
                    </h4>
                    <ul>
                        {conflitos.setoresCriticosDescobertos.map((s, i) => (
                            <li key={i}>{s.setor} ({s.campus})</li>
                        ))}
                    </ul>
                </div>
            )}

            {hasEfetivo && (
                <div className={styles.alertGroup}>
                    <h4 className={styles.titleEfetivo}>
                        <AlertTriangle size={16} /> Baixo Efetivo
                    </h4>
                    <ul>
                        {conflitos.campiBaixoEfetivo.map((c, i) => (
                            <li key={i}>{c.campus}: {c.cobertura}</li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
}
