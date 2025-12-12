import React from 'react';
import { Vigilante, User } from '../../types';
import { TEAM_OPTIONS, SECTOR_OPTIONS } from '../../constants';
import { Button, Input, Select, Badge } from '../ui';
import { CalendarGrid } from '../common/CalendarGrid';

interface LancadorViewProps {
    showMobileEditor: boolean;
    setShowMobileEditor: (v: boolean) => void;
    currentLabel: string;
    user: User | null;
    selectedLancadorTeam: string;
    setSelectedLancadorTeam: (v: string) => void;
    lancadorSearch: string;
    setLancadorSearch: (v: string) => void;
    editingVig: Vigilante | null;
    setEditingVig: (v: Vigilante | null) => void;
    lancadorSummary: { total: number; ok: number; pending: number };
    lancadorList: Vigilante[];
    timeInputs: { hStart: string; hEnd: string; rStart: string; rEnd: string };
    setTimeInputs: (v: any) => void;
    editorMode: 'days' | 'vacation';
    setEditorMode: (v: 'days' | 'vacation') => void;
    handleSaveEditor: () => void;
    handleDeleteVigilante: () => void;
    handleToggleDay: (vig: Vigilante, day: number) => void;
    handleToggleVacation: (vig: Vigilante, day: number) => void;
    setIsNewVigModalOpen: (v: boolean) => void;
    handleSmartSuggest: () => void;
    month: number;
}

export const LancadorView = React.memo((props: LancadorViewProps) => {
    const { 
        showMobileEditor, setShowMobileEditor, currentLabel, user, 
        selectedLancadorTeam, setSelectedLancadorTeam, lancadorSearch, setLancadorSearch, 
        editingVig, setEditingVig, lancadorSummary, lancadorList, 
        timeInputs, setTimeInputs, editorMode, setEditorMode, 
        handleSaveEditor, handleDeleteVigilante, handleToggleDay, handleToggleVacation, 
        setIsNewVigModalOpen, handleSmartSuggest, month 
    } = props;

    return (
        <div className="flex flex-1 h-full overflow-hidden bg-slate-100 relative print:h-auto print:overflow-visible">
            <div className={`w-full md:w-[380px] bg-white border-r border-slate-200 flex flex-col shadow-xl z-20 shrink-0 h-full absolute md:relative top-0 left-0 bottom-0 transition-transform duration-300 ease-in-out ${showMobileEditor ? 'translate-x-0' : '-translate-x-full md:translate-x-0'} print:hidden`}>
                <div className="bg-slate-800 text-white p-4 text-center border-b border-slate-700 relative shrink-0">
                    <button onClick={() => setShowMobileEditor(false)} className="absolute left-4 top-1/2 -translate-y-1/2 md:hidden text-slate-300 hover:text-white p-2 rounded-full hover:bg-white/10">
                        <span className="text-xl font-bold">←</span>
                    </button>
                    <div className="text-[10px] font-bold opacity-60 uppercase tracking-widest">EDITANDO:</div>
                    <div className="text-xl font-black tracking-tight">{currentLabel}</div>
                </div>
                
                <div className="p-4 bg-slate-50 border-b border-slate-200 space-y-3 shrink-0">
                    {user?.role !== 'FISCAL' && (
                        <div>
                            <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">1. Filtrar Equipe:</label>
                            <Select value={selectedLancadorTeam} onChange={(e: any) => setSelectedLancadorTeam(e.target.value)} className="bg-white shadow-sm">
                                <option value="TODAS">-- Todas --</option>
                                {TEAM_OPTIONS.map(t => <option key={t} value={t}>Equipe {t}</option>)}
                            </Select>
                        </div>
                    )}
                    <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">2. Buscar Nome:</label>
                        <Input placeholder="Digite para filtrar a lista..." value={lancadorSearch} onChange={(e: any) => setLancadorSearch(e.target.value)} className="bg-white shadow-sm" />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 bg-slate-100 min-h-0">
                    {editingVig ? (
                        <div className="bg-white rounded-xl shadow-md border border-brand-200 overflow-hidden animate-fade-in">
                            <div className="bg-white p-4 border-b border-slate-100 text-center">
                                <h3 className="font-bold text-lg text-brand-800 leading-tight">{editingVig.nome}</h3>
                                <div className="text-xs text-slate-500 mt-1">{editingVig.mat} | Eq <Badge team={editingVig.eq} /></div>
                                {((editingVig.folgasGeradas || []).filter((f: number) => !(editingVig.dias || []).includes(f)).length > 0) && (
                                    <div className="mt-2 text-xs font-bold text-red-600">Folgas Extras: {(editingVig.folgasGeradas || []).filter((f: number) => !(editingVig.dias || []).includes(f)).length}</div>
                                )}
                            </div>
                            <div className="p-4 space-y-4">
                                <div>
                                    <label className="text-[10px] font-bold text-slate-700 block mb-1">Setor:</label>
                                    <Input list="sector-options" value={editingVig.setor} onChange={(e: any) => setEditingVig({...editingVig, setor: e.target.value.toUpperCase()})} className="h-8 text-xs" />
                                    <datalist id="sector-options">{SECTOR_OPTIONS.map(s => <option key={s} value={s} />)}</datalist>
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-slate-700 block mb-1">Horário:</label>
                                    <div className="flex items-center gap-2">
                                        <input type="time" className="flex-1 border rounded p-1.5 text-xs text-center font-bold" value={timeInputs.hStart} onChange={e => setTimeInputs({...timeInputs, hStart: e.target.value})} />
                                        <span className="text-[10px] font-bold text-slate-400">às</span>
                                        <input type="time" className="flex-1 border rounded p-1.5 text-xs text-center font-bold" value={timeInputs.hEnd} onChange={e => setTimeInputs({...timeInputs, hEnd: e.target.value})} />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-slate-700 block mb-1">Refeição:</label>
                                    <div className="flex items-center gap-2">
                                        <input type="time" className="flex-1 border rounded p-1.5 text-xs text-center font-bold" value={timeInputs.rStart} onChange={e => setTimeInputs({...timeInputs, rStart: e.target.value})} />
                                        <span className="text-[10px] font-bold text-slate-400">às</span>
                                        <input type="time" className="flex-1 border rounded p-1.5 text-xs text-center font-bold" value={timeInputs.rEnd} onChange={e => setTimeInputs({...timeInputs, rEnd: e.target.value})} />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-slate-700 block mb-1">Campus:</label>
                                    <select className="w-full text-xs border rounded p-1.5 bg-white" value={editingVig.campus} onChange={(e: any) => setEditingVig({...editingVig, campus: e.target.value})}>
                                        <option>CAMPUS I - DIURNO</option><option>CAMPUS I - NOTURNO</option><option>CAMPUS II - DIURNO</option><option>CAMPUS II - NOTURNO</option><option>CAMPUS III - DIURNO</option><option>CAMPUS III - NOTURNO</option><option>CHÁCARA DA REITORIA</option><option>LABORATÓRIO</option><option>OUTROS</option>
                                    </select>
                                </div>
                                <div className="border-t border-slate-100 pt-2 pb-1">
                                    <div className="flex bg-slate-100 rounded-lg p-1 gap-1">
                                        <button onClick={() => setEditorMode('days')} className={`flex-1 py-1.5 text-[10px] font-bold rounded-md transition-all ${editorMode === 'days' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>📅 DIAS</button>
                                        <button onClick={() => setEditorMode('vacation')} className={`flex-1 py-1.5 text-[10px] font-bold rounded-md transition-all ${editorMode === 'vacation' ? 'bg-amber-100 text-amber-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>🏖️ FÉRIAS</button>
                                    </div>
                                </div>
                                <CalendarGrid vig={editingVig} month={month} editorMode={editorMode} onToggleDay={handleToggleDay} onToggleVacation={handleToggleVacation} />
                                <div className="flex flex-col gap-2 pt-2 border-t border-slate-100">
                                    <div className="flex gap-2">
                                        <Button onClick={() => {setEditingVig(null); setShowMobileEditor(false);}} variant="secondary" className="flex-1 h-8 text-xs">Cancelar</Button>
                                        <Button onClick={handleSaveEditor} className="flex-1 h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-md">SALVAR</Button>
                                    </div>
                                    <Button onClick={handleDeleteVigilante} className="w-full h-8 text-xs bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 font-bold">EXCLUIR VIGILANTE</Button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-slate-400 p-8 text-center border-2 border-dashed border-slate-200 rounded-xl">
                            <div className="text-4xl mb-2">⬅️</div>
                            <div className="text-sm font-bold">Selecione um nome na lista ao lado para editar</div>
                        </div>
                    )}
                </div>
            </div>

            <div className="flex-1 flex flex-col bg-white overflow-hidden h-full relative z-10 w-full print:overflow-visible print:h-auto">
                <div className="flex items-center gap-4 p-3 bg-white border-b border-slate-200 shadow-sm shrink-0 print:hidden">
                    <div className="flex-1 flex gap-2 overflow-x-auto no-scrollbar">
                        <div className="bg-slate-100 px-3 py-1 rounded text-xs font-bold text-slate-600 border border-slate-200 whitespace-nowrap">Total {lancadorSummary.total}</div>
                        <div className="bg-green-50 px-3 py-1 rounded text-xs font-bold text-green-600 border border-green-200 whitespace-nowrap">Ok {lancadorSummary.ok}</div>
                        <div className="bg-orange-50 px-3 py-1 rounded text-xs font-bold text-orange-500 border border-orange-200 whitespace-nowrap">Pend {lancadorSummary.pending}</div>
                    </div>
                    <Button onClick={() => setIsNewVigModalOpen(true)} className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-8 shadow-sm whitespace-nowrap px-3 flex items-center gap-1">➕ Novo</Button>
                    <Button onClick={handleSmartSuggest} className="bg-purple-600 hover:bg-purple-700 text-white text-xs h-8 shadow-sm whitespace-nowrap">⚡ Sugerir</Button>
                </div>
                <div className="flex-1 overflow-y-auto p-4 bg-slate-50 min-h-0 print:overflow-visible print:h-auto print:bg-white">
                    <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden print:border-none print:shadow-none">
                        <table className="w-full text-left text-xs">
                            <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 sticky top-0 z-10 print:static print:bg-gray-200 print:text-black">
                                <tr>
                                    <th className="px-4 py-3 w-32">STATUS</th>
                                    <th className="px-4 py-3">NOME</th>
                                    <th className="px-4 py-3 w-16 text-center">EQ</th>
                                    <th className="px-4 py-3">SETOR</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {lancadorList.map((vig: any) => (
                                    <tr key={vig.mat} onClick={() => setEditingVig(vig)} className={`cursor-pointer transition-colors ${editingVig?.mat === vig.mat ? 'bg-blue-50 border-l-4 border-l-blue-500' : 'hover:bg-slate-50 even:bg-slate-50'} ${vig.manualLock ? 'bg-white' : 'bg-orange-50/30'}`}>
                                        <td className="px-4 py-3 font-bold">
                                            {vig.manualLock ? (
                                                <span className="flex items-center gap-1 text-slate-700"><span className="text-lg">👤</span> OK</span>
                                            ) : (
                                                <span className="flex items-center gap-1 text-orange-500"><span className="text-lg">⏳</span> Pendente</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 font-bold text-slate-800">{vig.nome}</td>
                                        <td className="px-4 py-3 text-center"><Badge team={vig.eq} /></td>
                                        <td className="px-4 py-3 text-slate-500">{vig.setor}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
});