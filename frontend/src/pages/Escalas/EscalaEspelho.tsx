import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Download, Filter } from 'lucide-react';
import { api } from '../../api';
import { format, getDaysInMonth, isWeekend } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import styles from './EscalaEspelho.module.css';

interface EspelhoItem {
    vigilante: {
        id: number;
        nome: string;
        matricula: string;
    };
    dias: Record<number, {
        tipo: 'TRABALHO' | 'FOLGA';
        posto?: string;
        sigla?: string;
        horario?: string;
    }>;
}

export default function EscalaEspelho() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<EspelhoItem[]>([]);
    const [escalaInfo, setEscalaInfo] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);

    // Filter state
    const [filterName, setFilterName] = useState('');

    useEffect(() => {
        loadData();
    }, [id]);

    async function loadData() {
        if (!id) return;
        setLoading(true);
        try {
            // Need scale info for Month/Year header -> Reuse existing list or fetch single?
            // Let's fetch the list and find the scale for now, simpler.
            const scalesRes = await api.get('/escalas');
            const currentScale = scalesRes.data.find((e: any) => e.id === Number(id));
            setEscalaInfo(currentScale);

            // Fetch Grid
            const res = await api.get(`/escalas/${id}/espelho`);
            setData(res.data);

        } catch (err: any) {
            setError(err.response?.data?.error || 'Erro ao carregar escala.');
        } finally {
            setLoading(false);
        }
    }

    const daysArray = useMemo(() => {
        if (!escalaInfo) return [];
        const daysInMonth = getDaysInMonth(new Date(escalaInfo.ano, escalaInfo.mes - 1));
        return Array.from({ length: daysInMonth }, (_, i) => i + 1);
    }, [escalaInfo]);

    const filteredData = useMemo(() => {
        return data.filter(item =>
            item.vigilante.nome.toLowerCase().includes(filterName.toLowerCase())
        );
    }, [data, filterName]);

    if (loading) return <div className={styles.centerMsg}>Carregando Espelho...</div>;
    if (error) return <div className={styles.centerMsg}>{error}</div>;
    if (!escalaInfo) return <div className={styles.centerMsg}>Escala não encontrada.</div>;

    const dateObj = new Date(escalaInfo.ano, escalaInfo.mes - 1);

    return (
        <div className={styles.container}>
            {/* Header */}
            <div className={styles.header}>
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/escalas')}
                        className="p-2 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white transition-colors"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div className={styles.headerTitle}>
                        <span className={styles.titleMain}>Escala Mensal {escalaInfo.ano}</span>
                        <span className={styles.titleSub}>{format(dateObj, 'MMMM', { locale: ptBR })} • {escalaInfo.status}</span>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="relative">
                        <Filter size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                        <input
                            type="text"
                            placeholder="Filtrar Vigilante..."
                            className="bg-slate-800 border-none rounded-full py-1.5 pl-10 pr-4 text-sm text-white placeholder-slate-500 focus:ring-1 focus:ring-blue-500 outline-none w-64"
                            value={filterName}
                            onChange={e => setFilterName(e.target.value)}
                        />
                    </div>
                    <button className="flex items-center gap-2 text-sm font-bold text-emerald-500 hover:text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 px-4 py-1.5 rounded transition-colors">
                        <Download size={16} /> EXPORTAR
                    </button>
                </div>
            </div>

            {/* Grid Area */}
            <div className={styles.gridContainer}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th className={styles.thVigilante}>VIGILANTE</th>
                            {daysArray.map(day => {
                                const isWk = isWeekend(new Date(escalaInfo.ano, escalaInfo.mes - 1, day));
                                return (
                                    <th key={day} className={`${styles.thDay} ${isWk ? styles.weekend : ''}`}>
                                        {day}
                                    </th>
                                );
                            })}
                        </tr>
                    </thead>
                    <tbody>
                        {filteredData.map(item => (
                            <tr key={item.vigilante.id} className={styles.tr}>
                                <td className={styles.tdVigilante} title={item.vigilante.nome}>
                                    {item.vigilante.nome}
                                </td>
                                {daysArray.map(day => {
                                    const cell = item.dias[day];
                                    const isWk = isWeekend(new Date(escalaInfo.ano, escalaInfo.mes - 1, day));

                                    if (cell && cell.tipo === 'TRABALHO') {
                                        return (
                                            <td
                                                key={day}
                                                className={`${styles.tdDay} ${styles.cellWork} ${styles[cell.sigla || 'PT']}`}
                                                title={`${cell.posto} (${cell.horario})`}
                                            >
                                                {cell.sigla || 'PT'}
                                            </td>
                                        );
                                    } else {
                                        return (
                                            <td key={day} className={`${styles.tdDay} ${styles.cellEmpty} ${isWk ? 'bg-slate-800/30' : ''}`}>
                                                {/* Empty / Folga */}
                                            </td>
                                        );
                                    }
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
