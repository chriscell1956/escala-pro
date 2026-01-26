import React, { useState, useEffect } from "react";
import { DepartmentPreset, Team } from "../../types";
import { Button, Input, Select, Card, Modal, Badge, Icons } from "../ui";
import { api } from "../../services/api";
import { sectorPresets, generateDefaultPresets } from "../../presets";
import { SHIFT_TYPES, ShiftType } from "../../constants";

interface PresetManagerProps {
  isOpen: boolean;
  onClose: () => void;
  presets: DepartmentPreset[];
  setPresets: (presets: DepartmentPreset[]) => void;
  onUpdatePreset?: (id: string, updates: Partial<DepartmentPreset>) => void;
  onDeletePreset?: (id: string) => void;
}

export const PresetManager: React.FC<PresetManagerProps> = ({
  isOpen,
  onClose,
  presets,
  setPresets,
  onUpdatePreset,
  onDeletePreset,
}) => {
  const [editingPreset, setEditingPreset] = useState<DepartmentPreset | null>(
    null,
  );
  const [isFormOpen, setIsFormOpen] = useState(false);

  // Form State
  const [name, setName] = useState("");
  const [code, setCode] = useState(""); // Código Rádio
  const [campus, setCampus] = useState("CAMPUS I");
  const [sector, setSector] = useState("");
  const [shiftType, setShiftType] = useState<ShiftType>("12x36_DIURNO");
  const [team, setTeam] = useState("");
  const [hStart, setHStart] = useState("");
  const [hEnd, setHEnd] = useState("");
  const [rStart, setRStart] = useState("");
  const [rEnd, setREnd] = useState("");

  const resetForm = () => {
    setName("");
    setCode("");
    setCampus("CAMPUS I");
    setSector("");
    setShiftType("12x36_DIURNO");
    setTeam("");
    setHStart("");
    setHEnd("");
    setRStart("");
    setREnd("");
    setEditingPreset(null);
  };

  const handleEdit = (preset: DepartmentPreset) => {
    setEditingPreset(preset);
    setName(preset.name);
    setCode(preset.code || ""); // Load code
    setCampus(preset.campus);
    setSector(preset.sector);
    // Default to DIURNO if type is missing (legacy data)
    setShiftType((preset.type as ShiftType) || "12x36_DIURNO");
    setTeam((preset.team as string) || "");
    setHStart(preset.timeStart);
    setHEnd(preset.timeEnd);
    setRStart(preset.mealStart || "");
    setREnd(preset.mealEnd || "");
    setIsFormOpen(true);
  };

  const handleDuplicate = (preset: DepartmentPreset) => {
    // Pre-fill form with existing data
    setName(preset.name + " (Cópia)");
    setCode(preset.code || ""); // Duplicates code too
    setCampus(preset.campus);
    setSector(preset.sector + " (Cópia)");
    setShiftType((preset.type as ShiftType) || "12x36_DIURNO");
    setTeam((preset.team as string) || "");
    setHStart(preset.timeStart);
    setHEnd(preset.timeEnd);
    setRStart(preset.mealStart || "");
    setREnd(preset.mealEnd || "");

    // Set editingPreset to null so handleSave creates a NEW ID
    setEditingPreset(null);
    setIsFormOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este posto?")) return;

    // Hand off to parent if provided (Centralized Logic)
    if (onDeletePreset) {
      onDeletePreset(id);
      return;
    }

    // Legacy Local Logic
    const newPresets = presets.filter((p) => p.id !== id);
    setPresets(newPresets);
    await api.savePresets(newPresets);
  };

  const parseTime = (str: string): string => {
    if (!str) return "";
    const clean = (s: string) => {
      s = s.trim().toLowerCase().replace("h", ":");
      if (s.endsWith(":")) s += "00"; // "06:" -> "06:00"
      if (!s.includes(":")) s += ":00"; // "06" -> "06:00" (if passed without h)
      return s;
    };
    return clean(str);
  };

  const handleImportSystemPresets = async () => {
    // ... import logic remains same ...
    if (
      !confirm(
        "Isso importará e REESCREVERÁ os padrões do sistema. Deseja continuar?",
      )
    )
      return;
    // (Simulating existing logic for brevity, user didn't ask to change this)
    // Actually, I need to keep the existing logic so I don't break import
    // COPYING EXISTING IMPORT LOGIC FROM PREVIOUS FILE TO ENSURE NO LOSS
    const newPresets: DepartmentPreset[] = [];
    Object.entries(sectorPresets).forEach(([sectorName, shifts]) => {
      const processShift = (shiftData: any, type: string) => {
        // Type 'any' used to match existing
        const rawParts = shiftData.horario.split(" às ");
        const mealParts = shiftData.refeicao
          ? shiftData.refeicao.split(" às ")
          : ["", ""];
        let mappedType: ShiftType = "12x36_DIURNO";
        if (type === "Noturno") mappedType = "12x36_NOTURNO";
        return {
          id: crypto.randomUUID(),
          name: `${sectorName} - ${type}`,
          campus: shiftData.campus,
          sector: sectorName,
          type: mappedType,
          team: undefined,
          timeStart: parseTime(rawParts[0]),
          timeEnd: parseTime(rawParts[1]),
          mealStart: parseTime(mealParts[0]),
          mealEnd: parseTime(mealParts[1]),
        };
      };
      if (shifts.DIURNO) newPresets.push(processShift(shifts.DIURNO, "Diurno"));
      if (shifts.NOTURNO)
        newPresets.push(processShift(shifts.NOTURNO, "Noturno"));
    });

    let finalPresets = [...presets];
    const newNames = new Set(newPresets.map((p) => p.name));
    finalPresets = finalPresets.filter((p) => !newNames.has(p.name));
    finalPresets = [...finalPresets, ...newPresets];
    setPresets(finalPresets);
    await api.savePresets(finalPresets);
    alert(`Importados/Corrigidos ${newPresets.length} padrões com sucesso!`);
  };

  const handleSave = async () => {
    if (!name || !sector || !hStart || !hEnd) {
      alert("Preencha os campos obrigatórios: Nome, Setor, Início e Fim.");
      return;
    }

    // UPDATE LOGIC: Use onUpdatePreset if editing
    if (editingPreset && onUpdatePreset) {
      const updates: Partial<DepartmentPreset> = {
        name,
        code, // SAVE CODE
        campus,
        sector,
        type: shiftType,
        team: team || undefined, // Save team if selected
        timeStart: hStart,
        timeEnd: hEnd,
        mealStart: rStart,
        mealEnd: rEnd,
        // Composite fields for compatibility
        horario: `${hStart} às ${hEnd}`,
        refeicao: rStart && rEnd ? `${rStart} às ${rEnd}` : "",
      };
      onUpdatePreset(editingPreset.id, updates);
      setIsFormOpen(false);
      resetForm();
      return;
    }

    // CREATE LOGIC (Fallback or New)
    const newPreset: DepartmentPreset = {
      id: editingPreset ? editingPreset.id : crypto.randomUUID(),
      name,
      code, // SAVE CODE
      campus,
      sector,
      type: shiftType,
      team: team || undefined, // Save team if selected
      timeStart: hStart,
      timeEnd: hEnd,
      mealStart: rStart,
      mealEnd: rEnd,
      horario: `${hStart} às ${hEnd}`,
      refeicao: rStart && rEnd ? `${rStart} às ${rEnd}` : "",
    };

    let updatedPresets = [...presets];
    if (editingPreset) {
      updatedPresets = updatedPresets.map((p) =>
        p.id === editingPreset.id ? newPreset : p,
      );
    } else {
      updatedPresets.push(newPreset);
    }

    setPresets(updatedPresets);
    await api.savePresets(updatedPresets);
    setIsFormOpen(false);
    resetForm();
  };

  const [searchTerm, setSearchTerm] = useState("");

  const filteredPresets = presets
    .filter((p) => {
      if (!searchTerm) return true;
      const lower = searchTerm.toLowerCase();
      return (
        (p.name || "").toLowerCase().includes(lower) ||
        (p.sector || "").toLowerCase().includes(lower) ||
        (p.campus || "").toLowerCase().includes(lower) ||
        (p.code || "").toLowerCase().includes(lower)
      );
    })
    .sort((a, b) => {
      // Sort by Campus -> Sector -> Name (Safe check)
      const cA = a.campus || "";
      const cB = b.campus || "";
      if (cA !== cB) return cA.localeCompare(cB);

      const sA = a.sector || "";
      const sB = b.sector || "";
      if (sA !== sB) return sA.localeCompare(sB);

      const nA = a.name || "";
      const nB = b.name || "";
      return nA.localeCompare(nB);
    });

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Gerenciador de Postos">
      <div className="space-y-4 max-h-[70vh] overflow-y-auto p-1">
        {/* Header Actions */}
        <div className="flex flex-col gap-3 bg-slate-800 p-3 rounded-lg border border-slate-700">
          <div className="flex justify-between items-center">
            <Button
              variant="primary"
              onClick={() => {
                resetForm();
                setIsFormOpen(true);
              }}
            >
              + Novo Posto
            </Button>
          </div>

          <div className="relative">
            <Icons.Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Buscar por nome, setor, código ou campus..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {/* List */}
        <div className="space-y-2">
          {filteredPresets.length === 0 && (
            <div className="text-center py-8 text-slate-500 bg-slate-800/50 rounded-lg border border-dashed border-slate-700">
              {presets.length === 0
                ? "Nenhum posto cadastrado."
                : "Nenhum posto encontrado para a busca."}
            </div>
          )}

          {filteredPresets.map((preset) => (
            <div
              key={preset.id}
              className="flex items-center justify-between bg-slate-800 p-3 rounded-lg border border-slate-700 hover:border-slate-500 transition-colors"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  {/* DISPLAY CODE IF EXISTS */}
                  {preset.code && (
                    <span className="text-xs bg-slate-700 text-white px-1.5 py-0.5 rounded border border-slate-600 font-mono font-bold tracking-wider">
                      {preset.code}
                    </span>
                  )}
                  <span className="font-bold text-slate-200">
                    {preset.name}
                  </span>
                  {preset.team && (
                    <span className="text-[10px] bg-purple-900/50 text-purple-300 border border-purple-700/50 px-1.5 py-0.5 rounded font-mono font-bold">
                      EQ: {preset.team}
                    </span>
                  )}
                </div>
                {/* ... existing details ... */}
                <div className="text-xs text-slate-400 grid grid-cols-2 gap-x-4 gap-y-1">
                  <span>📍 {preset.campus}</span>
                  <span>📌 {preset.sector}</span>
                  <span>
                    ⏰ {String(preset.timeStart)} - {String(preset.timeEnd)}
                  </span>
                  {preset.mealStart && (
                    <span>
                      🍽️ {String(preset.mealStart)} - {String(preset.mealEnd)}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex gap-2 ml-4">
                <Button
                  variant="secondary"
                  className="h-8 w-8 !p-0"
                  onClick={() => handleDuplicate(preset)}
                  title="Duplicar"
                >
                  📑
                </Button>
                <Button
                  variant="secondary"
                  className="h-8 w-8 !p-0"
                  onClick={() => handleEdit(preset)}
                  title="Editar"
                >
                  ✏️
                </Button>
                <Button
                  variant="danger"
                  className="h-8 w-8 !p-0"
                  onClick={() => handleDelete(preset.id)}
                  title="Excluir"
                >
                  🗑️
                </Button>
              </div>
            </div>
          ))}
        </div>

        {/* Form Modal (Nested) */}
        {isFormOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <div className="bg-slate-900 border border-slate-700 w-full max-w-lg rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
              <div className="p-4 border-b border-slate-800 bg-slate-950 flex justify-between items-center">
                <h3 className="font-bold text-lg text-slate-100">
                  {editingPreset ? "Editar Posto" : "Novo Posto"}
                </h3>
                <button
                  onClick={() => setIsFormOpen(false)}
                  className="text-slate-400 hover:text-white"
                >
                  ✕
                </button>
              </div>

              <div className="p-6 overflow-y-auto space-y-4">
                {/* 1. CÓDIGO RÁDIO (Main Identifier) */}
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">
                    Cód. Rádio (Principal Identifier)
                  </label>
                  <Input
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    placeholder="Ex: ALFA 01"
                    className="w-full font-mono text-center uppercase text-lg tracking-wider"
                    autoFocus
                  />
                  <p className="text-[10px] text-slate-500 mt-1">
                    Este é o código que aparecerá em destaque na escala (Ex:
                    ALFA 01).
                  </p>
                </div>

                {/* 2. NOME DO SETOR (Description) */}
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">
                    Nome do Setor (Bloco / Local)
                  </label>
                  <Input
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      // Sync "sector" field for backward compatibility
                      if (!editingPreset || sector === name) {
                        setSector(e.target.value);
                      }
                    }}
                    placeholder="Ex: BLOCO A - TÉRREO"
                    className="w-full"
                  />
                </div>

                {/* 3. CAMPUS & TEAM */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 mb-1">
                      Campus
                    </label>
                    <Select
                      value={campus}
                      onChange={(e) => setCampus(e.target.value)}
                      className="w-full"
                    >
                      {[
                        "CAMPUS I",
                        "CAMPUS I - EXPEDIENTE",
                        "CAMPUS II",
                        "CAMPUS II - EXPEDIENTE",
                        "CAMPUS III",
                        "CHÁCARA",
                        "LABORATÓRIO",
                        "AMBULATÓRIO",
                        "SUPERVISÃO E ADMINISTRAÇÃO",
                        "FÉRIAS",
                      ].map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </Select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 mb-1">
                      Definição de Equipe (Tag)
                    </label>
                    <Select
                      value={team || ""}
                      onChange={(e) => setTeam(e.target.value)}
                      className="w-full font-bold text-slate-200"
                    >
                      <option value="">-- Sem Tag (Rotativo) --</option>
                      <option value="A">Equipe A</option>
                      <option value="B">Equipe B</option>
                      <option value="C">Equipe C</option>
                      <option value="D">Equipe D</option>
                      <option value="ECO 1">Equipe ECO 1</option>
                      <option value="ECO 2">Equipe ECO 2</option>
                    </Select>
                    <p className="text-[9px] text-slate-500 mt-1 leading-tight">
                      Define a qual equipe este posto pertence na escala (Ex: Se
                      for ALFA 01 da Equipe A, selecione A).
                    </p>
                  </div>
                </div>

                {/* 4. DETAILS (Shift Type) */}
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">
                    Tipo de Turno / Escala
                  </label>
                  <Select
                    value={shiftType || "12x36_DIURNO"}
                    onChange={(e) => setShiftType(e.target.value as ShiftType)}
                    className="w-full"
                  >
                    <option value="12x36_DIURNO">12x36 Diurno (07h-19h)</option>
                    <option value="12x36_NOTURNO">
                      12x36 Noturno (19h-07h)
                    </option>
                    <option value="ADM">Administrativo (Seg-Sex)</option>
                    <option value="ECO_1">ECO 1 (12x36 - Ímpares/Pares)</option>
                    <option value="ECO_2">ECO 2 (12x36 - Inverso)</option>
                    <option value="EXPEDIENTE">Expediente (08h-17h48)</option>
                  </Select>
                </div>

                {/* 5. TIMES */}
                <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-800">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 mb-1">
                      Horário Início
                    </label>
                    <Input
                      value={hStart}
                      onChange={(e) => {
                        let v = e.target.value.replace(/\D/g, "");
                        if (v.length > 4) v = v.slice(0, 4);
                        if (v.length >= 3) {
                          v = `${v.slice(0, 2)}:${v.slice(2)}`;
                        }
                        setHStart(v);
                      }}
                      placeholder="00:00"
                      maxLength={5}
                      className="w-full text-center tracking-widest"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 mb-1">
                      Horário Fim
                    </label>
                    <Input
                      value={hEnd}
                      onChange={(e) => {
                        let v = e.target.value.replace(/\D/g, "");
                        if (v.length > 4) v = v.slice(0, 4);
                        if (v.length >= 3) {
                          v = `${v.slice(0, 2)}:${v.slice(2)}`;
                        }
                        setHEnd(v);
                      }}
                      placeholder="00:00"
                      maxLength={5}
                      className="w-full text-center tracking-widest"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 mb-1">
                      Refeição Início
                    </label>
                    <Input
                      value={rStart}
                      onChange={(e) => {
                        let v = e.target.value.replace(/\D/g, "");
                        if (v.length > 4) v = v.slice(0, 4);
                        if (v.length >= 3) {
                          v = `${v.slice(0, 2)}:${v.slice(2)}`;
                        }
                        setRStart(v);
                      }}
                      placeholder="00:00"
                      maxLength={5}
                      className="w-full text-center tracking-widest"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 mb-1">
                      Refeição Fim
                    </label>
                    <Input
                      value={rEnd}
                      onChange={(e) => {
                        let v = e.target.value.replace(/\D/g, "");
                        if (v.length > 4) v = v.slice(0, 4);
                        if (v.length >= 3) {
                          v = `${v.slice(0, 2)}:${v.slice(2)}`;
                        }
                        setREnd(v);
                      }}
                      placeholder="00:00"
                      maxLength={5}
                      className="w-full text-center tracking-widest"
                    />
                  </div>
                </div>
              </div>

              <div className="p-4 border-t border-slate-800 bg-slate-950 flex justify-end gap-2">
                <Button variant="ghost" onClick={() => setIsFormOpen(false)}>
                  Cancelar
                </Button>
                <Button variant="primary" onClick={handleSave}>
                  Salvar Posto
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-end pt-4 border-t border-slate-800 mt-4">
        <Button onClick={onClose}>Fechar</Button>
      </div>
    </Modal>
  );
};
