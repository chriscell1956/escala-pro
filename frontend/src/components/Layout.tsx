import React from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTime } from '../contexts/TimeContext';
import { usePostos } from '../hooks/usePostos';
import styles from './Layout.module.css';
import {
    LayoutDashboard,
    CalendarDays,
    Users,
    Coffee,
    MonitorPlay,
    HelpCircle,
    Printer,
    Edit,
    Download,
    Upload,
    FileText,
    MapPin,
    Shield,
    Clock,
    Trash2,
    AlertTriangle,
    LogOut
} from 'lucide-react';
import { Toaster, toast } from 'react-hot-toast';
import { Modal } from './Modal';
import { PostoForm } from './PostoForm';

export default function Layout() {
    const { user, role, logout } = useAuth();
    // ...
    // Note: I can't put Toaster inside return here easily without seeing the return statement start. 
    // I will add Toaster in a separate replacement or find "return (" line.
    // Actually, I can add it inside the "return (" block in next step.
    // For now, just imports.
    const location = useLocation();
    const navigate = useNavigate();
    const { currentTime, isSimulation, setSimulationMode, setLiveMode } = useTime();
    const { postos, criarPosto, deletarPosto, atualizarPosto, error } = usePostos();

    // -- State --
    const [editingPostoId, setEditingPostoId] = React.useState<number | null>(null);
    const [activeModal, setActiveModal] = React.useState<string | null>(null);
    const [simDate, setSimDate] = React.useState('');
    const [simTime, setSimTime] = React.useState('');

    // Post Manager Form State
    const [showNewPostoForm, setShowNewPostoForm] = React.useState(false);
    const [newPosto, setNewPosto] = React.useState({
        nome: '',
        campus: 'CAMPUS I',
        equipe: 'A',
        jornada_nome: '12x36',
        hora_inicio: '06:00',
        hora_fim: '18:00',
        refeicao: '12:00 - 13:00'
    });

    // -- Helpers --
    const isActive = (path: string) => {
        if (path === '/alocacao/current' && location.pathname.includes('alocacao')) return true;
        return location.pathname.startsWith(path);
    };

    const toggleTimeMode = () => {
        if (isSimulation) {
            setLiveMode();
        } else {
            const now = new Date();
            setSimDate(now.toISOString().split('T')[0]);
            setSimTime(now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }));
            setActiveModal('time_sim');
        }
    };

    const handleSimulationSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (simDate && simTime) {
            const [y, m, d] = simDate.split('-').map(Number);
            const [h, min] = simTime.split(':').map(Number);
            const newDate = new Date(y, m - 1, d, h, min);
            setSimulationMode(newDate);
            setActiveModal(null);
        }
    };

    const handleCreatePosto = async () => {
        let res;
        if (editingPostoId) {
            res = await atualizarPosto(editingPostoId, newPosto);
        } else {
            res = await criarPosto(newPosto);
        }

        if (res.success) {
            setShowNewPostoForm(false);
            setEditingPostoId(null);
            setNewPosto({ ...newPosto, nome: '' });
        } else {
            alert(res.error);
        }
    };

    const handleEditClick = (posto: any) => {
        setEditingPostoId(posto.id);
        setNewPosto({
            nome: posto.setores.nome,
            campus: posto.setores.campus,
            equipe: posto.setores.equipe,
            jornada_nome: posto.jornadas.nome,
            hora_inicio: posto.horarios.hora_inicio.slice(0, 5),
            hora_fim: posto.horarios.hora_fim.slice(0, 5),
            refeicao: posto.refeicao
        });
        setShowNewPostoForm(true);
    };

    const handleCancelForm = () => {
        setShowNewPostoForm(false);
        setEditingPostoId(null);
        setNewPosto({
            nome: '',
            campus: 'CAMPUS I',
            equipe: 'A',
            jornada_nome: '12x36',
            hora_inicio: '06:00',
            hora_fim: '18:00',
            refeicao: '12:00 - 13:00'
        });
    };

    // -- Indicators --
    const [metrics, setMetrics] = React.useState([
        { label: 'A:', val: '-', color: '#f97316' },
        { label: 'B:', val: '-', color: '#f97316' },
        { label: 'C:', val: '-', color: '#f97316' },
        { label: 'D:', val: '-', color: '#f97316' },
        { label: 'ECO1:', val: '-', color: '#64748b' },
        { label: 'ECO2:', val: '-', color: '#64748b' },
    ]);

    React.useEffect(() => {
        const fetchIndicadores = async () => {
            // For now static month/year or derived from current context.
            // Ideally we pass context year/month. Defaulting to current date or params.
            try {
                const now = new Date();
                const u = new URLSearchParams({
                    ano: now.getFullYear().toString(),
                    mes: (now.getMonth() + 1).toString()
                });

                // Assuming api imported or fetch used directly
                // We need to import api from '../api' if not present or use fetch.
                // Assuming 'api' helper is available or standard fetch.
                // Checking imports... 'useAuth', 'useTime', 'usePostos', 'api'?
                // 'api' is not imported in Layout.tsx shown above. Let's add it or use fetch directly.
                // I'll assume axios 'api' is standard in this project (seen in usePostos).

                // Using fetch for safety if api import missing, but let's try to add import if needed.
                // Actually easier to just use fetch with VITE_API_URL or relative /api if proxy setup.
                // Let's use relative path finding.

                const response = await fetch(`http://localhost:3000/api/vigilantes/indicadores?${u.toString()}`);
                if (!response.ok) return;
                const data = await response.json();
                setMetrics(data);
            } catch (e) {
                console.error("Failed to fetch indicators", e);
            }
        };

        fetchIndicadores();
        const interval = setInterval(fetchIndicadores, 10000); // 10s refresh

        window.addEventListener('refresh-indicators', fetchIndicadores);

        return () => {
            clearInterval(interval);
            window.removeEventListener('refresh-indicators', fetchIndicadores);
        };
    }, []);

    const navTabs = [
        { label: 'ESCALA', path: '/escalas', activeColor: 'blue' },
        { label: 'LANÇADOR', path: '/alocacao/current', activeColor: 'purple' },
        { label: 'INTERVALOS', path: '/intervalos', activeColor: 'blue' },
        { label: 'MONITORAMENTO', path: '/monitoramento', activeColor: 'red' },
        { label: 'SOLICITAÇÕES', path: '/solicitacoes', activeColor: 'blue' },
    ];

    // ...

    return (
        <div className={styles.container}>
            <Toaster position="top-right" toastOptions={{ duration: 4000 }} />
            {/* HEADER ROW */}
            <header className={styles.header}>
                <div className={styles.brandArea}>
                    <div className={styles.brandTitle}>
                        <div>VIGILÂNCIA</div>
                        <div style={{ color: '#fff' }}>UNIVERSITÁRIA</div>
                    </div>
                    <div className={styles.brandSub}>PROG:</div>
                </div>

                <div className={styles.progsContainer}>
                    {metrics.map((m: any, i) => (
                        <div key={i} className={styles.progBadge} style={{ background: m.color }} title={m.details}>
                            <label>{m.label}</label>
                            <span>{m.val}</span>
                        </div>
                    ))}
                </div>

                <div className={styles.actionsArea}>
                    <button className={styles.actionBtn} style={{ background: '#047857' }}>AJUDA ?</button>
                    <button className={styles.actionBtn + ' ' + styles.green}><Edit size={12} /> EDITAR</button>
                    <button className={styles.actionBtn + ' ' + styles.green}><Printer size={12} /> IMPRIMIR</button>
                    <button className={styles.actionBtn + ' ' + styles.green}><Download size={12} /> BAIXAR</button>
                    <button className={styles.actionBtn + ' ' + styles.green}><Upload size={12} /> IMPORTAR</button>
                    <button className={styles.actionBtn + ' ' + styles.green}>LOGS</button>
                    <button onClick={() => setActiveModal('usuarios')} className={styles.actionBtn + ' ' + styles.green}>USUÁRIOS</button>
                    <button onClick={() => setActiveModal('postos')} className={styles.actionBtn + ' ' + styles.green}>POSTOS</button>
                    <button onClick={() => setActiveModal('vigilantes')} className={styles.actionBtn + ' ' + styles.green}>VIGILANTES</button>

                    <button onClick={logout} className={styles.actionBtn + ' bg-red-800 hover:bg-red-700 text-white flex gap-1 items-center px-2'}>
                        <LogOut size={12} /> SAIR
                    </button>

                    <div className={styles.userBadge}>
                        <div className={styles.vigenteTag}><MapPin size={8} /> VIGENTE</div>
                        <span className="text-white text-[10px] font-bold">JAN 26</span>
                        <div style={{ borderLeft: '1px solid #ffffff40', height: '14px', margin: '0 4px' }}></div>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', lineHeight: '1' }}>
                            <span className={styles.userName}>{(user?.nome || 'CHRISTIANO').split(' ')[0]}</span>
                            <span style={{ fontSize: '0.55rem', color: '#fbbf24' }}>{role}</span>
                        </div>
                    </div>
                </div>
            </header>

            {/* NAV ROW */}
            <nav className={styles.navBar}>
                {navTabs.map(tab => (
                    <button
                        key={tab.label}
                        className={`${styles.navItem} ${isActive(tab.path) ? styles.navItemActive : ''}`}
                        onClick={() => navigate(tab.path)}
                    >
                        {tab.label === 'INTERVALOS' && <Coffee size={12} style={{ marginRight: 4 }} />}
                        {tab.label === 'MONITORAMENTO' && <MonitorPlay size={12} style={{ marginRight: 4 }} />}
                        {tab.label}
                    </button>
                ))}

                <button onClick={() => setActiveModal('ferias')} className={styles.navItem + ' ' + styles.special}>
                    <Coffee size={12} style={{ marginRight: 4 }} /> GESTÃO DE FÉRIAS
                </button>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: '1rem', background: '#1f2937', padding: '4px 8px', borderRadius: '4px', border: '1px solid #374151' }}>
                    <span style={{ fontSize: '0.7rem', color: '#6b7280' }}>PLANTÃO:</span>
                    <span style={{ fontSize: '0.7rem', color: '#d1d5db', padding: '0 4px', background: '#374151', borderRadius: '2px' }}>Dia</span>
                    <span style={{ fontSize: '0.7rem', color: '#d1d5db' }}>{currentTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                    <Clock size={12} color={isSimulation ? '#3b82f6' : '#16a34a'} />
                </div>

                <div
                    className={styles.liveBadge}
                    style={{ background: isSimulation ? '#0ea5e9' : '#16a34a', cursor: 'pointer' }}
                    onClick={toggleTimeMode}
                    title={isSimulation ? "Modo Simulação (Clique para voltar ao Vivo)" : "Modo Ao Vivo (Clique para Simular)"}
                >
                    {isSimulation ? 'SIMULAÇÃO' : 'AO VIVO'}
                    <Clock size={12} className={!isSimulation ? "animate-pulse" : ""} />
                </div>
            </nav>

            <main className={styles.main}>
                <Outlet />
            </main>

            {/* MODAL: TIME SIMULATION */}
            <Modal isOpen={activeModal === 'time_sim'} onClose={() => setActiveModal(null)} title="Controle de Simulação Temporal" width="400px">
                <form onSubmit={handleSimulationSubmit} className="space-y-4">
                    <div className="bg-blue-500/10 border border-blue-500/20 text-blue-400 p-3 rounded mb-4 text-xs">
                        Defina uma data e hora para simular o estado do sistema. Isso afetará Intervalos e Monitoramento.
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-400 mb-1 uppercase">Data Simulada</label>
                        <input
                            type="date"
                            required
                            value={simDate}
                            onChange={e => setSimDate(e.target.value)}
                            className="w-full bg-slate-800 border border-slate-600 rounded px-3 py-2 text-white"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-400 mb-1 uppercase">Hora Simulada</label>
                        <input
                            type="time"
                            required
                            value={simTime}
                            onChange={e => setSimTime(e.target.value)}
                            className="w-full bg-slate-800 border border-slate-600 rounded px-3 py-2 text-white"
                        />
                    </div>
                    <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 rounded uppercase tracking-wide text-sm">
                        ATIVAR SIMULAÇÃO
                    </button>
                </form>
            </Modal>

            {/* MODAL: USERS */}
            <Modal isOpen={activeModal === 'usuarios'} onClose={() => setActiveModal(null)} title="Gestão de Usuários" width="600px">
                <div className="space-y-4">
                    <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-700">
                        <h4 className="text-xs font-bold text-slate-400 uppercase mb-3">Novo Usuário</h4>
                        <div className="grid grid-cols-2 gap-3 mb-3">
                            <input type="text" placeholder="Matricula" className="w-full bg-slate-800 border border-slate-600 rounded px-3 py-2 text-sm text-white" />
                            <input type="text" placeholder="Nome Completo" className="w-full bg-slate-800 border border-slate-600 rounded px-3 py-2 text-sm text-white" />
                        </div>
                        <div className="grid grid-cols-2 gap-2 mb-4">
                            <label className="flex items-center gap-2 text-xs text-slate-300"><input type="checkbox" /> Gerenciar Intervalos</label>
                            <label className="flex items-center gap-2 text-xs text-slate-300"><input type="checkbox" /> Ver Logs</label>
                            <label className="flex items-center gap-2 text-xs text-slate-300"><input type="checkbox" /> Imprimir</label>
                            <label className="flex items-center gap-2 text-xs text-slate-300"><input type="checkbox" /> Simular Escala</label>
                            <label className="flex items-center gap-2 text-xs text-slate-300"><input type="checkbox" /> Acesso CFTV (Monitoramento)</label>
                        </div>
                        <button className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 rounded text-sm transition-colors">CRIAR USUÁRIO</button>
                    </div>

                    <div className="relative">
                        <input type="text" placeholder="Buscar usuário..." className="w-full bg-slate-800 border border-slate-600 rounded px-3 py-2 text-sm text-white mb-2" />
                        <div className="space-y-1 max-h-[300px] overflow-y-auto">
                            {['ADALBERTO CALIXTO', 'ADEILDO ROSA ARAUJO', 'ADRIANO CANDUCCI', 'ADRIANO JOSÉ DA SILVA'].map(u => (
                                <div key={u} className="flex items-center justify-between bg-slate-800 p-2 rounded border border-slate-700">
                                    <div className="flex flex-col">
                                        <span className="text-sm font-bold text-white">{u}</span>
                                        <span className="text-[10px] text-slate-400">USER</span>
                                    </div>
                                    <div className="flex gap-1">
                                        <button className="p-1 hover:bg-slate-700 rounded text-amber-500"><Shield size={14} /></button>
                                        <button className="p-1 hover:bg-slate-700 rounded text-slate-400"><Edit size={14} /></button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </Modal>

            {/* MODAL: FERIAS */}
            <Modal isOpen={activeModal === 'ferias'} onClose={() => setActiveModal(null)} title="Gestão Centralizada de Férias" width="500px">
                <div className="bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 p-3 rounded mb-4 text-xs">
                    Use este painel para lançar férias antes de liberar a escala para os fiscais. Isso garante que os dias estarão bloqueados automaticamente.
                </div>
                <div className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-400 mb-1 uppercase">Vigilante (Matrícula ou Nome):</label>
                        <input type="text" placeholder="Digite para buscar..." className="w-full bg-slate-800 border border-slate-600 rounded px-3 py-2 text-white" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-bold text-slate-400 mb-1 uppercase">Dia Início:</label>
                            <input type="date" className="w-full bg-slate-800 border border-slate-600 rounded px-3 py-2 text-white" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-400 mb-1 uppercase">Dia Fim:</label>
                            <input type="date" className="w-full bg-slate-800 border border-slate-600 rounded px-3 py-2 text-white" />
                        </div>
                    </div>
                    <button className="w-full bg-amber-600 hover:bg-amber-500 text-white font-bold py-2 rounded uppercase tracking-wide text-sm">LANÇAR FÉRIAS</button>
                </div>
            </Modal>

            {/* MODAL: POSTOS */}
            <Modal isOpen={activeModal === 'postos'} onClose={() => setActiveModal(null)} title="Gerenciador de Postos" width="1100px">
                {/* Error Banner */}
                {error && (
                    <div className="bg-red-900/50 border border-red-500 text-red-200 p-3 rounded mb-4 text-sm flex items-center gap-2">
                        <AlertTriangle size={16} />
                        <span>Erro ao carregar postos: {error}. Tente fazer login novamente.</span>
                    </div>
                )}
                <div className="flex justify-between items-center mb-4">
                    <button
                        className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-1.5 px-4 rounded text-sm flex items-center gap-2"
                        onClick={() => {
                            if (showNewPostoForm) {
                                handleCancelForm();
                            } else {
                                handleCancelForm(); // Clear state FIRST
                                setShowNewPostoForm(true); // Then show
                            }
                        }}
                    >
                        {showNewPostoForm ? 'Cancelar' : '+ Novo Posto'}
                    </button>
                    {!showNewPostoForm && (
                        <input type="text" placeholder="Buscar..." className="w-[300px] bg-slate-800 border border-slate-600 rounded px-3 py-1.5 text-sm text-white" />
                    )}
                </div>

                {showNewPostoForm && (
                    <PostoForm
                        initialData={newPosto}
                        onSubmit={async (data) => {
                            let res;
                            if (editingPostoId) {
                                res = await atualizarPosto(editingPostoId, data);
                            } else {
                                res = await criarPosto(data);
                            }

                            if (res.success) {
                                toast.success(editingPostoId ? 'Posto atualizado!' : 'Posto criado com sucesso!', { style: { background: '#059669', color: '#fff' } });
                                setShowNewPostoForm(false);
                                setEditingPostoId(null);
                            } else {
                                toast.error(res.error || 'Erro ao salvar', { style: { background: '#dc2626', color: '#fff' } });
                            }
                        }}
                        onCancel={handleCancelForm}
                        isEditing={!!editingPostoId}
                    />
                )}

                <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-2">
                    {postos.map((p, i) => (
                        <div key={i} className="bg-slate-800/50 border border-slate-700/50 p-3 rounded flex items-center justify-between">
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="font-bold text-white text-lg">{p.setores?.nome}</span>
                                    <span className="text-[10px] font-bold bg-indigo-900 text-indigo-300 px-1.5 rounded uppercase">EQ: {p.setores?.equipe}</span>
                                </div>
                                <div className="grid grid-cols-2 gap-x-8 gap-y-1 text-xs text-slate-400">
                                    <div className="flex items-center gap-1"><MapPin size={10} className="text-pink-500" /> {p.setores?.campus}</div>
                                    <div className="flex items-center gap-1"><Clock size={10} className="text-red-400" /> {p.horarios?.hora_inicio.slice(0, 5)} - {p.horarios?.hora_fim.slice(0, 5)}</div>
                                    <div className="flex items-center gap-1"><Coffee size={10} className="text-indigo-400" /> {p.refeicao}</div>
                                    <div className="flex items-center gap-1 text-emerald-400 font-bold">{p.jornadas?.nome}</div>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button className="p-2 hover:bg-slate-700 rounded text-amber-500" onClick={() => handleEditClick(p)}><Edit size={16} /></button>
                                <button className="p-2 hover:bg-slate-700 rounded text-red-500" onClick={async () => {
                                    if (confirm('Deletar posto?')) {
                                        const res = await deletarPosto(p.id);
                                        if (res.success) toast.success('Posto removido!', { style: { background: '#059669', color: '#fff' } });
                                        else toast.error(res.error || 'Erro ao remover', { style: { background: '#dc2626', color: '#fff' } });
                                    }
                                }}><Trash2 size={16} /></button>
                            </div>
                        </div>
                    ))}
                    {postos.length === 0 && (
                        <div className="text-slate-500 text-center py-8 text-sm italic">
                            Nenhum posto cadastrado.
                        </div>
                    )}
                </div>

            </Modal >
        </div >
    );
}
