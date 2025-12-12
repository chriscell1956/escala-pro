import React from 'react';
import { User } from '../../types';
import { Button, Icons, UnoesteSecurityLogo } from '../ui';
import { TEAM_OPTIONS } from '../../constants';

interface AppHeaderProps {
    user: User;
    month: number;
    setMonth: (m: number) => void;
    monthOptions: { value: number; label: string }[];
    isFutureMonth: boolean;
    viewingDraft: boolean;
    isSimulationMode: boolean;
    setIsSimulationMode: (v: boolean) => void;
    handleSaveDraft: () => void;
    commitSimulation: () => void;
    handleExitSimulation: () => void;
    handleLogout: () => void;
    setIsHelpModalOpen: (v: boolean) => void;
    setIsPasswordModalOpen: (v: boolean) => void;
    canEnterSimulation: boolean;
    canPrint: boolean;
    isMaster: boolean;
    canViewLogs: boolean;
    handleExport: () => void;
    setIsLogModalOpen: (v: boolean) => void;
    setIsUserMgmtModalOpen: (v: boolean) => void;
    fileInputRef: React.RefObject<HTMLInputElement>;
    teamsStatus: Record<string, { ready: boolean; percent: number; label: string }>;
    handleSendToSupervision: () => void;
    handleAddNextYear: () => void;
}

export const AppHeader = React.memo((props: AppHeaderProps) => {
    const {
        user, month, setMonth, monthOptions, handleAddNextYear,
        isFutureMonth, viewingDraft, isSimulationMode, setIsSimulationMode,
        handleSaveDraft, commitSimulation, handleExitSimulation,
        handleLogout, setIsHelpModalOpen, setIsPasswordModalOpen,
        canEnterSimulation, canPrint, isMaster, canViewLogs,
        handleExport, setIsLogModalOpen, setIsUserMgmtModalOpen, fileInputRef,
        teamsStatus, handleSendToSupervision
    } = props;

    return (
        <header className={`${isFutureMonth || viewingDraft ? 'bg-red-900 border-b-4 border-red-700' : 'bg-brand-800 border-b-4 border-gold-500'} text-white shadow-md z-20 print:hidden shrink-0 transition-colors duration-500`}>
            <div className="max-w-full mx-auto px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <UnoesteSecurityLogo className="w-8 h-10 sm:w-10 sm:h-12" />
                    <div className="leading-tight hidden sm:block">
                        <h1 className="font-bold text-xl tracking-tight text-white">SEGURANÇA</h1>
                        <div className={`text-[10px] font-bold tracking-wider uppercase ${isFutureMonth || viewingDraft ? 'text-red-200' : 'text-gold-400'}`}>VIGILÂNCIA UNIVERSITÁRIA</div>
                    </div>
                    <div className="leading-tight sm:hidden block">
                        <h1 className="font-bold text-lg tracking-tight text-white">ESCALA PRO</h1>
                    </div>
                </div>
                
                <div className="flex items-center gap-2 sm:gap-3">
                    {/* BARRA DE PROGRESSO (TERMÔMETRO) - Sempre visível para Master */}
                    {isMaster && (
                        <div className="hidden xl:flex items-center gap-2 bg-black/20 px-3 py-1 rounded-lg border border-white/10 mr-2 backdrop-blur-sm">
                            <span className={`text-[9px] uppercase font-bold tracking-wider ${isFutureMonth || viewingDraft ? 'text-red-200' : 'text-gold-200'}`}>Progresso:</span>
                            {TEAM_OPTIONS.filter(t => t !== 'ADM').map(t => {
                                const st = teamsStatus[t];
                                const colorClass = st.ready 
                                    ? 'bg-green-500 text-white shadow-[0_0_10px_rgba(34,197,94,0.6)]' 
                                    : st.percent > 90 
                                        ? 'bg-blue-500 text-white animate-pulse' 
                                        : st.percent > 40 
                                            ? 'bg-yellow-500 text-black' 
                                            : 'bg-white/10 text-slate-300';

                                return (
                                    <div key={t} className="flex flex-col items-center group cursor-help relative">
                                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded min-w-[30px] text-center transition-all ${colorClass}`}>
                                            {t}: {st.percent}%
                                        </span>
                                        <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-black text-white text-[9px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap pointer-events-none z-50">
                                            {st.ready 
                                                ? '✅ Finalizado e Enviado' 
                                                : st.percent >= 99 
                                                    ? '⚠️ Aguardando Envio do Fiscal' 
                                                    : `Em andamento: ${st.label}`}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {isSimulationMode ? (
                        <div className="flex items-center gap-2 bg-red-800 text-white px-3 py-1.5 rounded-lg shadow-lg border border-red-700">
                            <span className="font-black text-xs uppercase hidden lg:inline mr-1 text-yellow-400 animate-pulse">
                                {isFutureMonth ? '🚧 PLANEJAMENTO (RASCUNHO):' : '✏️ EDITANDO:'}
                            </span>
                            <Button className="!py-2 !px-3 text-[10px] font-bold uppercase tracking-wide border border-red-600 bg-red-700 hover:!bg-red-600 text-white" onClick={handleSaveDraft} title="Salvar sem publicar para o usuário"><Icons.Cloud /> <span>SALVAR RASCUNHO</span></Button>
                            {user.role === 'FISCAL' && (
                                <Button className="!py-2 !px-3 text-[10px] font-bold uppercase tracking-wide border-none flex items-center gap-2 shadow-xl transition-all active:scale-95 !bg-blue-600 hover:!bg-blue-700 text-white" onClick={handleSendToSupervision}><span>📤 ENVIAR P/ SUPERVISÃO</span></Button>
                            )}
                            {isMaster && (
                                <Button className="!py-2 !px-3 text-[10px] font-bold uppercase tracking-wide border-none flex items-center gap-2 shadow-xl transition-all active:scale-95 !bg-brand-600 hover:!bg-brand-700 text-white" onClick={commitSimulation}><Icons.Check /> <span>PUBLICAR OFICIAL</span></Button>
                            )}
                            <Button variant="danger" className="!py-2 !px-3 text-[10px] font-bold uppercase" onClick={handleExitSimulation} title="Sair"><Icons.X /></Button>
                        </div>
                    ) : (
                        <div className="flex gap-1 sm:gap-2">
                            <Button className="!bg-white/10 !text-white border !border-white/30 hover:!bg-white/20 shadow-sm backdrop-blur-sm text-xs h-9" onClick={() => setIsHelpModalOpen(true)} title="Ajuda"><span className="hidden md:inline mr-1 font-bold">Ajuda</span><span>❓</span></Button>
                            {canEnterSimulation && (<Button className="!bg-white/10 !text-white border !border-white/30 hover:!bg-white/20 shadow-sm backdrop-blur-sm text-xs font-black uppercase tracking-wide h-9" onClick={() => setIsSimulationMode(true)} title="Modo Edição"><Icons.Edit /> <span className="hidden md:inline ml-1">EDITAR</span></Button>)}
                            {canPrint && (<Button className="!bg-white/10 !text-white border !border-white/30 hover:!bg-white/20 shadow-sm backdrop-blur-sm text-xs font-bold uppercase tracking-wide h-9" onClick={() => window.print()} title="Imprimir"><Icons.Printer /> <span className="hidden md:inline ml-1">IMPRIMIR</span></Button>)}
                            {isMaster && (<><Button variant="secondary" className="!p-2 text-brand-800 border-brand-200 h-9" onClick={handleExport} title="Baixar Backup"><span className="hidden md:inline font-bold text-[10px] tracking-wide">BAIXAR</span><span className="md:hidden"><Icons.Download /></span></Button><Button variant="secondary" className="!p-2 text-brand-800 border-brand-200 h-9" onClick={() => fileInputRef.current?.click()} title="Restaurar"><span className="hidden md:inline font-bold text-[10px] tracking-wide">IMPORTAR</span><span className="md:hidden"><Icons.Upload /></span></Button></>)}
                            {canViewLogs && (<Button variant="secondary" className="!p-2 text-brand-800 border-brand-200 h-9" onClick={() => setIsLogModalOpen(true)} title="Logs"><span className="hidden md:inline font-bold text-[10px] tracking-wide">LOGS</span><span className="md:hidden"><Icons.History /></span></Button>)}
                            {isMaster && (<Button variant="secondary" className="!p-2 text-brand-800 border-brand-200 bg-gold-400 hover:bg-gold-500 border-none hidden sm:flex h-9" onClick={() => setIsUserMgmtModalOpen(true)} title="Gestão de Usuários"><span className="hidden md:inline font-bold text-[10px] tracking-wide">USUÁRIOS</span><span className="md:hidden"><Icons.Users /></span></Button>)}
                        </div>
                    )}
                    <div className="h-8 w-px bg-white/20 mx-1 hidden sm:block"></div>
                    <div className="flex flex-col items-end">
                        <div className="flex items-center gap-1">
                            {viewingDraft ? (<span className="text-[10px] font-bold bg-gray-500 text-white px-1.5 rounded animate-pulse">RASCUNHO</span>) : isFutureMonth ? (<span className="text-[10px] font-bold bg-red-600 text-white px-1.5 rounded">FUTURO</span>) : (<span className="text-[10px] font-bold bg-green-500 text-white px-1.5 rounded">VIGENTE</span>)}
                            <div className="flex items-center bg-black/20 rounded-lg p-0.5">
                                <select value={month} onChange={(e) => setMonth(Number(e.target.value))} className="bg-transparent border-none text-white text-sm px-2 py-1 outline-none cursor-pointer font-bold appearance-none">
                                    {monthOptions.map((opt: any) => <option key={opt.value} value={opt.value} className="text-black">{opt.label}</option>)}
                                </select>
                                {isMaster && (
                                    <button onClick={handleAddNextYear} className="px-1 text-white/50 hover:text-white text-[10px] font-bold" title="Adicionar Próximo Ano">+ ANO</button>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="hidden lg:flex flex-col items-end text-right mr-1 cursor-pointer hover:opacity-80 transition-opacity" onClick={() => setIsPasswordModalOpen(true)} title="Alterar Senha"><span className="text-xs font-bold text-white flex items-center gap-1">{user.nome.split(' ')[0]} <span className="bg-black/30 px-1 rounded text-[9px] uppercase">{user.role}</span></span></div>
                    <button onClick={handleLogout} className="bg-black/20 hover:bg-red-600 text-white p-2 rounded-lg border border-white/10 ml-1 transition-colors" title="Sair"><Icons.X /></button>
                </div>
            </div>
            {(viewingDraft) && (<div className="bg-red-800 text-red-100 text-center text-xs font-bold py-1 uppercase tracking-widest shadow-inner border-t border-red-700 flex items-center justify-center gap-2"><span>📝 Você está visualizando/editando um RASCUNHO (Não visível para usuários)</span></div>)}
        </header>
    );
});