import React, { useState, useMemo } from "react";
import { Vigilante, User, Team, DepartmentPreset } from "../../types";
import { sectorPresets } from "../../presets";
import { Button, Input, Select, Badge, Icons } from "../ui";
import { CalendarGrid } from "../common/CalendarGrid";
import { calculateDaysForTeam } from "../../utils";
import { SHIFT_TYPES, ShiftType } from "../../constants";

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
  setTimeInputs: (v: {
    hStart: string;
    hEnd: string;
    rStart: string;
    rEnd: string;
  }) => void;
  editorMode: "days" | "vacation" | "falta" | "partial";
  setEditorMode: (v: "days" | "vacation" | "falta" | "partial") => void;
  handleSaveEditor: () => void;
  handleDeleteVigilante: () => void;
  handleToggleDay: (vig: Vigilante, day: number) => void; // Mantido para compatibilidade, mas não usado no grid local
  handleToggleVacation: (vig: Vigilante, day: number) => void; // Mantido para compatibilidade
  handleToggleFalta: (vig: Vigilante, day: number) => void; // Mantido para compatibilidade
  handleTogglePartial: (vig: Vigilante, day: number) => void; // Mantido para compatibilidade
  setIsNewVigModalOpen: (v: boolean) => void;
  handleSmartSuggest: () => void;
  month: number;
  lancadorVisibleTeams: string[];
  expandedSectors: Set<string>;
  toggleSectorExpansion: (sector: string) => void;
  presets: DepartmentPreset[];
  onOpenPresetManager: () => void;
}

const LancadorViewComponent: React.FC<LancadorViewProps> = (props) => {
  const {
    showMobileEditor,
    setShowMobileEditor,
    currentLabel,
    user,
    selectedLancadorTeam,
    setSelectedLancadorTeam,
    lancadorSearch,
    setLancadorSearch,
    editingVig,
    setEditingVig,
    lancadorSummary,
    lancadorList,
    timeInputs,
    setTimeInputs,
    editorMode,
    setEditorMode,
    handleSaveEditor,
    handleDeleteVigilante,
    setIsNewVigModalOpen,
    handleSmartSuggest,
    month,
    lancadorVisibleTeams,

    expandedSectors,
    toggleSectorExpansion,
    presets,
    onOpenPresetManager,
  } = props;

  // --- STATES FOR VIEW CONFIGURATION ---
  const [expedienteShiftFilter, setExpedienteShiftFilter] = useState("ALL");

  // --- LÓGICA LOCAL DE EDIÇÃO (SEM SALVAR NO BANCO) ---

  const handleTeamChange = (newTeam: Team) => {
    if (editingVig) {
      const newDays = calculateDaysForTeam(newTeam, month, editingVig.vacation);
      setEditingVig({
        ...editingVig,
        eq: newTeam,
        dias: newDays,
        folgasGeradas: [],
      });
    }
  };

  const localToggleDay = (_: Vigilante, day: number) => {
    if (!editingVig) return;
    const target = { ...editingVig };

    // Garante arrays
    target.dias = target.dias || [];
    target.folgasGeradas = target.folgasGeradas || [];

    if (target.dias.includes(day)) {
      // Remove dia de trabalho -> Vira folga
      target.dias = target.dias.filter((d) => d !== day);
      if (!target.folgasGeradas.includes(day)) target.folgasGeradas.push(day);
    } else {
      // Adiciona dia de trabalho -> Remove folga
      target.dias.push(day);
      target.dias.sort((a, b) => a - b);
      target.folgasGeradas = target.folgasGeradas.filter((d) => d !== day);
    }
    // Remove de outras listas se houver conflito
    target.faltas = (target.faltas || []).filter((d) => d !== day);

    setEditingVig(target);
  };

  const localToggleFalta = (_: Vigilante, day: number) => {
    if (!editingVig) return;
    const target = { ...editingVig };
    target.faltas = target.faltas || [];

    if (target.faltas.includes(day)) {
      target.faltas = target.faltas.filter((d) => d !== day);
    } else {
      target.faltas.push(day);
      target.faltas.sort((a, b) => a - b);
      // Se marcou falta, remove do dia trabalhado
      target.dias = (target.dias || []).filter((d) => d !== day);
    }
    setEditingVig(target);
  };

  const localTogglePartial = (_: Vigilante, day: number) => {
    if (!editingVig) return;
    const target = { ...editingVig };
    target.saidasAntecipadas = target.saidasAntecipadas || [];

    if (target.saidasAntecipadas.includes(day)) {
      target.saidasAntecipadas = target.saidasAntecipadas.filter(
        (d) => d !== day,
      );
    } else {
      target.saidasAntecipadas.push(day);
      target.saidasAntecipadas.sort((a, b) => a - b);
      // Se é parcial, garante que está como trabalhado
      if (!target.dias.includes(day)) {
        target.dias.push(day);
        target.dias.sort((a, b) => a - b);
        target.folgasGeradas = (target.folgasGeradas || []).filter(
          (d) => d !== day,
        );
      }
    }
    setEditingVig(target);
  };

  const localToggleVacation = (_: Vigilante, day: number) => {
    if (!editingVig) return;
    const target = { ...editingVig };
    const currentVacation = target.vacation || { start: 0, end: 0 };
    let newVacation = { ...currentVacation };

    if (!newVacation.start || newVacation.start === 0) {
      newVacation.start = day;
      newVacation.end = day;
    } else if (day < newVacation.start) {
      newVacation.start = day;
    } else if (day > newVacation.start) {
      newVacation.end = day;
    } else if (day === newVacation.start && day === newVacation.end) {
      // Reset se clicar no único dia selecionado
      newVacation = { start: 0, end: 0 };
    } else if (day === newVacation.start) {
      // Reset simples
      newVacation = { start: 0, end: 0 };
    } else {
      // Reset e começa novo
      newVacation = { start: day, end: day };
    }

    if (newVacation.start === 0) {
      target.vacation = undefined;
    } else {
      target.vacation = newVacation;
      // Limpa dias de trabalho no período de férias
      // Limpa dias de trabalho no período de férias
      target.dias = (target.dias || []).filter(
        (d) => d < newVacation.start || d > newVacation.end,
      );
      // FIX: Also clear generated days off (folgas extras) that conflict with vacation
      target.folgasGeradas = (target.folgasGeradas || []).filter(
        (d) => d < newVacation.start || d > newVacation.end,
      );
    }

    setEditingVig(target);
  };

  const sectorOptions = useMemo(() => {
    if (!editingVig) return [];

    const userTeam = editingVig.eq;
    let allowedShiftTypes: ShiftType[] = [];

    if (userTeam === "A" || userTeam === "B") {
      allowedShiftTypes = ["12x36_NOTURNO", "5x2_EXPEDIENTE"];
    } else if (userTeam === "C" || userTeam === "D") {
      allowedShiftTypes = ["12x36_DIURNO", "5x2_EXPEDIENTE"];
    } else {
      // For E1, E2, Adm, etc.
      allowedShiftTypes = [
        "ECO_1",
        "ECO_2",
        "EXP_ADM",
        "5x2_EXPEDIENTE" as ShiftType,
      ]; // Cast legacy if needed
    }

    // Use the 'presets' prop which contains the loaded DepartmentPreset objects (with 'type', 'name', etc.)
    // If presets is empty (e.g. not loaded yet), we might have no options, which is expected until load.
    const filteredPresets = presets.filter((preset) => {
      if (preset.type) {
        return allowedShiftTypes.includes(preset.type as ShiftType);
      }
      // Fallback for presets without a 'type' property (should have name)
      if (preset.name) {
        const isNight =
          preset.name.includes("Noturno") ||
          preset.timeStart.startsWith("18") ||
          preset.timeStart.startsWith("19");
        const neededType = isNight ? "12x36_NOTURNO" : "12x36_DIURNO";
        return allowedShiftTypes.includes(neededType as ShiftType);
      }
      return false;
    });

    return filteredPresets.map((p) => p.sector).sort();
  }, [editingVig, presets]);

  return (
    <div className="flex flex-1 h-full overflow-hidden bg-slate-900 relative print:h-auto print:overflow-visible">
      <div
        className={`w-full md:w-[380px] bg-slate-800 border-r border-slate-700 flex flex-col shadow-xl z-20 shrink-0 h-full absolute md:relative top-0 left-0 bottom-0 transition-transform duration-300 ease-in-out ${showMobileEditor
          ? "translate-x-0"
          : "-translate-x-full md:translate-x-0"
          } print:hidden`}
      >
        <div className="bg-slate-950 text-white p-4 text-center border-b border-slate-700 relative shrink-0">
          <button
            onClick={() => setShowMobileEditor(false)}
            className="absolute left-4 top-1/2 -translate-y-1/2 md:hidden text-slate-300 hover:text-white p-2 rounded-full hover:bg-white/10"
          >
            <span className="text-xl font-bold">←</span>
          </button>
          <div className="text-[10px] font-bold opacity-60 uppercase tracking-widest">
            EDITANDO:
          </div>
          <div className="text-xl font-black tracking-tight">
            {currentLabel}
          </div>
        </div>

        <div className="p-4 bg-slate-900 border-b border-slate-700 space-y-3 shrink-0">
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
              1. Filtrar Equipe:
            </label>
            <Select
              value={selectedLancadorTeam}
              onChange={(e) => setSelectedLancadorTeam(e.target.value)}
              className="bg-slate-700 text-white border-slate-600 shadow-sm"
            >
              <option value="TODAS">-- Todas --</option>
              {lancadorVisibleTeams.map((t) => (
                <option key={t} value={t}>
                  Equipe {t}
                </option>
              ))}
            </Select>
          </div>

          {/* New Filter: Turno (Only useful for EXPEDIENTE context usually, but good to have) */}
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
              2. Filtrar Turno:
            </label>
            <Select
              value={expedienteShiftFilter}
              onChange={(e) => setExpedienteShiftFilter(e.target.value)}
              className="bg-slate-700 text-white border-slate-600 shadow-sm"
            >
              <option value="ALL">-- Todos --</option>
              {Object.entries(SHIFT_TYPES).map(([k, v]) => {
                if (k.includes("12x36")) return null; // Too specific
                return (
                  <option key={k} value={k}>
                    {v}
                  </option>
                );
              })}
              <option value="ECO1">Apenas Diurno (06:00+)</option>
              <option value="ECO2">Apenas Noturno (18:00+)</option>
            </Select>
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
              3. Buscar Nome:
            </label>
            <Input
              placeholder="Digite para filtrar a lista..."
              value={lancadorSearch}
              onChange={(e) => setLancadorSearch(e.target.value)}
              className="bg-slate-700 text-white border-slate-600 shadow-sm"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 bg-slate-900 min-h-0">
          {editingVig ? (
            <div className="bg-slate-800 rounded-xl shadow-md border border-slate-600 overflow-hidden animate-fade-in">
              <div className="bg-slate-800 p-4 border-b border-slate-700 text-center">
                <h3 className="font-bold text-lg text-white leading-tight">
                  {editingVig.nome}
                </h3>
                <div className="text-xs text-slate-400 mt-1">
                  {editingVig.mat} | Eq <Badge team={editingVig.eq} />
                </div>
                {(editingVig.folgasGeradas || []).filter(
                  (f: number) => !(editingVig.dias || []).includes(f),
                ).length > 0 && (
                    <div className="mt-2 text-xs font-bold text-red-600">
                      Folgas Extras:{" "}
                      {
                        (editingVig.folgasGeradas || []).filter(
                          (f: number) => !(editingVig.dias || []).includes(f),
                        ).length
                      }
                    </div>
                  )}
              </div>
              <div className="p-4 space-y-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-300 block mb-1">
                    Equipe:
                  </label>
                  <Select
                    value={editingVig.eq}
                    onChange={(e) => handleTeamChange(e.target.value as Team)}
                    className="w-full text-xs border border-slate-600 rounded p-1.5 bg-slate-700 text-white"
                  >
                    {lancadorVisibleTeams.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </Select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-300 block mb-1">
                    Setor:
                  </label>
                  <Input
                    list="sector-options-list"
                    value={editingVig.setor}
                    onChange={(e) =>
                      setEditingVig({
                        ...editingVig,
                        setor: e.target.value.toUpperCase(),
                      })
                    }
                    className="h-8 text-xs bg-slate-700 text-white border-slate-600"
                  />
                  <datalist id="sector-options-list">
                    {sectorOptions.map((s) => (
                      <option key={s} value={s} />
                    ))}
                  </datalist>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-300 block mb-1">
                    Horário:
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      maxLength={5}
                      placeholder="00:00"
                      className="flex-1 border border-slate-600 bg-slate-700 text-white rounded p-1.5 text-xs text-center font-bold tracking-widest"
                      value={timeInputs.hStart}
                      onChange={(e) => {
                        let v = e.target.value.replace(/\D/g, "");
                        if (v.length > 4) v = v.slice(0, 4);
                        if (v.length >= 3) {
                          v = `${v.slice(0, 2)}:${v.slice(2)}`;
                        }
                        setTimeInputs({ ...timeInputs, hStart: v });
                      }}
                    />
                    <span className="text-[10px] font-bold text-slate-400">
                      às
                    </span>
                    <input
                      type="text"
                      maxLength={5}
                      placeholder="00:00"
                      className="flex-1 border border-slate-600 bg-slate-700 text-white rounded p-1.5 text-xs text-center font-bold tracking-widest"
                      value={timeInputs.hEnd}
                      onChange={(e) => {
                        let v = e.target.value.replace(/\D/g, "");
                        if (v.length > 4) v = v.slice(0, 4);
                        if (v.length >= 3) {
                          v = `${v.slice(0, 2)}:${v.slice(2)}`;
                        }
                        setTimeInputs({ ...timeInputs, hEnd: v });
                      }}
                    />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-300 block mb-1">
                    Refeição (Início):
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      maxLength={5}
                      placeholder="00:00"
                      className="flex-1 border border-slate-600 bg-slate-700 text-white rounded p-1.5 text-xs text-center font-bold tracking-widest"
                      value={timeInputs.rStart}
                      onChange={(e) => {
                        let v = e.target.value.replace(/\D/g, "");
                        if (v.length > 4) v = v.slice(0, 4);
                        if (v.length >= 3) {
                          v = `${v.slice(0, 2)}:${v.slice(2)}`;
                        }
                        setTimeInputs({ ...timeInputs, rStart: v });
                      }}
                    />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-300 block mb-1">
                    Campus:
                  </label>
                  <select
                    className="w-full text-xs border border-slate-600 rounded p-1.5 bg-slate-700 text-white"
                    value={editingVig.campus}
                    onChange={(e) =>
                      setEditingVig({ ...editingVig, campus: e.target.value })
                    }
                  >
                    <option>CAMPUS I - DIURNO</option>
                    <option>CAMPUS I - NOTURNO</option>
                    <option>CAMPUS II - DIURNO</option>
                    <option>CAMPUS II - NOTURNO</option>
                    <option>CAMPUS III - DIURNO</option>
                    <option>CAMPUS III - NOTURNO</option>
                    <option>CHÁCARA DA REITORIA</option>
                    <option>LABORATÓRIO</option>
                    <option>OUTROS</option>
                  </select>
                </div>
                <div className="border-t border-slate-700 pt-2 pb-1">
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
                </div>

                {/* CALENDÁRIO COM HANDLERS LOCAIS */}
                <CalendarGrid
                  vig={editingVig}
                  month={month}
                  editorMode={editorMode}
                  onToggleDay={localToggleDay}
                  onToggleVacation={localToggleVacation}
                  onToggleFalta={localToggleFalta}
                  onTogglePartial={localTogglePartial}
                />

                <div className="flex flex-col gap-3 pt-4 border-t border-slate-700">
                  <Button
                    onClick={handleSaveEditor}
                    className="w-full h-12 text-sm bg-emerald-600 hover:bg-emerald-700 text-white font-black shadow-lg uppercase tracking-wide transform active:scale-95 transition-all"
                  >
                    <Icons.Save className="w-5 h-5" /> SALVAR ALTERAÇÕES
                  </Button>

                  <div className="flex gap-2">
                    <Button
                      onClick={() => {
                        setEditingVig(null);
                        setShowMobileEditor(false);
                      }}
                      variant="secondary"
                      className="flex-1 h-8 text-xs bg-slate-700 border-slate-600 text-slate-300 hover:bg-slate-600 hover:text-white"
                    >
                      Cancelar
                    </Button>
                    <Button
                      onClick={handleDeleteVigilante}
                      variant="ghost"
                      className="flex-1 h-8 text-xs text-red-400 hover:bg-red-900/20 hover:text-red-300 border border-transparent hover:border-red-900/30"
                    >
                      <Icons.Trash className="w-3 h-3 mr-1" /> Excluir
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-slate-500 p-8 text-center border-2 border-dashed border-slate-700 rounded-xl">
              <div className="text-4xl mb-2">⬅️</div>
              <div className="text-sm font-bold">
                Selecione um nome na lista ao lado para editar
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 flex flex-col bg-slate-900 overflow-hidden h-full relative z-10 w-full print:overflow-visible print:h-auto">
        <div className="flex items-center gap-4 p-3 bg-slate-900 border-b border-slate-700 shadow-sm shrink-0 print:hidden">
          <div className="flex-1 flex gap-2 overflow-x-auto no-scrollbar">
            <div className="bg-slate-800 px-3 py-1 rounded text-xs font-bold text-slate-400 border border-slate-700 whitespace-nowrap">
              Total {lancadorSummary.total}
            </div>
            <div className="bg-green-50 px-3 py-1 rounded text-xs font-bold text-green-600 border border-green-200 whitespace-nowrap">
              Ok {lancadorSummary.ok}
            </div>
            <div className="bg-orange-50 px-3 py-1 rounded text-xs font-bold text-orange-500 border border-orange-200 whitespace-nowrap">
              Pend {lancadorSummary.pending}
            </div>
          </div>
          <Button
            onClick={() => setIsNewVigModalOpen(true)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-8 shadow-sm whitespace-nowrap px-3 flex items-center gap-1"
          >
            ➕ Novo
          </Button>
          <Button
            onClick={handleSmartSuggest}
            className="bg-purple-600 hover:bg-purple-700 text-white text-xs h-8 shadow-sm whitespace-nowrap"
          >
            ⚡ Sugerir
          </Button>
          <Button
            onClick={onOpenPresetManager}
            variant="ghost"
            className="text-slate-400 hover:text-white"
            title="Gerenciador de Postos/Presets"
          >
            <Icons.Settings className="w-5 h-5" />
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 bg-slate-900 min-h-0 print:overflow-visible print:h-auto print:bg-white">
          <div className="bg-slate-800 rounded-lg shadow-sm border border-slate-700 overflow-hidden print:border-none print:shadow-none">
            <div className="flex items-center gap-4 bg-slate-800 p-2 rounded-lg border border-slate-700 mb-2 print:hidden backdrop-blur-sm">
              <span className="text-xs font-bold text-slate-400 uppercase">
                Visualizando Dia:
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() =>
                    setSelectedDay((prev) => (prev > 1 ? prev - 1 : prev))
                  }
                  className="p-1 hover:bg-slate-700 rounded text-slate-300"
                >
                  ◀
                </button>
                <div className="bg-slate-900 px-4 py-1 rounded border border-blue-500/30 text-blue-400 font-bold text-sm min-w-[3rem] text-center shadow-[0_0_10px_rgba(59,130,246,0.2)]">
                  {selectedDay}
                </div>
                <button
                  onClick={() =>
                    setSelectedDay((prev) => (prev < 31 ? prev + 1 : prev))
                  }
                  className="p-1 hover:bg-slate-700 rounded text-slate-300"
                >
                  ▶
                </button>
              </div>
              <span className="text-xs text-slate-500 hidden md:inline-block border-l border-slate-700 pl-4 ml-2">
                Use este seletor para ver quem trabalha no dia e lançar folgas.
              </span>
            </div>

            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 font-bold border-b border-slate-700 sticky top-0 z-10 print:static print:bg-gray-200 print:text-black">
                <tr>
                  <th className="px-4 py-3">NOME</th>
                  <th className="px-4 py-3 w-16 text-center">EQ</th>
                  <th className="px-4 py-3 w-20">SETOR</th>
                  <th className="px-4 py-3 w-32">CAMPUS</th>
                  <th className="px-4 py-3 w-20 text-center">HORÁRIO</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700">
                {/* GROUP BY CAMPUS LOGIC */}
                {/* GROUP BY CAMPUS LOGIC */}
                {(() => {
                  // Pre-process grouping to match EscalaView logic
                  const groups: Record<string, Vigilante[]> = {};

                  // Sort Logic if needed
                  const sortedList = [...lancadorList].sort((a, b) =>
                    a.nome.localeCompare(b.nome),
                  );

                  sortedList.forEach((v) => {
                    // Filter Logic: Shift (Turno)
                    if (expedienteShiftFilter !== "ALL") {
                      // Heuristic: Check preset time if available or default
                      // We used presets prop. Let's try to match v.setor to a preset
                      const preset = presets.find(
                        (p) => p.sector === v.setor && p.campus === v.campus,
                      );
                      // If no preset, can't reliably filter by TIME, but maybe by manual convention?
                      // User mentioned ECO 1 = 06:00, ECO 2 = 13:45
                      // Let's assume strict filtering if we can find the time
                      let startHour = 0;
                      if (preset && preset.timeStart) {
                        startHour = parseInt(
                          preset.timeStart.split(":")[0],
                          10,
                        );
                      } else {
                        // Fallback: Try to guess from sector name or default
                        // If user typed "06h" in a custom field, we might miss it.
                        // But usually, presets drive this.
                        // Let's rely on Team/Shift logic if applicable.
                        // If Team is C/D (usually Night), E (Expediente).
                        // If we can't determine, we show it to be safe.
                        startHour = 6; // Default to morning
                      }

                      if (expedienteShiftFilter === "ECO1" && startHour >= 12)
                        return; // Hide afternoon
                      if (expedienteShiftFilter === "ECO2" && startHour < 12)
                        return; // Hide morning
                    }

                    let groupKey = v.campus || "OUTROS";
                    const c = (v.campus || "").toUpperCase();
                    const s = (v.setor || "").toUpperCase();

                    if (
                      c.includes("DEFINIR") ||
                      c === "SEM POSTO" ||
                      s.includes("DEFINIR") ||
                      s === "AGUARDANDO"
                    ) {
                      groupKey = "A DEFINIR / PENDENTES";
                    }

                    if (!groups[groupKey]) groups[groupKey] = [];
                    groups[groupKey].push(v);
                  });

                  return Object.keys(groups)
                    .sort()
                    .map((campus) => {
                      const isCollapsed = !expandedSectors.has(campus);
                      const groupMembers = groups[campus];

                      if (groupMembers.length === 0) return null;

                      return (
                        <React.Fragment key={campus}>
                          {/* Group Header */}
                          <tr className="bg-slate-900/50 border-b border-slate-700">
                            <td colSpan={5} className="p-0">
                              <button
                                onClick={() => toggleSectorExpansion(campus)}
                                className="w-full flex items-center justify-between px-4 py-2 text-left hover:bg-slate-800 transition-colors"
                              >
                                <div className="flex items-center gap-2 font-black text-slate-300 uppercase tracking-widest text-[10px]">
                                  <span>{isCollapsed ? "➕" : "➖"}</span>
                                  {campus}
                                  <span className="bg-slate-800 px-1.5 py-0.5 rounded text-[9px] text-slate-500 ml-2">
                                    {groupMembers.length}
                                  </span>
                                </div>
                                <div className="text-[9px] font-bold text-slate-600 uppercase">
                                  {isCollapsed ? "Expandir" : "Minimizar"}
                                </div>
                              </button>
                            </td>
                          </tr>

                          {/* Group Rows (Hidden if collapsed) */}
                          {!isCollapsed &&
                            groupMembers.map((vig) => {
                              <tr
                                key={vig.mat}
                                className={`cursor-pointer transition-colors border-b border-slate-800/50 ${editingVig?.mat === vig.mat
                                  ? "bg-blue-900/30 border-l-4 border-l-blue-500"
                                  : "hover:bg-slate-800 even:bg-slate-800/30"
                                  } ${vig.campus === "AFASTADOS" ? "opacity-60 bg-red-900/10" : ""}`}
                                onClick={() => {
                                  setEditingVig(vig);
                                  if (window.innerWidth < 768)
                                    setShowMobileEditor(true);
                                }}
                              >
                                <td className="px-4 py-3 font-bold">
                                  <div className="flex flex-col">
                                    <span>{vig.nome}</span>
                                    <span className="text-[10px] text-slate-500 font-normal">
                                      {vig.mat}
                                    </span>
                                  </div>
                                </td>
                                <td className="px-4 py-3 text-center">
                                  <Badge team={vig.eq} />
                                </td>
                                <td className="px-4 py-3 text-slate-300 text-xs">
                                  {vig.setor}
                                </td>
                                <td className="px-4 py-3 text-slate-400 text-[10px] uppercase">
                                  {vig.campus}
                                </td>
                                <td className="px-4 py-3 text-slate-400 text-xs font-mono text-center">
                                  {vig.horario}
                                </td>
                              </tr>;
                            })}
                        </React.Fragment>
                      );
                    });
                })()}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

LancadorViewComponent.displayName = "LancadorView";

export const LancadorView = React.memo(LancadorViewComponent);
