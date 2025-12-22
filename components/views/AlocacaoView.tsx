import React, { useMemo, useState } from "react";
import { Vigilante, DepartmentPreset } from "../../types";
import { Icons, Badge } from "../ui";

interface AlocacaoViewProps {
    currentLabel: string;
    vigilantes: Vigilante[];
    presets: DepartmentPreset[];
    expandedSectors: Set<string>;
    toggleSectorExpansion: (sector: string) => void;
    onUpdateVigilante: (mat: string, changes: Partial<Vigilante>) => void;
    lancadorVisibleTeams: string[];
}

export const AlocacaoView: React.FC<AlocacaoViewProps> = ({
    currentLabel,
    vigilantes,
    presets,
    expandedSectors,
    toggleSectorExpansion,
    onUpdateVigilante,
    lancadorVisibleTeams,
}) => {
    // 1. (Agrupamento removido - não utilizado)


    // 2. Determinar quais vigilantes estão "Livres" (sem setor definido ou fora dos presets)
    // Isso será útil para o dropdown
    const availableVigilantes = useMemo(() => {
        return vigilantes.filter((v) => {
            // Filtrar apenas vigilantes da equipe visível para o fiscal
            if (!lancadorVisibleTeams.includes(v.eq)) return false;
            return true;
        });
    }, [vigilantes, lancadorVisibleTeams]);

    // 3. Organizar Presets por Campus (Ordem Alfabética)
    const groupedPresets = useMemo(() => {
        const groups: Record<string, DepartmentPreset[]> = {};
        presets.forEach((p) => {
            if (!groups[p.campus]) groups[p.campus] = [];
            groups[p.campus].push(p);
        });
        return groups;
    }, [presets]);

    const campusList = useMemo(() => Object.keys(groupedPresets).sort(), [groupedPresets]);

    // Handler para atribuir vigilante ao slot
    const handleAssign = (preset: DepartmentPreset, mat: string) => {
        onUpdateVigilante(mat, {
            campus: preset.campus,
            setor: preset.setor,
            horario: preset.horario, // Assume horário do preset
            refeicao: preset.refeicao, // Assume refeição do preset
            // eq: Manter equipe original ou mudar? Geralmente mantém.
        });
    };

    // Handler para desatribuir (Limpar slot)
    // Na prática, isso remove o setor do vigilante
    const handleUnassign = (mat: string) => {
        onUpdateVigilante(mat, {
            campus: "SEM POSTO",
            setor: "AGUARDANDO",
        });
    };

    return (
        <div className="flex flex-col h-full bg-slate-900 text-slate-200">
            {/* Header da View */}
            <div className="p-4 bg-slate-900 border-b border-slate-700 flex justify-between items-center print:hidden">
                <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
                    Alocação de Postos de Serviço
                </h2>
                <div className="text-xs text-slate-400">
                    {currentLabel} • Modo Simplificado
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {campusList.map(campus => {
                    const isExpanded = expandedSectors.has(campus);
                    const presetsInCampus = groupedPresets[campus];

                    // Encontrar quem está ocupando esses slots
                    // Um slot é definido por Campus + Setor
                    // Problema: E se tiver 2 porteiros no mesmo setor? Presets geralmente são únicos por posto.
                    // Mas se o sistema aceita multiplos, precisamos lidar.
                    // SOLUÇÃO SIMPLIFICADA: Listar o Preset e mostrar quem está lá.

                    return (
                        <div key={campus} className={`bg-slate-800 rounded-xl shadow-sm border border-slate-700 overflow-hidden transition-all ${!isExpanded ? 'opacity-75 hover:opacity-100' : ''}`}>
                            {/* Header do Campus (Colapsável) */}
                            <div
                                onClick={() => toggleSectorExpansion(campus)}
                                className="bg-slate-950 px-4 py-3 border-b border-slate-700 flex justify-between items-center cursor-pointer hover:bg-slate-900 transition-colors"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-1.5 h-5 bg-blue-500 rounded-full"></div>
                                    <span className="font-bold text-sm text-white">{campus}</span>
                                    <Badge variant="outline" className="text-[10px] bg-slate-800">{presetsInCampus.length} POSTOS</Badge>
                                </div>

                                <div className="text-[10px] uppercase font-bold text-slate-500 flex items-center gap-2">
                                    {isExpanded ? "Minimizar" : "Expandir"}
                                    <span className="text-lg leading-none">{isExpanded ? "−" : "+"}</span>
                                </div>
                            </div>

                            {/* Corpo do Campus (Slots) */}
                            {isExpanded && (
                                <div className="divide-y divide-slate-700/50">
                                    {presetsInCampus.sort((a, b) => a.setor.localeCompare(b.setor)).map((preset, idx) => {
                                        // Quem está neste posto?
                                        const occupants = vigilantes.filter(v => v.campus === preset.campus && v.setor === preset.setor);
                                        const isOccupied = occupants.length > 0;

                                        return (
                                            <div key={`${preset.id}-${idx}`} className="p-3 hover:bg-slate-700/30 transition-colors flex items-center gap-4">
                                                {/* Informações do Posto (Esquerda) */}
                                                <div className="w-1/3 min-w-[200px]">
                                                    <div className="font-bold text-sm text-slate-200">{preset.setor}</div>
                                                    <div className="flex gap-2 mt-1">
                                                        <Badge className="text-[10px] bg-slate-700 text-slate-400 border-none">{preset.horario}</Badge>
                                                        <Badge className="text-[10px] bg-slate-700 text-slate-400 border-none">{preset.type === '12x36' ? '12x36' : 'ADM'}</Badge>
                                                    </div>
                                                </div>

                                                {/* Slot de Alocação (Direita) */}
                                                <div className="flex-1 flex flex-col gap-2">
                                                    {isOccupied ? (
                                                        occupants.map(occ => (
                                                            <div key={occ.mat} className="flex items-center justify-between bg-slate-800 border border-slate-600 rounded p-2 shadow-sm animate-fade-in">
                                                                <div className="flex items-center gap-3">
                                                                    <Badge team={occ.eq} />
                                                                    <div>
                                                                        <div className="font-bold text-sm text-white">{occ.nome}</div>
                                                                        <div className="text-[10px] text-slate-400 font-mono">{occ.mat}</div>
                                                                    </div>
                                                                </div>
                                                                <div className="flex items-center gap-2">
                                                                    {/* Input Rápido de Folga (Placeholder) */}
                                                                    {/* <button className="text-[10px] bg-red-900/30 text-red-400 px-2 py-1 rounded hover:bg-red-900/50">Dar Folga</button> */}
                                                                    <button
                                                                        onClick={() => handleUnassign(occ.mat)}
                                                                        className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-900/20 rounded transition-colors"
                                                                        title="Remover do Posto"
                                                                    >
                                                                        <Icons.X className="w-4 h-4" />
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        ))
                                                    ) : (
                                                        <div className="bg-slate-800/50 border border-dashed border-slate-700 rounded p-2 flex items-center justify-between group hover:border-slate-500 transition-colors">
                                                            <span className="text-xs text-slate-500 italic pl-2">Posto Vago</span>
                                                            <select
                                                                className="bg-transparent text-xs text-slate-300 outline-none w-48 text-right cursor-pointer hover:text-white"
                                                                onChange={(e) => {
                                                                    if (e.target.value) handleAssign(preset, e.target.value);
                                                                }}
                                                                value=""
                                                            >
                                                                <option value="" disabled>+ Adicionar Vigilante</option>
                                                                {availableVigilantes
                                                                    .filter(v => v.campus !== preset.campus || v.setor !== preset.setor) // Não mostrar quem já está aqui
                                                                    .sort((a, b) => a.nome.localeCompare(b.nome))
                                                                    .map(v => (
                                                                        <option key={v.mat} value={v.mat}>
                                                                            {v.nome} ({v.eq})
                                                                        </option>
                                                                    ))}
                                                            </select>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    );
                })}

                {campusList.length === 0 && (
                    <div className="p-8 text-center text-slate-500 border-2 border-dashed border-slate-700 rounded-xl">
                        <div className="text-4xl mb-4">📂</div>
                        <h3 className="text-lg font-bold text-slate-300">Nenhum Preset Encontrado</h3>
                        <p className="text-sm mt-2">Cadastre os postos no Gerenciador de Presets para usar a alocação.</p>
                    </div>
                )}
            </div>
        </div>
    );
};
