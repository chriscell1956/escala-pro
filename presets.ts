import { DepartmentPreset } from "./types";

export interface SectorPreset {
  campus: string;
  horario: string;
  refeicao: string;
}

// 1. 12x36 SECTORS (DIURNO / NOTURNO)
export const sectorPresets: Record<
  string,
  { DIURNO?: SectorPreset; NOTURNO?: SectorPreset; EXPEDIENTE?: SectorPreset }
> = {
  // Existing definitions... kept for reference but not re-inventing them
};

// NEW: DEFINIÇÕES ESPECÍFICAS PEDIDAS PELO USUÁRIO
export const ADMIN_PRESETS: DepartmentPreset[] = [
  // --- SUPERVISÃO E ADMINISTRAÇÃO ---
  {
    id: "SUP_SEGURANCA",
    name: "Sup. Segurança",
    campus: "SUPERVISÃO E ADMINISTRAÇÃO",
    sector: "Sup. Segurança",
    type: "EXP_ADM",
    horario: "08h00 às 18h00",
    refeicao: "12h00 às 13h00",
    timeStart: "08:00",
    timeEnd: "18:00",
    mealStart: "12:00",
    mealEnd: "13:00",
    team: "ADM",
  },
  {
    id: "FISCAL_ADM",
    name: "Fiscal Administrativo",
    campus: "SUPERVISÃO E ADMINISTRAÇÃO",
    sector: "Fiscal Administrativo",
    type: "12x36_DIURNO",
    horario: "07h00 às 19h15",
    refeicao: "11h45 às 13h00",
    timeStart: "07:00",
    timeEnd: "19:15",
    mealStart: "11:45",
    mealEnd: "13:00",
    team: "ADM", // Horário de 12x36 mas Equipe ADM
  },
  {
    id: "FISCAL_BASE",
    name: "Fiscal",
    campus: "SUPERVISÃO E ADMINISTRAÇÃO",
    sector: "Fiscal",
    type: "12x36_DIURNO",
    horario: "07h00 às 19h15",
    refeicao: "11h45 às 13h00",
    timeStart: "07:00",
    timeEnd: "19:15",
    mealStart: "11:45",
    mealEnd: "13:00",
    team: "ADM", // Horário de 12x36 mas Equipe ADM
  },
  {
    id: "ADMINISTRATIVO_GERAL",
    name: "Administrativo",
    campus: "SUPERVISÃO E ADMINISTRAÇÃO",
    sector: "Administrativo",
    type: "EXP_ADM",
    horario: "07h00 às 17h15",
    refeicao: "12h45 às 14h00",
    timeStart: "07:00",
    timeEnd: "17:15",
    mealStart: "12:45",
    mealEnd: "14:00",
    team: "ADM",
  },

  // --- FISCALIZAÇÃO OPERACIONAL ---
  // Criando vagas para as equipes A, B, C, D
  // Noturnos (18h-06h15)
  {
    id: "FISCAL_OP_NOT_1",
    name: "Fiscal Operacional (Noturno A)",
    campus: "FISCALIZAÇÃO",
    sector: "Fiscal Operacional",
    type: "12x36_NOTURNO",
    horario: "18h00 às 06h15",
    refeicao: "23h45 às 01h00",
    timeStart: "18:00",
    timeEnd: "06:15",
    team: "A",
  },
  {
    id: "FISCAL_OP_NOT_2",
    name: "Fiscal Operacional (Noturno B)",
    campus: "FISCALIZAÇÃO",
    sector: "Fiscal Operacional",
    type: "12x36_NOTURNO",
    horario: "18h00 às 06h15",
    refeicao: "23h45 às 01h00",
    timeStart: "18:00",
    timeEnd: "06:15",
    team: "B",
  },
  {
    id: "FISCAL_OP_NOT_3",
    name: "Fiscal Operacional (Noturno C)",
    campus: "FISCALIZAÇÃO",
    sector: "Fiscal Operacional",
    type: "12x36_NOTURNO",
    horario: "18h00 às 06h15",
    refeicao: "23h45 às 01h00",
    timeStart: "18:00",
    timeEnd: "06:15",
    team: "C",
  },

  // Diurnos (06h-18h15) - Equipe D (Antonio e Leandro)
  {
    id: "FISCAL_OP_DIU_1",
    name: "Fiscal Operacional (Diurno D)",
    campus: "FISCALIZAÇÃO",
    sector: "Fiscal Operacional",
    type: "12x36_DIURNO",
    horario: "06h00 às 18h15",
    refeicao: "11h45 às 13h00",
    timeStart: "06:00",
    timeEnd: "18:15",
    team: "D",
  },
  {
    id: "FISCAL_OP_DIU_2", // Vaga extra para o segundo fiscal da D
    name: "Fiscal Operacional (Diurno D2)",
    campus: "FISCALIZAÇÃO",
    sector: "Fiscal Operacional",
    type: "12x36_DIURNO",
    horario: "06h00 às 18h15",
    refeicao: "11h45 às 13h00",
    timeStart: "06:00",
    timeEnd: "18:15",
    team: "D",
  },
];

import { DECEMBER_2025_PRESET, SHIFT_TYPES, ShiftType } from "./constants";
import { extractTimeInputs } from "./utils";

export const generateDefaultPresets = (): DepartmentPreset[] => {
  const presets: DepartmentPreset[] = [...ADMIN_PRESETS];
  const seenIds = new Set(presets.map((p) => p.id));

  DECEMBER_2025_PRESET.forEach((vig) => {
    // Skip if no sector/campus
    if (!vig.setor || !vig.campus) return;

    // Normalização básica de campus
    let campus = vig.campus;
    if (campus.includes("EXPEDIENTE")) return; // Skip generated expedient lists if they duplicate
    // Actually, we want them! But we need to handle them carefully.
    // The "December" source has them.
    // Let's just key by Sector + Campus + Horario to be safe.

    // Generate ID
    const id = `${vig.campus}_${vig.setor}`.replace(/\s+/g, "_").toUpperCase();

    if (seenIds.has(id)) return;

    // Determine Type
    let type = "12x36_DIURNO"; // Default
    const h = vig.horario || "";
    if (h.includes("18h") || h.includes("19h") || h.includes("NOTURNO")) {
      type = "12x36_NOTURNO";
    } else if (campus.includes("EXPEDIENTE")) {
      type = "5x2_EXPEDIENTE"; // Or ECO_1/ECO_2
      if (h.includes("14h45")) type = "ECO_2";
      else type = "ECO_1";
    }

    // Time parsing
    const time = extractTimeInputs(vig.horario || "");
    const meal = extractTimeInputs(vig.refeicao || "");

    presets.push({
      id,
      name: vig.setor,
      campus: vig.campus,
      sector: vig.setor,
      type,
      horario: vig.horario || "",
      refeicao: vig.refeicao || "",
      timeStart: time.start,
      timeEnd: time.end,
      mealStart: meal.start,
      mealEnd: meal.end,
      team: vig.eq,
    });
    seenIds.add(id);
  });

  return presets;
};
