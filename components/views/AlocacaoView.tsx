import React, { useMemo, useState } from "react";
import {
  Vigilante,
  DepartmentPreset,
  VisibilityPermission,
  User,
} from "../../types";
import {
  cleanString,
  calculateDaysForTeam,
  normalizeTeamCode,
} from "../../utils";
import { TEAM_OPTIONS } from "../../constants";
import {
  Icons,
  Badge,
  SearchableSelect,
  Button,
  Select,
  Modal,
  Input,
} from "../ui";
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
  onUpdatePreset?: (
    presetId: string,
    updates: Partial<DepartmentPreset>,
  ) => void;
  onCreateVigilante?: () => void;
  onDeleteVigilante?: (vig: Vigilante) => void;
  userPermissions?: VisibilityPermission[];
  user?: User | null;
  currentUserVig?: Vigilante | null;
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
  onCreateVigilante,
  onDeleteVigilante,
  userPermissions,
  user,
  currentUserVig,
}) => {
  // --- STATE ---
  const [filterTeam, setFilterTeam] = useState<string>("TODAS"); // TODAS | ECO1 | ECO2 | specific team

  // Modal State
  const [managingVig, setManagingVig] = useState<Vigilante | null>(null);
  const [editorMode, setEditorMode] = useState<
    "days" | "vacation" | "falta" | "partial" | "edit_info"
  >("days");

  // Edit Preset State
  const [managingPreset, setManagingPreset] = useState<DepartmentPreset | null>(
    null,
  );

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

  // Helper: Check Edit Permission
  const canEdit = (target: string) => {
    if (isMaster) return true;
    if (!userPermissions || userPermissions.length === 0) return true;

    let key = cleanString(target);
    // Normalize logic matching App.tsx
    if (key === "ECO1" || key === "E1" || target.includes("DIURNO"))
      key = "ECO 1";
    if (key === "ECO2" || key === "E2" || target.includes("NOTURNO"))
      key = "ECO 2";
    if (key === "ADM") key = "ADM";

    // Explicit permission check
    const perm = userPermissions.find(
      (p) => cleanString(p.team) === cleanString(key),
    );
    return !!perm?.canEdit;
  };

  // --- FILTER LOGIC ---
  const filteredVigilantes = useMemo(() => {
    return vigilantes.filter((v) => {
      // 1. Visible Teams Filter (Base Access)
      const vTeam = normalizeTeamCode(v.eq);

      // FIX: Master sees ALL, regardless of whether the team is in the explicit list (e.g. "SEM EQUIPE")
      if (!isMaster) {
        // ROBUST MATCHING: "C (CHARLIE)" must match "C"
        // lancadorVisibleTeams are already normalized to ["C", "ECO1", "ADM"] by App.tsx
        // but we double-normalize to be safe.
        const allowed = lancadorVisibleTeams.map(normalizeTeamCode);

        if (!allowed.includes(vTeam)) return false;
      }

      // 2. Specific Filter (UI)
      if (filterTeam && filterTeam !== "TODAS") {
        const target = cleanString(filterTeam); // e.g., "D", "ECO 1"

        // Normalization for Comparison
        // We want to ensure "ECO 1" matches "ECO1" or "E1"
        const normalizeTeam = (t: string) => {
          const c = cleanString(t).replace(/\s+/g, ""); // "ECO 1" -> "ECO1"
          if (c === "E1") return "ECO1";
          if (c === "E2") return "ECO2";
          return c;
        };

        const vTeamNorm = normalizeTeam(vTeam);
        const targetNorm = normalizeTeam(target);

        // UX IMPROVEMENT: Always show "A DEFINIR" so they can be assigned
        if (vTeam === "ADEFINIR" || v.eq === "A DEFINIR") return true;

        if (vTeamNorm !== targetNorm) return false;
      }

      return true;
    });
  }, [vigilantes, lancadorVisibleTeams, filterTeam]);

  // Helpers for string matching
  const idIncludes = (p: DepartmentPreset, s: string) =>
    (p.id || "").toUpperCase().includes(s);
  const strIncludes = (p: DepartmentPreset, s: string) =>
    (p.name || "").toUpperCase().includes(s) ||
    (p.sector || "").toUpperCase().includes(s) ||
    (p.campus || "").toUpperCase().includes(s);

  // --- PRESET GROUPING ---
  const groupedPresets = useMemo(() => {
    const groups: Record<string, DepartmentPreset[]> = {};

    const normVisible = lancadorVisibleTeams.map((t) =>
      cleanString(t).replace(/\s+/g, ""),
    );
    // Explicit Team Detection
    const hasDiurno = normVisible.some((t) =>
      ["C", "D", "ADM", "ECO1", "E1"].includes(t),
    );
    const hasNoturno = normVisible.some((t) =>
      ["A", "B", "ECO2", "E2"].includes(t),
    );

    // Determine if we should enforcing Strict View (Not Master)
    // If user has access to BOTH (Master), we show everything.
    // If user has access to ONLY one side, we strictly hide the other.
    const isStrictDiurno = hasDiurno && !hasNoturno;
    const isStrictNoturno = hasNoturno && !hasDiurno;

    presets.forEach((p) => {
      const type = (p.type || "").toUpperCase();
      const campus = (p.campus || "").toUpperCase();
      const sector = (p.sector || "").toUpperCase();

      // 1. SUPERVISION RULE: Only Master sees Supervision/Admin presets
      if (campus.includes("SUPERVISÃO") && !isMaster) {
        return;
      }

      // 1.1 TEAM SPECIFIC PRESET RULE (REQUESTED BY USER)
      // If the preset has a specific team assigned (e.g., "C"), ONLY users who can see "C" should see this preset.
      if (p.team) {
        const requiredTeam = cleanString(p.team);
        const userCanSee = lancadorVisibleTeams
          .map(cleanString)
          .includes(requiredTeam);

        // Special case: Master sees everything (already handled by lancadorVisibleTeams usually containing everything, but let's be safe)
        // Actually lancadorVisibleTeams for Master is usually ["A","B","C"...].
        // So if I am Fiscal A, my visible teams are ["A", "ECO2", "ADM"]. I should NOT see a preset for Team C.

        if (!userCanSee) return;
      }

      // 2. STRICT TYPE FILTERING (Cross Rule / Regra Cruzada)
      // If the preset is explicitly typed, enforce visibility immediately.
      if (p.type === "12x36_DIURNO" && isStrictNoturno) return;
      if (p.type === "12x36_NOTURNO" && isStrictDiurno) return;

      // 3. Fallback / Heuristic Filtering (if type is not explicit or for legacy data)
      // Identify Preset content characteristics
      const isDiurnoContent =
        type.includes("DIURNO") ||
        idIncludes(p, "DIURNO") ||
        strIncludes(p, "DIURNO");

      const isNoturnoContent =
        type.includes("NOTURNO") ||
        idIncludes(p, "NOTURNO") ||
        strIncludes(p, "NOTURNO");

      // Apply Strict Filtering based on Content tags if Type wasn't caught
      if (isDiurnoContent && isStrictNoturno) return;
      if (isNoturnoContent && isStrictDiurno) return;

      // 4. General "Should Show" Logic for non-strict cases or shared teams
      const isExpediente =
        type.includes("EXPEDIENTE") ||
        campus.includes("EXPEDIENTE") ||
        strIncludes(p, "EXPEDIENTE");

      const isEco1 =
        sector.includes("ECO 1") ||
        sector.includes("ECO1") ||
        campus.includes("ECO 1");
      const isEco2 =
        sector.includes("ECO 2") ||
        sector.includes("ECO2") ||
        campus.includes("ECO 2");

      let shouldShow = false;

      // Master sees all
      if (isMaster) shouldShow = true;
      // Expediente is visible to all (usually) or check permissions? Assume visible for now.
      else if (isExpediente) shouldShow = true;
      else {
        // Teams Logic
        if (hasDiurno && (isDiurnoContent || isEco1 || !isNoturnoContent))
          shouldShow = true;
        if (hasNoturno && (isNoturnoContent || isEco2 || !isDiurnoContent))
          shouldShow = true;

        // Handle "A Definir" or generic presets
        if (campus.includes("DEFINIR") || sector.includes("DEFINIR"))
          shouldShow = true;
      }

      // 5. Team Filter (Dropdown)
      if (filterTeam !== "TODAS") {
        const target = cleanString(filterTeam); // e.g. "A"

        // Use helper to see what teams are allowed for this preset type
        const compatible = getCompatibleTeams(type).map(cleanString);

        // NORMALIZE ECO 1 / ECO 2 checks
        // If I filter for "ECO 1", I should see anything that accepts "ECO 1" OR "ECO1"
        // If I filter for "A", I should see anything that accepts "A"

        // If the preset allows the selected filter team, SHOW IT.
        // Exception: Explicit Team Presets rule (already handled above in 1.1? kind of).

        let match = false;

        if (target === "ECO1" || target === "E1" || target === "ECO 1") {
          if (
            compatible.includes("ECO1") ||
            compatible.includes("E1") ||
            compatible.includes("ECO 1")
          )
            match = true;
        } else if (target === "ECO2" || target === "E2" || target === "ECO 2") {
          if (
            compatible.includes("ECO2") ||
            compatible.includes("E2") ||
            compatible.includes("ECO 2")
          )
            match = true;
        } else {
          if (compatible.includes(target)) match = true;
        }

        if (!match) shouldShow = false;
      }

      if (shouldShow) {
        if (!groups[p.campus]) groups[p.campus] = [];
        groups[p.campus].push(p);
      }
    });

    return groups;
  }, [presets, lancadorVisibleTeams, isMaster, filterTeam]);

  const campusList = useMemo(() => {
    let list = Object.keys(groupedPresets)
      .filter((c) => c !== "AFASTADOS")
      .sort();

    // UI CLEANUP Strategy:
    // If we have "CAMPUS I - DIURNO" or "NOTURNO", hide the generic "CAMPUS I"
    // to prevent duplication confusing the user.
    const hasC1Refined = list.some((c) => c.includes("CAMPUS I -"));
    if (hasC1Refined) list = list.filter((c) => c !== "CAMPUS I");

    const hasC2Refined = list.some((c) => c.includes("CAMPUS II -"));
    if (hasC2Refined) list = list.filter((c) => c !== "CAMPUS II");

    return list;
  }, [groupedPresets]);

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
      saidasAntecipadas: managingVig.saidasAntecipadas,
      nome: managingVig.nome,
      eq: managingVig.eq,
      mat: managingVig.mat, // Allow fixing matricula if needed (be careful with ID mismatch if Logic relies on it, but usually Mat is the key)
    });
    setManagingVig(null);
  };

  const localToggleDay = (_: Vigilante, day: number) => {
    if (!managingVig) return;

    // PATTERN GUARD: Check if the day is valid for this team
    const validDays = calculateDaysForTeam(managingVig.eq, month);
    const isStandardDay = validDays.includes(day);
    const isCurrentlyWorking = managingVig.dias.includes(day);

    // Rule:
    // 1. If currently working, allow toggling off (becomes Folga Extra or just removed)
    // 2. If NOT working, only allow toggling ON if it matches the standard pattern
    //    (Prevents accidentally clicking an even day for an odd-day team)
    // Exception: If user really wants to force an extra day, they should probably use "Cobertura" or we might need a bypass.
    // user instruction: "inconsistência não pode deixar... tem que conseguir clicar somente no dia que ele trabalha"

    if (!isCurrentlyWorking && !isStandardDay) {
      alert("⚠️ Bloqueado: Este dia está fora do padrão da equipe.");
      return;
    }

    const target = { ...managingVig };
    target.dias = target.dias || [];
    target.folgasGeradas = target.folgasGeradas || [];

    if (target.dias.includes(day)) {
      target.dias = target.dias.filter((d) => d !== day);
      if (!target.folgasGeradas.includes(day) && validDays.includes(day)) {
        target.folgasGeradas.push(day);
      }
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
          <div className="text-xs text-slate-400">{currentLabel}</div>
        </div>

        {/* CONTROLS */}
        <div className="flex flex-wrap items-center gap-3">
          {isMaster && onCreateVigilante && (
            <Button
              onClick={onCreateVigilante}
              className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs py-1.5 h-8 gap-2"
            >
              <Icons.Plus className="w-3 h-3" />
              Novo Vigilante
            </Button>
          )}

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
              {Array.from(
                new Set(
                  lancadorVisibleTeams.map((t) => {
                    const cleaned = cleanString(t);
                    // Normalize display to user preference
                    if (cleaned === "ECO1" || cleaned === "E1") return "ECO 1";
                    if (cleaned === "ECO2" || cleaned === "E2") return "ECO 2";
                    return t; // Keep others as is (A, B, C, D, ADM)
                  }),
                ),
              )
                .sort()
                .map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
            </Select>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* DIAGNOSTIC ALERT FOR FISCALS WITH ZERO VISIBILITY */}
        {!isMaster && filteredVigilantes.length === 0 && (
          <div className="bg-red-900/40 border border-red-700 p-4 rounded-xl text-red-200 text-xs space-y-2">
            <h3 className="font-bold flex items-center gap-2 text-sm text-red-100">
              <Icons.AlertTriangle className="w-4 h-4" />
              Diagnóstico de Visibilidade (Suporte)
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="opacity-50 block uppercase text-[10px]">
                  Usuário Logado
                </span>
                <span className="font-mono bg-black/30 px-1 rounded">
                  {user?.nome} ({user?.mat})
                </span>
              </div>
              <div>
                <span className="opacity-50 block uppercase text-[10px]">
                  Vínculo Vigilante
                </span>
                <span
                  className={`font-mono px-1 rounded ${currentUserVig
                    ? "bg-emerald-900/50 text-emerald-300"
                    : "bg-red-900/50 text-red-300 font-bold"
                    }`}
                >
                  {currentUserVig
                    ? `OK (Eq: ${currentUserVig.eq})`
                    : "⚠️ NÃO ENCONTRADO"}
                </span>
              </div>
              <div className="col-span-2">
                <span className="opacity-50 block uppercase text-[10px]">
                  Equipes Visíveis (Calculado)
                </span>
                <span className="font-mono bg-black/30 px-1 rounded break-all">
                  {lancadorVisibleTeams.join(", ") || "(Nenhuma)"}
                </span>
              </div>
            </div>
            {!currentUserVig && (
              <p className="border-t border-red-800 pt-2 mt-2">
                <b>Ação Necessária:</b> A matrícula do usuário ({user?.mat}) não
                corresponde a nenhum vigilante ativo na escala deste mês.
                Verifique se a matrícula no cadastro de usuário é EXATAMENTE a
                mesma do cadastro de equipe.
              </p>
            )}
          </div>
        )}

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
                            <span className="text-red-400 font-bold">
                              FALTA (Hoje)
                            </span>
                          ) : isVacationToday ? (
                            <span className="text-amber-400 font-bold">
                              FÉRIAS (Hoje)
                            </span>
                          ) : isWorkingToday ? (
                            <span className="text-emerald-400 font-bold">
                              TRABALHANDO
                            </span>
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
              className={`bg-slate-800 rounded-xl shadow-sm border border-slate-700 transition-all ${!isExpanded ? "opacity-75 hover:opacity-100" : ""
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
                    .sort((a, b) => {
                      const secCompare = (a.sector || "").localeCompare(
                        b.sector || "",
                      );
                      if (secCompare !== 0) return secCompare;
                      const nameCompare = (a.name || "").localeCompare(
                        b.name || "",
                      );
                      if (nameCompare !== 0) return nameCompare;
                      return (a.id || "").localeCompare(b.id || "");
                    })
                    .map((preset, idx) => {
                      // HELPER: Loose matching for Campus names (handles Unification & Shift Splits)
                      const areCampusesEquivalent = (
                        vigCampus: string,
                        presetCampus: string,
                      ) => {
                        const vC = cleanString(vigCampus).replace(/\s+/g, " ");
                        const pC = cleanString(presetCampus).replace(
                          /\s+/g,
                          " ",
                        );
                        if (vC === pC) return true;

                        // Handle Expediente Unification
                        if (
                          pC.includes("EXPEDIENTE") &&
                          vC.includes("EXPEDIENTE")
                        ) {
                          if (vC.startsWith(pC)) return true;
                        }

                        // Handle DIURNO/NOTURNO Split vs Base Generics
                        // Validates if P="CAMPUS I - DIURNO" and V="CAMPUS I"
                        // But be careful not to match "CAMPUS II" with "CAMPUS I"
                        if (
                          (pC.includes("DIURNO") || pC.includes("NOTURNO")) &&
                          !vC.includes("-")
                        ) {
                          // If P is "CAMPUS I - DIURNO" and V is "CAMPUS I", correct.
                          if (pC.startsWith(vC)) return true;
                        }

                        return false;
                      };

                      // Quem está neste posto?
                      const allOccupants = vigilantes
                        .filter(
                          (v) =>
                            areCampusesEquivalent(v.campus, preset.campus) &&
                            cleanString(v.setor) === cleanString(preset.sector),
                        )
                        .sort((a, b) => a.nome.localeCompare(b.nome));

                      // Prioritize occupants matching the preset's team
                      let availableOccupant = allOccupants.find((v) => {
                        if (displayedVigilantes.has(v.mat)) return false;
                        if (!preset.team) return true;

                        // Check Team Match
                        const vTeam = cleanString(v.eq).replace(/\s+/g, "");
                        const pTeam = cleanString(preset.team).replace(
                          /\s+/g,
                          "",
                        );

                        if (vTeam === pTeam) return true;
                        if (
                          (vTeam === "E1" || vTeam === "ECO1") &&
                          (pTeam === "E1" || pTeam === "ECO1")
                        )
                          return true;
                        if (
                          (vTeam === "E2" || vTeam === "ECO2") &&
                          (pTeam === "E2" || pTeam === "ECO2")
                        )
                          return true;

                        return false;
                      });

                      // FALLBACK: If we didn't find a strict team match, but there ARE people in this sector,
                      // take the first one who isn't displayed yet.
                      // This fixes "Vago" when a Team A person is covering a Team D slot.
                      if (!availableOccupant && allOccupants.length > 0) {
                        availableOccupant = allOccupants.find(
                          (v) => !displayedVigilantes.has(v.mat),
                        );
                      }

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

                          // Shift Check - Master bypasses this to allow cross-coverage
                          if (!isMaster) {
                            if (!shiftTeams.includes(vTeam)) return false;
                          }
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
                                {preset.team && (
                                  <span className="ml-2 text-[10px] bg-purple-900/50 text-purple-300 border border-purple-700/50 px-1.5 py-0.5 rounded font-mono font-bold">
                                    EQ: {preset.team}
                                  </span>
                                )}
                              </span>
                              <div className="flex flex-wrap gap-2 mt-2">
                                <span className="text-xs text-slate-300 font-mono bg-slate-800/80 border border-slate-700 px-2 py-1 rounded flex items-center gap-1.5 shadow-sm">
                                  <Icons.Clock
                                    className="text-blue-400 w-3 h-3"
                                  />
                                  {preset.horario}
                                </span>
                                {preset.refeicao && (
                                  <span className="text-xs text-slate-400 font-mono bg-slate-800/50 border border-slate-700/50 px-2 py-1 rounded flex items-center gap-1.5">
                                    <span className="text-[10px]">🍽️</span>{" "}
                                    {preset.refeicao}
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
                                className="text-slate-600 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity p-2 bg-slate-800 rounded-full hover:bg-slate-700"
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
                                const isWorking = (occ.dias || []).includes(
                                  today,
                                );
                                return (
                                  <div
                                    key={occ.mat}
                                    className={`flex flex-col border rounded-lg p-2.5 shadow-sm animate-fade-in group ${!isWorking
                                      ? "bg-red-900/10 border-red-900/30"
                                      : "bg-slate-800 border-slate-600"
                                      }`}
                                  >
                                    <div className="flex items-center justify-between mb-2">
                                      <div className="flex items-center gap-3">
                                        <Badge team={occ.eq} />
                                        {/* CRUZAMENTO CHECK */}
                                        {preset.team &&
                                          cleanString(preset.team) !==
                                          cleanString(occ.eq) && (
                                            <span
                                              className="text-[9px] bg-amber-500/20 text-amber-300 border border-amber-500/50 px-1.5 py-0.5 rounded font-bold uppercase tracking-widest"
                                              title={`Vigilante da Equipe ${occ.eq} alocado em posto da Equipe ${preset.team}`}
                                            >
                                              ⚠️ CRUZAMENTO
                                            </span>
                                          )}
                                        <div>
                                          <div className="font-bold text-sm text-white flex items-center gap-2 group-hover:text-blue-300 transition-colors">
                                            {occ.nome}
                                            {!isWorking && (
                                              <span className="text-[9px] bg-red-600 text-white px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">
                                                FOLGA HOJE
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
                                          onClick={() =>
                                            handleOpenSchedule(occ)
                                          }
                                          disabled={!canEdit(occ.eq)}
                                          className={`flex items-center gap-1 bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded-md text-[10px] font-bold transition-all shadow-sm ${!canEdit(occ.eq) ? "opacity-50 cursor-not-allowed" : ""}`}
                                          title={
                                            canEdit(occ.eq)
                                              ? "Gerenciar Escala"
                                              : "Sem permissão para editar"
                                          }
                                        >
                                          <Icons.Calendar className="w-3 h-3" />
                                          ESCALA
                                        </button>
                                        <button
                                          onClick={() =>
                                            handleUnassign(occ.mat)
                                          }
                                          disabled={!canEdit(occ.eq)}
                                          className={`p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-900/20 rounded transition-colors ${!canEdit(occ.eq) ? "opacity-50 cursor-not-allowed" : ""}`}
                                          title={
                                            canEdit(occ.eq)
                                              ? "Desalocar"
                                              : "Sem permissão para desalocar"
                                          }
                                        >
                                          <Icons.X className="w-4 h-4" />
                                        </button>
                                      </div>
                                    </div>

                                    {/* SCHEDULE PREVIEW */}
                                    <div className="text-[11px] flex flex-col gap-1.5 border-t border-slate-700/50 pt-2">
                                      {/* Working Days */}
                                      <div className="flex items-start gap-1">
                                        <span className="text-slate-500 font-bold uppercase tracking-wider text-[10px] mt-0.5">
                                          DIAS:
                                        </span>
                                        <span className="font-mono text-emerald-400/90 leading-snug break-words">
                                          {(occ.dias || [])
                                            .sort((a, b) => a - b)
                                            .join(", ") || "Nenhum dia alocado"}
                                        </span>
                                      </div>

                                      {/* Folgas Extras */}
                                      {occ.folgasGeradas &&
                                        occ.folgasGeradas.length > 0 && (
                                          <div className="flex items-center gap-1">
                                            <span className="text-red-400/80 font-bold uppercase tracking-wider text-[10px]">
                                              FOLGAS EXTRAS:
                                            </span>
                                            <div className="flex flex-wrap gap-1">
                                              {occ.folgasGeradas
                                                .sort((a, b) => a - b)
                                                .map((d) => (
                                                  <span
                                                    key={d}
                                                    className="bg-red-500/20 text-red-300 px-1.5 rounded text-[10px] font-mono border border-red-500/30"
                                                  >
                                                    {d}
                                                  </span>
                                                ))}
                                              <button
                                                onClick={() =>
                                                  handleOpenSchedule(occ)
                                                }
                                                className="text-[10px] text-slate-500 hover:text-slate-300 underline ml-1"
                                              >
                                                (Alterar)
                                              </button>
                                            </div>
                                          </div>
                                        )}
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
                                    disabled={
                                      !canEdit(preset.type || preset.sector)
                                    }
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
              <div className="flex bg-slate-900 rounded-lg p-1 gap-1 mb-4 flex-wrap">
                <button
                  onClick={() => setEditorMode("edit_info")}
                  className={`flex-1 py-1.5 text-[10px] font-bold rounded-md transition-all ${editorMode === "edit_info"
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-slate-400 hover:text-slate-300 bg-slate-800 border border-slate-700"
                    }`}
                >
                  📝 DADOS
                </button>
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
                {editorMode === "edit_info" ? (
                  <div className="space-y-4 p-2">
                    <div>
                      <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">
                        Nome do Vigilante
                      </label>
                      <Input
                        value={managingVig.nome}
                        onChange={(e) =>
                          setManagingVig({
                            ...managingVig,
                            nome: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">
                        Matrícula
                      </label>
                      <Input
                        value={managingVig.mat}
                        onChange={(e) =>
                          setManagingVig({
                            ...managingVig,
                            mat: e.target.value,
                          })
                        }
                        className="font-mono text-yellow-300"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">
                        Equipe (Afeta os dias de trabalho)
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {TEAM_OPTIONS.map((t) => (
                          <button
                            key={t}
                            onClick={() => {
                              const newDays = calculateDaysForTeam(t, month);
                              setManagingVig({
                                ...managingVig,
                                eq: t,
                                dias: newDays,
                                folgasGeradas: [], // Reset generated days off as pattern changed
                              });
                            }}
                            className={`px-3 py-2 rounded text-xs font-bold border transition-all ${managingVig.eq === t
                              ? "bg-brand-600 text-white border-brand-500 shadow-md transform scale-105"
                              : "bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700"
                              }`}
                          >
                            {t}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <CalendarGrid
                    vig={managingVig}
                    month={month}
                    editorMode={editorMode}
                    onToggleDay={localToggleDay}
                    onToggleVacation={localToggleVacation}
                    onToggleFalta={localToggleFalta}
                    onTogglePartial={localTogglePartial}
                  />
                )}
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <Button
                  variant="secondary"
                  onClick={() => setManagingVig(null)}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleSaveSchedule}
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  <Icons.Save className="w-4 h-4" /> SALVAR ALTERAÇÕES
                </Button>
              </div>
              {onDeleteVigilante && (
                <div className="mt-4 pt-2 border-t border-slate-700 flex justify-start">
                  <Button
                    variant="ghost"
                    onClick={() => {
                      if (managingVig) {
                        onDeleteVigilante(managingVig);
                        setManagingVig(null); // Close modal locally
                      }
                    }}
                    className="text-red-500 hover:text-red-400 hover:bg-red-950/30 text-xs px-2"
                  >
                    🗑️ Excluir Vigilante
                  </Button>
                </div>
              )}
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
              <label className="text-xs font-bold text-slate-400 uppercase">
                Nome do Posto
              </label>
              <input
                className="w-full bg-slate-900 border border-slate-700 text-white rounded p-2 text-sm mt-1 focus:border-purple-500 outline-none"
                value={managingPreset.name}
                onChange={(e) =>
                  setManagingPreset({ ...managingPreset, name: e.target.value })
                }
              />
            </div>

            {/* SAFE TIME INPUTS */}
            <div className="p-3 bg-slate-800 rounded-lg border border-slate-700">
              <label className="text-xs font-bold text-blue-400 uppercase mb-2 block">
                Horário de Trabalho
              </label>
              <div className="flex items-center gap-2">
                <div className="flex-1">
                  <span className="text-[10px] text-slate-500 uppercase font-bold">
                    Início
                  </span>
                  <input
                    className="w-full bg-slate-900 border border-slate-600 text-white rounded p-2 text-sm focus:border-blue-500 outline-none text-center font-mono"
                    value={
                      managingPreset.timeStart ||
                      (managingPreset.horario || "").split(" às ")[0]?.trim() ||
                      ""
                    }
                    onChange={(e) => {
                      let val = e.target.value.replace(/\D/g, "");
                      if (val.length > 4) val = val.slice(0, 4);
                      if (val.length >= 3) {
                        val = `${val.slice(0, 2)}:${val.slice(2)}`;
                      }
                      const currentEnd =
                        managingPreset.timeEnd ||
                        (managingPreset.horario || "").split(" às ")[1]?.trim() ||
                        "";
                      setManagingPreset({
                        ...managingPreset,
                        timeStart: val,
                        horario: `${val} às ${currentEnd}`,
                      });
                    }}
                    placeholder="06:00"
                  />
                </div>
                <span className="text-slate-500 mt-4">às</span>
                <div className="flex-1">
                  <span className="text-[10px] text-slate-500 uppercase font-bold">
                    Fim
                  </span>
                  <input
                    className="w-full bg-slate-900 border border-slate-600 text-white rounded p-2 text-sm focus:border-blue-500 outline-none text-center font-mono"
                    value={
                      managingPreset.timeEnd ||
                      (managingPreset.horario || "").split(" às ")[1]?.trim() ||
                      ""
                    }
                    onChange={(e) => {
                      let val = e.target.value.replace(/\D/g, "");
                      if (val.length > 4) val = val.slice(0, 4);
                      if (val.length >= 3) {
                        val = `${val.slice(0, 2)}:${val.slice(2)}`;
                      }
                      const currentStart =
                        managingPreset.timeStart ||
                        (managingPreset.horario || "").split(" às ")[0]?.trim() ||
                        "";
                      setManagingPreset({
                        ...managingPreset,
                        timeEnd: val,
                        horario: `${currentStart} às ${val}`,
                      });
                    }}
                    placeholder="18:00"
                  />
                </div>
              </div>
              <p className="text-[10px] text-slate-500 mt-1 italic">
                Formato sugerido: 06:00, 18:00, 07:30
              </p>
            </div>

            <div className="p-3 bg-slate-800 rounded-lg border border-slate-700">
              <label className="text-xs font-bold text-orange-400 uppercase mb-2 block">
                Intervalo / Refeição
              </label>
              <div className="flex items-center gap-2">
                <div className="flex-1">
                  <span className="text-[10px] text-slate-500 uppercase font-bold">
                    Início
                  </span>
                  <input
                    className="w-full bg-slate-900 border border-slate-600 text-white rounded p-2 text-sm focus:border-orange-500 outline-none text-center font-mono"
                    value={
                      managingPreset.mealStart ||
                      (managingPreset.refeicao
                        ? managingPreset.refeicao.split(" às ")[0]?.trim()
                        : "")
                    }
                    onChange={(e) => {
                      let val = e.target.value.replace(/\D/g, "");
                      if (val.length > 4) val = val.slice(0, 4);
                      if (val.length >= 3) {
                        val = `${val.slice(0, 2)}:${val.slice(2)}`;
                      }
                      const currentEnd =
                        managingPreset.mealEnd ||
                        (managingPreset.refeicao
                          ? managingPreset.refeicao.split(" às ")[1]?.trim()
                          : "");
                      setManagingPreset({
                        ...managingPreset,
                        mealStart: val,
                        refeicao: `${val} às ${currentEnd}`,
                      });
                    }}
                    placeholder="12:00"
                  />
                </div>
                <span className="text-slate-500 mt-4">às</span>
                <div className="flex-1">
                  <span className="text-[10px] text-slate-500 uppercase font-bold">
                    Fim
                  </span>
                  <input
                    className="w-full bg-slate-900 border border-slate-600 text-white rounded p-2 text-sm focus:border-orange-500 outline-none text-center font-mono"
                    value={
                      managingPreset.mealEnd ||
                      (managingPreset.refeicao
                        ? managingPreset.refeicao.split(" às ")[1]?.trim()
                        : "")
                    }
                    onChange={(e) => {
                      let val = e.target.value.replace(/\D/g, "");
                      if (val.length > 4) val = val.slice(0, 4);
                      if (val.length >= 3) {
                        val = `${val.slice(0, 2)}:${val.slice(2)}`;
                      }
                      const currentStart =
                        managingPreset.mealStart ||
                        (managingPreset.refeicao
                          ? managingPreset.refeicao.split(" às ")[0]?.trim()
                          : "");
                      setManagingPreset({
                        ...managingPreset,
                        mealEnd: val,
                        refeicao: `${currentStart} às ${val}`,
                      });
                    }}
                    placeholder="13:00"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-slate-700">
              <Button variant="ghost" onClick={() => setManagingPreset(null)}>
                Cancelar
              </Button>
              <Button
                onClick={handleSavePreset}
                className="bg-purple-600 hover:bg-purple-500 text-white"
              >
                Salvar
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
