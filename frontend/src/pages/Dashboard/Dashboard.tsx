import { useNavigate } from 'react-router-dom';
import { useEscalas } from '../../hooks/useEscalas';
import { Briefcase, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import styles from './Dashboard.module.css';

export default function Dashboard() {
    const { escalas, loading, error } = useEscalas();
    const navigate = useNavigate();

    if (loading) return <div className={styles.loading}>Carregando dados...</div>;
    if (error) return <div className={styles.emptyState} style={{ color: 'var(--status-error)' }}>Erro ao carregar: {error}</div>;

    const escalasAtivas = escalas.filter(e => e.status === 'OFICIAL');
    const proximaEscala = escalas.find(e => e.status === 'PROVISORIA');

    // Mock stats for visual appeal
    const stats = [
        { label: 'Escalas Ativas', value: escalasAtivas.length, icon: CheckCircle, color: 'var(--status-ok)' },
        { label: 'Planejamento', value: proximaEscala ? 1 : 0, icon: Clock, color: 'var(--status-warning)' },
        { label: 'Vigilantes Total', value: '42', icon: Briefcase, color: 'var(--primary)' },
        { label: 'Alertas Pendentes', value: '3', icon: AlertTriangle, color: 'var(--status-error)' },
    ];

    return (
        <div className={styles.container}>
            <div className={styles.statsGrid}>
                {stats.map((stat, i) => (
                    <div key={i} className={styles.statCard}>
                        <div className={styles.statIcon} style={{ background: `${stat.color}15`, color: stat.color }}>
                            <stat.icon size={24} />
                        </div>
                        <div className={styles.statInfo}>
                            <span className={styles.statLabel}>{stat.label}</span>
                            <span className={styles.statValue}>{stat.value}</span>
                        </div>
                    </div>
                ))}
            </div>

            <div className={styles.section}>
                <h2>Em Planejamento</h2>
                {proximaEscala ? (
                    <div className={styles.scaleCard} onClick={() => navigate(`/alocacao/${proximaEscala.id}`)}>
                        <div className={styles.cardHeader}>
                            <h3>{proximaEscala.mes}/{proximaEscala.ano}</h3>
                            <span className={styles.badgeProv}>PROVISÓRIA</span>
                        </div>
                        <p style={{ color: 'var(--accent)' }}>Última edição: Hoje</p>
                    </div>
                ) : (
                    <div className={styles.emptyState}>Nenhuma escala em planejamento.</div>
                )}
            </div>

            <div className={styles.section}>
                <h2>Escalas Oficiais</h2>
                <div className={styles.grid}>
                    {escalasAtivas.length === 0 ? <p className={styles.emptyState}>Nenhuma escala oficial.</p> : escalasAtivas.map(e => (
                        <div key={e.id} className={styles.scaleCard} onClick={() => navigate(`/alocacao/${e.id}`)}>
                            <div className={styles.cardHeader}>
                                <h3>{e.mes}/{e.ano}</h3>
                                <span className={styles.badgeOficial}>OFICIAL</span>
                            </div>
                            <p style={{ color: 'var(--status-ok)' }}>Vigente</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
