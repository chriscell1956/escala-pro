import React, { useState, useMemo } from "react";
import { Vigilante, DepartmentPreset, IntervalConflict } from "../../types";
import { Badge, Icons, Button } from "../ui";

interface IntervalosViewProps {
    vigilantes: Vigilante[];
    presets: DepartmentPreset[];
    onUpdateVigilante: (mat: string, changes: Partial<Vigilante>) => void;
    isMaster: boolean;
}

export const IntervalosView: React.FC<IntervalosViewProps> = ({
    vigilantes,
    presets,
    onUpdateVigilante,
    isMaster,
}) => {
    const [filterCampus, setFilterCampus] = useState("TODOS");
    const [viewMode, setViewMode] = useState<"LIST" | "TIMELINE">("LIST");

    // Helper to parse meal time
    const getMealTime = (v: Vigilante) => {
        if (!v.refeicao || v.refeicao === "A DEFINIR" || v.refeicao === "Sem Ref.") return null;
        const parts = v.refeicao.split("-"); // "12:00 - 13:00"
        if (parts.length < 1) return null;
        return parts[0].trim(); // "12:00"
    };

    // Group by Meal Start Time
    const groupedByTime = useMemo(() => {
        const groups: Record<string, Vigilante[]> = {};
        vigilantes.forEach((v) => {
            // Filter by Campus
            if (filterCampus !== "TODOS" && v.campus !== filterCampus) return;

            // Ignore unset
            if (!v.refeicao || v.refeicao.length < 5) {
                if (!groups["SEM_HORARIO"]) groups["SEM_HORARIO"] = [];
                groups["SEM_HORARIO"].push(v);
                return;
            }

            const time = getMealTime(v) || "OUTROS";
            if (!groups[time]) groups[time] = [];
            groups[time].push(v);
        });
        return groups;
    }, [vigilantes, filterCampus]);

    const handleUpdateDuration = (v: Vigilante, newDuration: 60 | 75) => {
        // Calculate new end time
        const startObj = getMealTime(v);
        if (!startObj) return;

        const [hh, mm] = startObj.split(":").map(Number);
        const date = new Date();
        date.setHours(hh, mm, 0, 0);
        date.setMinutes(date.getMinutes() + newDuration);

        // Format HH:MM
        const endHH = String(date.getHours()).padStart(2, '0');
        const endMM = String(date.getMinutes()).padStart(2, '0');

        const newString = `${startObj} - ${endHH}:${endMM} (${newDuration === 75 ? "1h15" : "1h"})`;

        onUpdateVigilante(v.mat, { refeicao: newString });
    };

    return (
        <div className="h-full flex flex-col bg-slate-900 text-slate-200">
            {/* HEADER */}
            <div className="p-4 border-b border-slate-700 bg-slate-950 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <span className="text-2xl">🍽️</span> Gestão de Intervalos
                    </h2>
                    <div className="h-6 w-px bg-slate-700"></div>
                    <select
                        value={filterCampus}
                        onChange={(e) => setFilterCampus(e.target.value)}
                        className="bg-slate-800 border border-slate-600 rounded px-2 py-1 text-xs font-bold"
                    >
                        <option value="TODOS">Todos os Campus</option>
                        <option value="CAMPUS I - DIURNO">Campus I</option>
                        <option value="CAMPUS II - DIURNO">Campus II</option>
                        <option value="HOSPITAL">Hospital</option>
                    </select>
                </div>
                <div className="text-xs text-slate-500">
                    Total Alocados: {vigilantes.length}
                </div>
            </div>

            {/* CONTENT */}
            <div className="flex-1 overflow-y-auto p-6">
                {Object.keys(groupedByTime).sort().map(time => {
                    const group = groupedByTime[time];
                    if (group.length === 0) return null;

                    return (
                        <div key={time} className="mb-6 animate-fade-in">
                            <div className="flex items-center gap-3 mb-2 sticky top-0 bg-slate-900/95 backdrop-blur py-2 z-10 border-b border-slate-800">
                                <div className="bg-blue-600 text-white font-black text-lg px-3 py-1 rounded shadow-lg shadow-blue-900/20 w-24 text-center">
                                    {time === "SEM_HORARIO" ? "??" : time}
                                </div>
                                <div className="text-sm font-bold text-slate-400 uppercase tracking-widest">
                                    {group.length} Vigilantes saem neste horário
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                                {group.map(v => {
                                    const isExtended = v.refeicao?.includes("1h15");
                                    return (
                                        <div key={v.mat} className="bg-slate-800 border border-slate-700 rounded-lg p-3 hover:border-blue-500/50 transition-colors shadow-sm relative group">
                                            <div className="flex justify-between items-start mb-2">
                                                <div>
                                                    <div className="font-bold text-white truncate w-40" title={v.nome}>{v.nome}</div>
                                                    <div className="text-[10px] text-slate-500 flex items-center gap-1">
                                                        <Badge team={v.eq} /> {v.setor}
                                                    </div>
                                                </div>
                                                {isMaster && (
                                                    <div className="flex flex-col gap-1">
                                                        <button
                                                            onClick={() => handleUpdateDuration(v, 60)}
                                                            className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${!isExtended ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50' : 'text-slate-600 border-slate-700 hover:text-slate-400'}`}
                                                        >
                                                            1h
                                                        </button>
                                                        <button
                                                            onClick={() => handleUpdateDuration(v, 75)}
                                                            className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${isExtended ? 'bg-purple-500/20 text-purple-400 border-purple-500/50' : 'text-slate-600 border-slate-700 hover:text-slate-400'}`}
                                                        >
                                                            1h15
                                                        </button>
                                                    </div>
                                                )}
                                            </div>

                                            {/* STATUS BAR */}
                                            <div className="bg-slate-900 rounded p-2 text-center border border-slate-700/50">
                                                <div className="text-xs font-mono text-slate-300">
                                                    {v.refeicao || "Não definido"}
                                                </div>

                                                {/* Cobertura Placeholder */}
                                                <div className="mt-1 pt-1 border-t border-slate-800 flex items-center justify-center gap-1">
                                                    <span className="text-[9px] text-slate-600 uppercase">Cobertura:</span>
                                                    <span className="text-[9px] text-red-500 font-bold italic">PENDENTE</span>
                                                    {/* TODO: Implementar seleção de cobertura */}
                                                </div>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    );
};
