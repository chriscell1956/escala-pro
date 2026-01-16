
import React, { useMemo, useState } from 'react';
import { User, Shield, AlertCircle, ChevronDown, ChevronUp, CalendarCheck } from 'lucide-react';
import { getEquipeColor } from '../utils/colors';

interface PendingVigilantesListProps {
    vigilantes: any[];
    alocacoes: any[]; // All monthly allocations to check availability
    onSelect?: (vigilante: any) => void;
}

export function PendingVigilantesList({ vigilantes, alocacoes, onSelect }: PendingVigilantesListProps) {
    const [isExpanded, setIsExpanded] = useState(true);
    const [filter, setFilter] = useState('');

    // Filter logic:
    // Vigilante is pending if NOT allocated in ANY post for the current month? 
    // Or just "Available Today"? 
    // User said: "Não está alocado em nenhum setor no mês" (implies Full Availability)
    // AND "Status automático: TRABALHANDO / FOLGA (Hoje)" -> This implies they MIGHT be allocated?
    // "Um vigilante entra nessa lista quando: ... Não está alocado em nenhum setor no mês"
    // So if they have 0 allocations in this Month, they are Pending.

    // BUT the status "Trabalhando/Folga (Hoje)" only makes sense if they HAVE allocations?
    // Contradiction?
    // "Não alocados / Pendentes (Hoje)"
    // "Um vigilante entra nessa lista quando: ... Não está alocado em nenhum setor no mês"
    // If they have 0 allocations, they are NOT working today. They are "LIVRES".
    // Maybe user means "Not allocated in THIS scale"?

    // Let's assume strict interpretation: "Not allocated in any sector in the month".
    // Then Status is always "DISPONÍVEL" (or "FÉRIAS" if in Ferias table).

    const pendingList = useMemo(() => {
        // Get set of allocated vigilante IDs
        const allocatedIds = new Set(alocacoes.map((a: any) => a.vigilante_id));

        return vigilantes.filter(v => !allocatedIds.has(v.id)).filter(v =>
            v.nome.toLowerCase().includes(filter.toLowerCase()) ||
            v.matricula.includes(filter)
        );
    }, [vigilantes, alocacoes, filter]);

    return (
        <div className="bg-slate-950 border-b border-slate-800 flex flex-col shrink-0 transition-all duration-300 ease-in-out shadow-lg z-20 sticky top-0">
            {/* Header / Toggle */}
            <div
                className={`px-4 py-3 bg-slate-900/80 backdrop-blur-sm flex justify-between items-center cursor-pointer hover:bg-slate-800 transition-colors border-l-4 ${pendingList.length > 0 ? 'border-orange-500' : 'border-emerald-500'}`}
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 text-white font-semibold text-sm tracking-wide">
                        {pendingList.length > 0 ? <AlertCircle size={18} className="text-orange-500" /> : <Shield size={18} className="text-emerald-500" />}
                        <span>VIGILANTES PENDENTES</span>
                    </div>
                    <span className="bg-slate-800 text-slate-300 text-xs font-bold px-2 py-0.5 rounded border border-slate-700">
                        {pendingList.length}
                    </span>
                    <span className="text-slate-500 text-xs hidden md:inline ml-2 border-l border-slate-700 pl-2">
                        {pendingList.length > 0 ? 'Existem vigilantes não alocados hoje.' : 'Todos os vigilantes alocados.'}
                    </span>
                </div>
                <div className="flex items-center gap-3">
                    <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
                            <User size={12} className="text-slate-500" />
                        </div>
                        <input
                            type="text"
                            placeholder="Buscar..."
                            className="bg-slate-950 border border-slate-800 rounded-md pl-8 pr-2 py-1 text-xs text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 w-32 transition-all group-hover:w-48 group-focus-within:w-48"
                            value={filter}
                            onChange={(e) => setFilter(e.target.value)}
                            onClick={(e) => e.stopPropagation()}
                        />
                    </div>
                    {isExpanded ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
                </div>
            </div>

            {/* Content (COLLAPSIBLE SECTION) - EXACT FROM REFERENCE */}
            {isExpanded && (
                <div className="bg-slate-900/30 p-2 border-b border-slate-700 shadow-inner">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
                        {pendingList.map(v => (
                            <div
                                key={v.id}
                                className="flex items-center justify-between p-2 bg-slate-800 rounded border border-slate-700 hover:border-slate-500 transition-colors group cursor-pointer"
                                onClick={() => onSelect && onSelect(v)}
                                draggable
                                onDragStart={(e) => e.dataTransfer.setData('vigilante_id', v.id.toString())}
                            >
                                <div className="flex items-center gap-2 overflow-hidden">
                                    <div className={`w-6 h-6 rounded flex items-center justify-center text-[10px] font-bold text-slate-900 shrink-0 ${getEquipeColor(v.equipe)}`}>
                                        {v.equipe || '?'}
                                    </div>
                                    <div className="flex flex-col overflow-hidden">
                                        <span className="text-white font-bold text-xs truncate group-hover:text-blue-300 transition-colors" title={v.nome}>{v.nome}</span>
                                        <span className="text-[10px] text-slate-500 font-mono">{v.matricula}</span>
                                    </div>
                                </div>

                                <span className="text-[10px] font-bold text-emerald-500 uppercase flex items-center gap-1">
                                    <Shield size={10} /> DISPONÍVEL
                                </span>
                            </div>
                        ))}

                        {pendingList.length === 0 && (
                            <div className="col-span-full text-center py-4 text-slate-500 text-xs flex items-center justify-center gap-2">
                                <Shield size={14} />
                                <span>Lista limpa! Todos os vigilantes ativos estão alocados.</span>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}


