import React, { useMemo, useState } from "react";
import { Vigilante, DepartmentPreset } from "../../types";
import { cleanString } from "../../utils";
import { Icons, Badge, SearchableSelect, Button, Select, Modal } from "../ui";
import { CalendarGrid } from "../common/CalendarGrid";

interface AlocacaoViewProps {
  currentLabel: string;
  vigilantes: Vigilante[];
  presets: DepartmentPreset[];
  expandedSectors: Set<string>;
  toggleSectorExpansion: (sector: string) => void;
  onUpdateVigilante: (mat: string, changes: Partial<Vigilante>) => void;
  lancadorVisibleTeams: string[];
  isMaster: boolean;
  month: number;
  onUpdatePreset?: (presetId: string, updates: Partial<DepartmentPreset>) => void;
}

// Helper to determine compatible teams based on preset type
const getCompatibleTeams = (presetType?: string): string[] => {
  if (!presetType)
    return ["A", "B", "C", "D", "ECO1", "ECO2", "ECO 1", "ECO 2", "ADM"];
  const type = presetType.toUpperCase();

  // EXPEDIENTE: Visible/Assignable by ALL teams (A, B, C, D, etc)
  if (type.includes("EXPEDIENTE"))
    return ["A", "B", "C", "D", "ECO1", "ECO2", "ECO 1", "ECO 2", "ADM"];

  // Diurno: C, D, ECO1, ECO2 (Apoio), ADM
  if (type.includes("DIURNO"))
    return ["C", "D", "ECO1", "ECO2", "ECO 1", "ECO 2", "ADM"];
  // Noturno: A, B, ECO1, ECO2
  if (type.includes("NOTURNO"))
    return ["A", "B", "ECO1", "ECO2", "ECO 1", "ECO 2"];
  // Fallback for ADM/Expediente or undefined
  return ["A", "B", "C", "D", "ECO1", "ECO2", "ECO 1", "ECO 2", "ADM"];
};

export const AlocacaoView: React.FC<AlocacaoViewProps> = ({
  currentLabel,
  vigilantes,
  presets,
  expandedSectors,
  toggleSectorExpansion,
  onUpdateVigilante,
  lancadorVisibleTeams,
  isMaster,
  month,
  onUpdatePreset,
}) => {
  // --- STATE ---
  const [filterTeam, setFilterTeam] = useState<string>("TODAS"); // TODAS | ECO1 | ECO2 | specific team

  // Modal State
  const [managingVig, setManagingVig] = useState<Vigilante | null>(null);
  const [editorMode, setEditorMode] = useState<"days" | "vacation" | "falta" | "partial">("days");

  // Edit Preset State
  const [managingPreset, setManagingPreset] = useState<DepartmentPreset | null>(null);

  const handleSavePreset = () => {
    if (!managingPreset || !onUpdatePreset) return;
    onUpdatePreset(managingPreset.id, {
      name: managingPreset.name,
      horario: managingPreset.horario,
      refeicao: managingPreset.refeicao,
    });
    setManagingPreset(null);
  };

  // Internal "Today" for list status purposes (implicit)
  const today = new Date().getDate();

  // --- FILTER LOGIC ---
  const filteredVigilantes = useMemo(() => {
    return vigilantes.filter((v) => {
      // 1. Visible Teams Filter (Base Access)
      const vTeam = cleanString(v.eq);
      if (!lancadorVisibleTeams.map(cleanString).includes(vTeam)) return false;

      // 2. Specific Filter (UI)
      if (filterTeam !== "TODAS") {
        const target = cleanString(filterTeam);
        // Handle ECO 1 / ECO 2 normalization
        if (target === "ECO1" || target === "E1") {
          if (vTeam !== "ECO1" && vTeam !== "E1") return false;
        } else if (target === "ECO2" || target === "E2") {
          if (vTeam !== "ECO2" && vTeam !== "E2") return false;
        } else {
          if (vTeam !== target) return false;
        }
      }

      return true;
    });
  }, [vigilantes, lancadorVisibleTeams, filterTeam]);

  // --- PRESET GROUPING ---
  const groupedPresets = useMemo(() => {
    const groups: Record<string, DepartmentPreset[]> = {};

    const normVisible = lancadorVisibleTeams.map(cleanString);
    const hasDiurno = normVisible.some((t) =>
      ["C", "D", "ADM", "ECO1", "E1"].includes(t),
    );
    const hasNoturno = normVisible.some((t) =>
      ["A", "B", "ECO2", "E2"].includes(t),
    );
    const isMasterOrFull = hasDiurno && hasNoturno;

    presets.forEach((p) => {
      const type = (p.type || "").toUpperCase();
      const campus = (p.campus || "").toUpperCase();
      const sector = (p.sector || "").toUpperCase();
      const id = (p.id || "").toUpperCase();
      const name = (p.name || "").toUpperCase();

      // NEW RULE: Supervision only for MASTER
      if (campus.includes("SUPERVISÃO") && !isMaster) {
        return;
      }

      if (!isMasterOrFull) {
        const isDiurnoPreset =
          type.includes("DIURNO") ||
          campus.includes("DIURNO") ||
          id.includes("DIURNO") ||
          name.includes("DIURNO") ||
          sector.includes("DIURNO");

        const isNoturnoPreset =
          type.includes("NOTURNO") ||
          campus.includes("NOTURNO") ||
          id.includes("NOTURNO") ||
          name.includes("NOTURNO") ||
          sector.includes("NOTURNO");

        const isExpedientePreset =
          type.includes("EXPEDIENTE") ||
          campus.includes("EXPEDIENTE") ||
          sector.includes("EXPEDIENTE") ||
          name.includes("EXPEDIENTE") ||
          id.includes("EXPEDIENTE");

        const isADefinir =
          campus.includes("DEFINIR") || sector.includes("DEFINIR");

        // ECO/APOIO Logic
        const isEco1 =
          sector.includes("ECO 1") ||
          sector.includes("ECO1") ||
          campus.includes("ECO 1") ||
          campus.includes("ECO1") ||
          (sector.includes("APOIO") && isDiurnoPreset);
        const isEco2 =
          sector.includes("ECO 2") ||
          sector.includes("ECO2") ||
          campus.includes("ECO 2") ||
          campus.includes("ECO2") ||
          (sector.includes("APOIO") && isNoturnoPreset);

        if (!isADefinir) {
          let shouldShow = false;

          if (isExpedientePreset) shouldShow = true;
          if (hasDiurno && (isDiurnoPreset || isEco1)) shouldShow = true;
          if (hasNoturno && (isNoturnoPreset || isEco2)) shouldShow = true;

          if (!shouldShow) return;
        }
      }

      if (!groups[p.campus]) groups[p.campus] = [];
      groups[p.campus].push(p);
    });
    return groups;
  }, [presets, lancadorVisibleTeams, isMaster]);

  const campusList = useMemo(
    () => Object.keys(groupedPresets).sort(),
    [groupedPresets],
  );

  // --- ACTIONS (Modal Logic) ---

  const handleOpenSchedule = (vig: Vigilante) => {
    setManagingVig({ ...vig }); // Copy for local editing
    setEditorMode("days");
  };

  const handleSaveSchedule = () => {
    if (!managingVig) return;
    onUpdateVigilante(managingVig.mat, {
      dias: managingVig.dias,
      folgasGeradas: managingVig.folgasGeradas,
      faltas: managingVig.faltas,
      vacation: managingVig.vacation,
      saidasAntecipadas: managingVig.saidasAntecipadas
    });
    setManagingVig(null);
  };

  const localToggleDay = (_: Vigilante, day: number) => {
    if (!managingVig) return;
    const target = { ...managingVig };
    target.dias = target.dias || [];
    target.folgasGeradas = target.folgasGeradas || [];

    if (target.dias.includes(day)) {
      target.dias = target.dias.filter((d) => d !== day);
      if (!target.folgasGeradas.includes(day)) target.folgasGeradas.push(day);
    } else {
      target.dias.push(day);
      target.dias.sort((a, b) => a - b);
      target.folgasGeradas = target.folgasGeradas.filter((d) => d !== day);
    }
    target.faltas = (target.faltas || []).filter((d) => d !== day);
    setManagingVig(target);
  };

  const localToggleFalta = (_: Vigilante, day: number) => {
    if (!managingVig) return;
    const target = { ...managingVig };
    target.faltas = target.faltas || [];
    if (target.faltas.includes(day)) {
      target.faltas = target.faltas.filter((d) => d !== day);
    } else {
      target.faltas.push(day);
      target.faltas.sort((a, b) => a - b);
      target.dias = (target.dias || []).filter((d) => d !== day);
    }
    setManagingVig(target);
  };

  const localToggleVacation = (_: Vigilante, day: number) => {
    if (!managingVig) return;
    const target = { ...managingVig };
    // Simplified Vacation Logic for this modal
    const currentVacation = target.vacation || { start: 0, end: 0 };
    let newVacation = { ...currentVacation };

    if (!newVacation.start || newVacation.start === 0) {
      newVacation.start = day;
      newVacation.end = day;
    } else if (day === newVacation.start && day === newVacation.end) {
      newVacation = { start: 0, end: 0 };
    } else {
      if (day < newVacation.start) newVacation.start = day;
      else if (day > newVacation.end) newVacation.end = day;
      else newVacation.end = day; // Extend
    }

    if (newVacation.start === 0) target.vacation = undefined;
    else {
      target.vacation = newVacation;
      target.dias = (target.dias || []).filter(
        (d) => d < newVacation.start || d > newVacation.end,
      );
    }
    setManagingVig(target);
  };

  const localTogglePartial = (_: Vigilante, day: number) => {
    if (!managingVig) return;
    const target = { ...managingVig };
    target.saidasAntecipadas = target.saidasAntecipadas || [];

    if (target.saidasAntecipadas.includes(day)) {
      target.saidasAntecipadas = target.saidasAntecipadas.filter(
        (d) => d !== day,
      );
    } else {
      target.saidasAntecipadas.push(day);
      target.saidasAntecipadas.sort((a, b) => a - b);
      if (!target.dias.includes(day)) {
        target.dias.push(day);
        target.dias.sort((a, b) => a - b);
        target.folgasGeradas = (target.folgasGeradas || []).filter(
          (d) => d !== day,
        );
      }
    }
    setManagingVig(target);
  };

  const handleAssign = (preset: DepartmentPreset, mat: string) => {
    onUpdateVigilante(mat, {
      campus: preset.campus,
      setor: preset.sector,
      horario: preset.horario,
      refeicao: preset.refeicao,
    });
  };

  const handleUnassign = (mat: string) => {
    onUpdateVigilante(mat, {
      campus: "SEM POSTO",
      setor: "AGUARDANDO",
    });
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 text-slate-200">
      {/* HEADER DA VIEW */}
      <div className="p-4 bg-slate-900 border-b border-slate-700 flex flex-col md:flex-row gap-4 justify-between items-center print:hidden">
        <div>
          <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
            Alocação de Postos
          </h2>
          <div className="text-xs text-slate-400">
            {currentLabel} • Filtro de Equipes & Cruzamento
          </div>
        </div>

        {/* CONTROLS */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Team Filter */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase text-slate-500">
              Filtrar:
            </span>
            <Select
              value={filterTeam}
              onChange={(e) => setFilterTeam(e.target.value)}
              className="bg-slate-800 border-slate-700 text-xs py-1.5 h-8 w-32"
            >
              <option value="TODAS">-- Todas --</option>
              {lancadorVisibleTeams.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </Select>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* SEÇÃO A DEFINIR / PENDENTES */}
        <div className="bg-slate-800 rounded-xl shadow-sm border border-slate-700 overflow-hidden">
          <div
            onClick={() => toggleSectorExpansion("A DEFINIR")}
            className="bg-slate-900/50 px-4 py-3 border-b border-slate-700 flex justify-between items-center cursor-pointer hover:bg-slate-800 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-1.5 h-5 bg-orange-500 rounded-full"></div>
              <span className="font-bold text-sm text-orange-200">
                ⚠️ NÃO ALOCADOS / PENDENTES (Hoje)
              </span>
              <Badge
                variant="outline"
                className="text-[10px] bg-slate-800 text-slate-400"
              >
                {
                  filteredVigilantes.filter(
                    (v) =>
                      !v.campus ||
                      v.campus === "SEM POSTO" ||
                      v.campus.includes("DEFINIR") ||
                      !v.setor ||
                      v.setor === "AGUARDANDO" ||
                      v.setor.includes("DEFINIR"),
                  ).length
                }{" "}
                VIGILANTES
              </Badge>
            </div>
            <div className="text-[10px] uppercase font-bold text-slate-500">
              {expandedSectors.has("A DEFINIR") ? "Minimizar" : "Expandir"}
            </div>
          </div>

          {expandedSectors.has("A DEFINIR") && (
            <div className="p-2 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 bg-slate-900/30">
              {filteredVigilantes
                .filter(
                  (v) =>
                    !v.campus ||
                    v.campus === "SEM POSTO" ||
                    v.campus.includes("DEFINIR") ||
                    !v.setor ||
                    v.setor === "AGUARDANDO" ||
                    v.setor.includes("DEFINIR"),
                )
                .map((v) => {
                  const isWorkingToday = (v.dias || []).includes(today);
                  const isVacationToday =
                    v.vacation &&
                    today >= v.vacation.start &&
                    today <= v.vacation.end;
                  const isFalta = (v.faltas || []).includes(today);

                  return (
                    <div
                      key={v.mat}
                      className="flex items-center justify-between p-2 bg-slate-800 rounded border border-slate-700 hover:border-slate-500 transition-colors"
                    >
                      <div className="flex flex-col min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-slate-200 truncate">
                            {v.nome}
                          </span>
                          <Badge team={v.eq} />
                        </div>
                        <div className="flex items-center gap-2 text-[10px] mt-0.5">
                          <span className="text-slate-500">{v.mat}</span>
                          {isFalta ? (
                            <span className="text-red-400 font-bold">FALTA (Hoje)</span>
                          ) : isVacationToday ? (
                            <span className="text-amber-400 font-bold">FÉRIAS (Hoje)</span>
                          ) : isWorkingToday ? (
                            <span className="text-emerald-400 font-bold">TRABALHANDO</span>
                          ) : (
                            <span className="text-slate-500">FOLGA (Hoje)</span>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => handleOpenSchedule(v)}
                        className="text-slate-400 hover:text-white p-2 rounded hover:bg-slate-700 transition-colors"
                        title="Gerenciar Escala / Dar Folga"
                      >
                        <Icons.Calendar className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}
              {filteredVigilantes.filter(
                (v) =>
                  !v.campus ||
                  v.campus === "SEM POSTO" ||
                  v.campus.includes("DEFINIR"),
              ).length === 0 && (
                  <div className="col-span-full text-center text-xs text-slate-500 py-4">
                    Nenhum vigilante pendente. Todos estão alocados em postos.
                  </div>
                )}
            </div>
          )}
        </div>

        {/* POST LIST (PRESETS) */}
        {campusList.map((campus) => {
          const isExpanded = expandedSectors.has(campus);
          const presetsInCampus = groupedPresets[campus];
          const displayedVigilantes = new Set<string>();

          return (
            <div
              key={campus}
              className={`bg-slate-800 rounded-xl shadow-sm border border-slate-700 overflow-hidden transition-all ${!isExpanded ? "opacity-75 hover:opacity-100" : ""
                }`}
            >
              {/* Header do Campus */}
              <div
                onClick={() => toggleSectorExpansion(campus)}
                className="bg-slate-950 px-4 py-3 border-b border-slate-700 flex justify-between items-center cursor-pointer hover:bg-slate-900 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-1.5 h-5 bg-blue-500 rounded-full"></div>
                  <span className="font-bold text-sm text-white">{campus}</span>
                  <Badge
                    variant="outline"
                    className="text-[10px] bg-slate-800 text-slate-400"
                  >
                    {presetsInCampus.length} POSTOS
                  </Badge>
                </div>
                <div className="text-[10px] uppercase font-bold text-slate-500">
                  {isExpanded ? "Minimizar" : "Expandir"}
                </div>
              </div>

              {/* Corpo (Slots) */}
              {isExpanded && (
                <div className="divide-y divide-slate-700/50">
                  {presetsInCampus
                    .sort((a, b) =>
                      (a.sector || "").localeCompare(b.sector || ""),
                    )
                    .map((preset, idx) => {
                      // Quem está neste posto?
                      const allOccupants = vigilantes.filter(
                        (v) =>
                          v.campus === preset.campus &&
                          v.setor === preset.sector,
                      );

                      const availableOccupant = allOccupants.find(
                        (v) => !displayedVigilantes.has(v.mat),
                      );

                      if (availableOccupant) {
                        displayedVigilantes.add(availableOccupant.mat);
                      }

                      const isOccupied = !!availableOccupant;
                      const occupants = availableOccupant
                        ? [availableOccupant]
                        : [];

                      // Options for dropdown
                      const compatibleTeams = getCompatibleTeams(preset.type);
                      const filteredOptions = filteredVigilantes
                        .filter((v) => {
                          const vTeam = cleanString(v.eq).replace(/\s+/g, "");
                          const shiftTeams = compatibleTeams.map((t) =>
                            cleanString(t).replace(/\s+/g, ""),
                          );
                          const isAlreadyHere =
                            v.campus === preset.campus &&
                            v.setor === preset.sector;
                          if (isAlreadyHere) return false;

                          // Shift Check
                          if (!shiftTeams.includes(vTeam)) return false;
                          return true;
                        })
                        .sort((a, b) => {
                          // Sort Working first
                          const aWorking = (a.dias || []).includes(today);
                          const bWorking = (b.dias || []).includes(today);
                          if (aWorking && !bWorking) return -1;
                          if (!aWorking && bWorking) return 1;
                          return (a.nome || "").localeCompare(b.nome || "");
                        })
                        .map((v) => {
                          const isWorking = (v.dias || []).includes(today);
                          const isFalta = (v.faltas || []).includes(today);
                          const isVacation =
                            v.vacation &&
                            today >= v.vacation.start &&
                            today <= v.vacation.end;
                          let statusLabel = "";
                          if (isFalta) statusLabel = "(FALTA)";
                          else if (isVacation) statusLabel = "(FÉRIAS)";
                          else if (!isWorking) statusLabel = "(FOLGA)";

                          return {
                            value: v.mat,
                            label: `${v.nome} ${statusLabel}`,
                            subLabel: `${v.eq} • ${v.setor}`,
                          };
                        });

                      return (
                        <div
                          key={`${preset.id}-${idx}`}
                          className="p-3 hover:bg-slate-700/30 transition-colors flex items-center gap-4 group"
                        >
                          {/* Info (Left) */}
                          <div className="w-1/3 min-w-[200px] flex items-start gap-2">
                            <div className="flex flex-col flex-1">
                              <span className="font-bold text-sm text-slate-100 group-hover:text-blue-300 transition-colors">
                                {preset.name}
                              </span>
                              <div className="flex flex-col gap-0.5 mt-1">
                                <span className="text-[10px] text-slate-400 font-mono bg-slate-800 px-1.5 py-0.5 rounded w-fit">
                                  🕒 {preset.horario}
                                </span>
                                {preset.refeicao && (
                                  <span className="text-[9px] text-slate-500 font-mono px-1.5">
                                    🍽️ {preset.refeicao}
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Edit Button */}
                            {isMaster && onUpdatePreset && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setManagingPreset(preset);
                                }}
                                className="text-slate-600 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity p-1"
                                title="Editar detalhes do posto"
                              >
                                <Icons.Edit className="w-3 h-3" />
                              </button>
                            )}
                          </div>

                          {/* Allocation (Right) */}
                          <div className="flex-1 flex flex-col gap-2">
                            {isOccupied ? (
                              occupants.map((occ) => {
                                const isWorking = (occ.dias || []).includes(today);
                                return (
                                  <div
                                    key={occ.mat}
                                    className={`flex items-center justify-between border rounded p-2 shadow-sm animate-fade-in ${!isWorking
                                      ? "bg-red-900/20 border-red-800"
                                      : "bg-slate-800 border-slate-600"
                                      }`}
                                  >
                                    <div className="flex items-center gap-3">
                                      <Badge team={occ.eq} />
                                      <div>
                                        <div className="font-bold text-sm text-white flex items-center gap-2">
                                          {occ.nome}
                                          {!isWorking && (
                                            <span className="text-[9px] bg-red-600 text-white px-1 rounded animate-pulse">
                                              FOLGA (Hoje)
                                            </span>
                                          )}
                                        </div>
                                        <div className="text-[10px] text-slate-400 font-mono">
                                          {occ.mat}
                                        </div>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <button
                                        onClick={() => handleOpenSchedule(occ)}
                                        className="text-slate-400 hover:text-white p-1.5 rounded hover:bg-slate-700 transition-colors"
                                        title="Gerenciar Escala"
                                      >
                                        <Icons.Calendar className="w-4 h-4" />
                                      </button>
                                      <button
                                        onClick={() => handleUnassign(occ.mat)}
                                        className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-900/20 rounded transition-colors"
                                        title="Desalocar"
                                      >
                                        <Icons.X className="w-4 h-4" />
                                      </button>
                                    </div>
                                  </div>
                                );
                              })
                            ) : (
                              <div className="bg-slate-800/50 border border-dashed border-slate-700 rounded p-2 flex items-center justify-between hover:border-slate-500 transition-colors">
                                <span className="text-xs text-slate-600 italic pl-2">
                                  Vago
                                </span>
                                <div className="w-64">
                                  <SearchableSelect
                                    options={filteredOptions}
                                    value=""
                                    onChange={(val) =>
                                      handleAssign(preset, val)
                                    }
                                    placeholder="+ Escalar..."
                                    className="text-xs"
                                  />
                                </div>
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
      </div>

      {/* SCHEDULE MODAL */}
      <Modal
        title={`Gerenciar Escala: ${managingVig?.nome || ""}`}
        isOpen={!!managingVig}
        onClose={() => setManagingVig(null)}
      >
        <div className="space-y-4">
          {managingVig && (
            <>
              <div className="flex bg-slate-900 rounded-lg p-1 gap-1">
                <button
                  onClick={() => setEditorMode("days")}
                  className={`flex-1 py-1.5 text-[10px] font-bold rounded-md transition-all ${editorMode === "days"
                    ? "bg-slate-700 text-white shadow-sm"
                    : "text-slate-500 hover:text-slate-300"
                    }`}
                >
                  📅 DIAS
                </button>
                <button
                  onClick={() => setEditorMode("vacation")}
                  className={`flex-1 py-1.5 text-[10px] font-bold rounded-md transition-all ${editorMode === "vacation"
                    ? "bg-amber-100 text-amber-800 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                    }`}
                >
                  🏖️ FÉRIAS
                </button>
                <button
                  onClick={() => setEditorMode("falta")}
                  className={`flex-1 py-1.5 text-[10px] font-bold rounded-md transition-all ${editorMode === "falta"
                    ? "bg-red-600 text-white shadow-sm"
                    : "text-slate-500 hover:text-slate-300"
                    }`}
                >
                  ❌ FALTA
                </button>
                <button
                  onClick={() => setEditorMode("partial")}
                  className={`flex-1 py-1.5 text-[10px] font-bold rounded-md transition-all ${editorMode === "partial"
                    ? "bg-orange-500 text-white shadow-sm"
                    : "text-slate-500 hover:text-slate-300"
                    }`}
                >
                  ⚠️ PARCIAL
                </button>
              </div>

              <div className="bg-slate-900 p-2 rounded-lg border border-slate-700">
                <CalendarGrid
                  vig={managingVig}
                  month={month}
                  editorMode={editorMode}
                  onToggleDay={localToggleDay}
                  onToggleVacation={localToggleVacation}
                  onToggleFalta={localToggleFalta}
                  onTogglePartial={localTogglePartial}
                />
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <Button variant="secondary" onClick={() => setManagingVig(null)}>
                  Cancelar
                </Button>
                <Button onClick={handleSaveSchedule} className="bg-emerald-600 hover:bg-emerald-700">
                  <Icons.Save className="w-4 h-4" /> SALVAR ALTERAÇÕES
                </Button>
              </div>
            </>
          )}
        </div>
      </Modal>

      {/* MODAL: Edit Preset Details */}
      {managingPreset && (
        <Modal
          isOpen={true}
          onClose={() => setManagingPreset(null)}
          title="Editar Detalhes do Posto"
          className="max-w-md"
        >
          <div className="flex flex-col gap-4">
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase">Nome do Posto</label>
              <input
                className="w-full bg-slate-900 border border-slate-700 text-white rounded p-2 text-sm mt-1 focus:border-purple-500 outline-none"
                value={managingPreset.name}
                onChange={e => setManagingPreset({ ...managingPreset, name: e.target.value })}
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase">Horário</label>
              <input
                className="w-full bg-slate-900 border border-slate-700 text-white rounded p-2 text-sm mt-1 focus:border-purple-500 outline-none"
                value={managingPreset.horario}
                onChange={e => setManagingPreset({ ...managingPreset, horario: e.target.value })}
                placeholder="Ex: 06h às 18h15"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase">Intervalo / Refeição</label>
              <input
                className="w-full bg-slate-900 border border-slate-700 text-white rounded p-2 text-sm mt-1 focus:border-purple-500 outline-none"
                value={managingPreset.refeicao}
                onChange={e => setManagingPreset({ ...managingPreset, refeicao: e.target.value })}
                placeholder="Ex: 12h às 13h"
              />
            </div>

            <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-slate-700">
              <Button variant="ghost" onClick={() => setManagingPreset(null)}>Cancelar</Button>
              <Button onClick={handleSavePreset} className="bg-purple-600 hover:bg-purple-500 text-white">Salvar</Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
