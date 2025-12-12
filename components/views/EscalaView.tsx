import React from 'react';
import { Vigilante, User } from '../../types';
import { TEAM_OPTIONS } from '../../constants';
import { Button, Icons, Badge } from '../ui';

interface EscalaViewProps {
    groupedData: Record<string, Vigilante[]>;
    conflicts: any[];
    user: User | null;
    isUser: boolean;
    isFiscal: boolean;
    isMaster: boolean;
    currentUserVig: Vigilante | undefined;
    currentLabel: string;
    searchTerm: string;
    setSearchTerm: (v: string) => void;
    filterEq: string;
    setFilterEq: (v: string) => void;
    filterDay: string;
    handleOpenCoverage: (dia: number, campus: string, equipe: string) => void;
    handleReturnFromAway: (vig: Vigilante) => void;
    handleRemoveCoverage: (vig: Vigilante, dia: number) => void;
}

export const EscalaView = React.memo((props: EscalaViewProps) => {
    const {
        groupedData, conflicts, user, isUser, isFiscal, isMaster, currentUserVig,
        currentLabel, searchTerm, setSearchTerm, filterEq, setFilterEq, filterDay,
        handleOpenCoverage, handleReturnFromAway, handleRemoveCoverage
    } = props;

    return (
        <div className="h-full flex flex-col">
            {!isUser && (
                <div className="p-2 bg-white border-b flex gap-2 print:hidden items-center">
                    <div className="flex items-center bg-slate-100 rounded-lg border border-slate-200 px-3 py-1.5 w-fit shadow-sm focus-within:ring-2 focus-within:ring-brand-200 focus-within:border-brand-300 transition-all">
                        <div className="text-slate-400 mr-2"><Icons.Search /></div>
                        <input type="text" placeholder="Pesquisar..." className="bg-transparent border-none text-sm w-32 md:w-48 focus:outline-none placeholder:text-slate-400 font-medium text-slate-700" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                        {user?.role !== 'FISCAL' && (
                            <>
                                <div className="w-px h-5 bg-slate-300 mx-2"></div>
                                <select value={filterEq} onChange={e => setFilterEq(e.target.value)} className="bg-transparent border-none text-sm font-bold text-slate-600 focus:outline-none cursor-pointer hover:text-brand-600">
                                    <option value="TODAS">Todas Equipes</option>
                                    {TEAM_OPTIONS.map(t => <option key={t} value={t}>Equipe {t}</option>)}
                                    <option value="AFASTADOS">✈️ Afastados</option>
                                </select>
                            </>
                        )}
                    </div>
                </div>
            )}
            <div className="flex-1 overflow-y-auto p-4 print:overflow-visible print:h-auto">
                {isUser && (
                    <div className="mb-6 bg-white border-l-4 border-brand-500 shadow-sm rounded-r-xl p-4">
                        <h2 className="text-lg font-bold text-gray-800">Olá, {user?.nome.split(' ')[0]}</h2>
                        <p className="text-sm text-gray-500 mb-3">Aqui está o resumo da sua escala para {currentLabel}.</p>
                        {currentUserVig?.folgasGeradas?.length ? (<div className="bg-red-50 border border-red-100 rounded-lg p-3 inline-block"><div className="text-xs font-bold text-red-800 uppercase tracking-wide mb-1">📅 SUAS FOLGAS EXTRAS NESTE MÊS</div><div className="text-lg font-black text-red-600">Dias: {currentUserVig.folgasGeradas.join(', ')}</div></div>) : (<div className="text-sm text-gray-400 italic">Nenhuma folga extra definida para este mês.</div>)}
                        {currentUserVig?.status === 'RECUPERADO' && (
                            <div className="mt-2 bg-blue-50 text-blue-800 text-xs p-2 rounded border border-blue-200">
                                ℹ️ <b>Nota:</b> Exibindo escala base (Offline/Backup). Conecte-se para ver atualizações recentes.
                            </div>
                        )}
                    </div>
                )}

                {Object.keys(groupedData).length === 0 && isUser && !currentUserVig && (
                    <div className="p-8 text-center text-gray-500 bg-white rounded-lg border border-dashed border-gray-300">
                        <p>Sua escala para este mês ainda não foi encontrada ou publicada.</p>
                    </div>
                )}
                {Object.keys(groupedData).sort().map(campus => {
                    let currentConflictsForCampus = conflicts.filter((c: any) => c.campus === campus);
                    if (user?.role === 'FISCAL' && currentUserVig) {
                        currentConflictsForCampus = currentConflictsForCampus.filter((c: any) => c.equipe === currentUserVig.eq);
                    }
                    return (
                    <div key={campus} className="mb-6 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden break-inside-avoid print:shadow-none print:border-none print:mb-4">
                        <div className="bg-brand-50 px-4 py-2 border-b border-brand-100 font-bold text-sm text-brand-800 flex items-center gap-2 print:bg-gray-100 print:border-gray-300 print:text-black"><div className="w-1.5 h-4 bg-gold-500 rounded-full print:bg-black"></div> {campus}</div>
                        {currentConflictsForCampus.length > 0 && (isFiscal || isMaster) && (
                            <div className="bg-red-50 border-b border-red-200 p-3 print:hidden animate-fade-in">
                                <div className="flex items-center gap-2 mb-2"><span className="text-2xl">⚠️</span><span className="font-bold text-xs text-red-800 uppercase tracking-wider">Alerta de Efetivo Baixo (Regra 50%)</span></div>
                                <div className="flex flex-wrap gap-2">{currentConflictsForCampus.map((c: any, idx: number) => (<div key={idx} className="bg-white border border-red-200 rounded-lg p-2 flex items-center gap-3 shadow-sm"><div className="flex flex-col items-center leading-none border-r border-red-100 pr-3"><span className="text-[10px] text-red-400 font-bold uppercase">Dia</span><span className="text-lg font-black text-red-700">{c.dia}</span></div><div className="flex flex-col"><div className="flex items-center gap-1"><span className="text-xs text-red-800 font-bold">Equipe</span><Badge team={c.equipe} /></div><span className="text-[9px] text-red-500">{c.msg}</span></div><button onClick={() => handleOpenCoverage(c.dia, c.campus, c.equipe)} className="ml-1 bg-red-600 hover:bg-red-700 text-white text-[10px] font-bold px-3 py-1.5 rounded shadow-sm transition-all active:scale-95">RESOLVER</button></div>))}</div>
                            </div>
                        )}
                        <div className="overflow-x-auto print:block print:overflow-visible">
                            <table className="w-full text-left text-sm min-w-[600px] md:min-w-0">
                                <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 font-medium print:bg-gray-200 print:text-black"><tr><th className="px-4 py-3">NOME</th><th className="px-4 py-3 w-10 text-center">EQ</th><th className="px-4 py-3 w-16">MAT</th><th className="px-4 py-3">STATUS / ESCALA</th><th className="px-4 py-3 w-24">HORÁRIO</th></tr></thead>
                                <tbody className="divide-y divide-slate-100">
                                    {(groupedData[campus] as (Vigilante & { displayStatus?: any })[]).map((vig, i) => {
                                        const isAfastado = vig.campus === 'AFASTADOS';
                                        return (
                                            <tr key={vig.mat} className={`${isAfastado ? 'bg-amber-50 border-l-4 border-amber-400' : 'even:bg-slate-200 odd:bg-white hover:bg-blue-100'} border-b border-slate-200 text-sm print:bg-white print:border-black transition-colors`}>
                                                <td className="px-4 py-4"><div className="font-bold text-slate-800 text-base">{vig.nome}</div><div className="text-xs text-slate-500">{vig.setor}</div></td>
                                                <td className="px-4 py-4 text-center"><Badge team={vig.eq} /></td>
                                                <td className="px-4 py-4 font-mono text-slate-500 font-medium">{vig.mat}</td>
                                                <td className="px-4 py-4">{isAfastado ? (<div className="flex justify-between items-center"><span className="font-bold text-amber-900">{vig.status}: {vig.obs}</span>{isFiscal && <Button variant="secondary" className="px-2 py-0.5 text-[10px] h-6 bg-white border border-amber-300 hover:bg-amber-50 print:hidden" onClick={() => handleReturnFromAway(vig)}>Retornar</Button>}</div>) : (<div className="flex flex-col gap-1">{filterDay && vig.displayStatus && vig.displayStatus.active && (<div className="mb-1"><span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border shadow-sm ${vig.displayStatus.variant === 'success' ? 'bg-green-100 text-green-700 border-green-200' : vig.displayStatus.variant === 'warning' ? 'bg-orange-100 text-orange-700 border-orange-200' : 'bg-gray-100 text-gray-500'}`}>{vig.displayStatus.status}</span></div>)}<div className="leading-tight text-xs"><span className="text-slate-800 font-semibold tracking-tight"><span className="text-[10px] text-slate-400 font-normal mr-1">DIAS:</span>{vig.dias?.join(', ')}</span>{vig.folgasGeradas?.length > 0 && (<div className="mt-1"><span className="text-[10px] font-black bg-red-100 text-red-700 px-2 py-0.5 rounded border border-red-200 inline-block tracking-wide mr-1">FOLGAS: {vig.folgasGeradas.join(', ')}</span></div>)}{vig.vacation && <div className="mt-0.5 text-[10px] bg-yellow-100 text-yellow-800 px-1 rounded w-fit border border-yellow-200 font-bold print:border-black print:text-black">FÉRIAS: {vig.vacation.start} a {vig.vacation.end}</div>}{vig.coberturas?.map((c, idx) => { const isInterval = c.tipo === 'INTERVALO'; return (<div key={idx} className={`mt-1 text-[10px] px-2 py-1 rounded border font-bold flex items-center justify-between gap-2 cursor-pointer hover:opacity-80 transition-opacity max-w-fit ${isInterval ? "bg-orange-100 text-orange-800 border-orange-200" : "bg-blue-100 text-blue-800 border-blue-200"}`} onClick={() => handleRemoveCoverage(vig, c.dia)}><div className="flex flex-col leading-tight"><span className="uppercase text-[9px] opacity-75">{isInterval ? 'COB. INTERVALO' : c.tipo}</span><span>Dia {c.dia} ➜ {c.local}</span></div><div className="bg-white/50 rounded-full p-0.5 hover:bg-red-500 hover:text-white transition-colors"><Icons.X /></div></div>) })}</div></div>)}</td>
                                                <td className="px-4 py-4 text-xs text-slate-500"><div className="font-bold text-sm text-slate-700">{vig.horario}</div><div>Ref: {vig.refeicao}</div></td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                    );
                })}
            </div>
        </div>
    );
});