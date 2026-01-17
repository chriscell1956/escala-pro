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
// (CLEARED TO AVOID DUPLICATES WITH ESCALA SOURCE)
export const ADMIN_PRESETS: DepartmentPreset[] = [];

import { DECEMBER_2025_PRESET, SHIFT_TYPES, ShiftType } from "./constants";
import { extractTimeInputs } from "./utils";

export const generateDefaultPresets = (): DepartmentPreset[] => {
  const presets: DepartmentPreset[] = [];

  // NOTE: We are disabling the hardcoded DECEMBER_2025_PRESET loading
  // because it contains outdated sector names ("ALFA 03", etc.) that conflict
  // with the user's current database ("PO-01", etc.).
  // By returning an empty list here, we force App.tsx to generate presets
  // DYNAMICALLY based on the actual active Vigilantes (activeData).
  // This cleans up the "garbage" slots in the Master view.

  /*
  // RE-ENABLING STATIC LOADING TO FIX "LANÇADOR ZUADO" (MISSING STRUCTURE)
  // We map the DECEMBER_2025_PRESET to DepartmentPresets to ensure the structure is exactly as defined/expected.
  */

  // Helper set to avoid duplicates
  const seenIds = new Set<string>();

  DECEMBER_2025_PRESET.forEach((vig) => {
    // Logic adapted from App.tsx dynamic generation but applied to static constant
    if (!vig.campus || !vig.setor) return;

    // Normalization Logic
    let campus = vig.campus;
    if (campus.includes("CAMPUS I") || campus.includes("CAMPUS II")) {
      if (campus.includes("EXPEDIENTE")) {
        if (campus.includes("CAMPUS I")) campus = "CAMPUS I - EXPEDIENTE";
        else if (campus.includes("CAMPUS II"))
          campus = "CAMPUS II - EXPEDIENTE";
      }
    }

    // Generate ID
    const id = `${campus}_${vig.setor.trim()}_${vig.mat}`
      .replace(/[^A-Z0-9]/gi, "_")
      .toUpperCase();

    if (!seenIds.has(id)) {
      // Determine Type
      let type = "12x36_DIURNO"; // Default
      const h = vig.horario || "";
      if (h.includes("18h") || h.includes("19h") || h.includes("NOTURNO")) {
        type = "12x36_NOTURNO";
      } else if (campus.includes("EXPEDIENTE")) {
        if (vig.eq === "ECO1" || vig.eq === "E1") type = "ECO_1";
        else if (vig.eq === "ECO2" || vig.eq === "E2") type = "ECO_2";
        else if (h.includes("14h45")) type = "ECO_2";
        else type = "ECO_1";
      }

      // Create Preset
      const newPreset: DepartmentPreset = {
        id,
        name: vig.setor,
        campus: campus,
        sector: vig.setor,
        type,
        horario: vig.horario || "",
        refeicao: vig.refeicao || "",
        timeStart: "06:00",
        timeEnd: "18:00",
        mealStart: "12:00",
        mealEnd: "13:00",
        team: vig.eq || "",
      };

      // Parse times
      if (vig.horario) {
        const times = extractTimeInputs(vig.horario);
        if (times.start) newPreset.timeStart = times.start;
        if (times.end) newPreset.timeEnd = times.end;
      }
      if (vig.refeicao) {
        const meals = extractTimeInputs(vig.refeicao);
        if (meals.start) newPreset.mealStart = meals.start;
        if (meals.end) newPreset.mealEnd = meals.end;
      }

      presets.push(newPreset);
      seenIds.add(id);
    }
  });

  return presets;
};
