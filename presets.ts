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
  const seenIds = new Set<string>();

  DECEMBER_2025_PRESET.forEach((vig) => {
    // Skip if no sector/campus
    if (!vig.setor || !vig.campus) return;

    // Normalização básica de campus
    let campus = vig.campus;

    // UNIFICATION FIX: Merge "Expediente VIG" and "Expediente C.A." into the main "Expediente" campus for I and II
    if (campus.includes("CAMPUS I") || campus.includes("CAMPUS II")) {
      if (campus.includes("EXPEDIENTE")) {
        // Enforce the Unified Name
        if (campus.includes("CAMPUS I")) campus = "CAMPUS I - EXPEDIENTE";
        else if (campus.includes("CAMPUS II"))
          campus = "CAMPUS II - EXPEDIENTE";
      }
    }

    // Generate ID
    const id = `${campus}_${vig.setor.trim()}_${vig.mat}`
      .replace(/[^A-Z0-9]/gi, "_")
      .toUpperCase();

    // Prevent Duplicates?
    // The user wants ALL slots that are in Escala.
    // In Escala, each Vigilante is a line.
    // In Lançador (Alocacao), each Preset is a Slot.
    // If we have 2 people in "Recepção", we need 2 Presets (Slots).
    // Previously we were deduping by ID. Since we didn't include MAT in ID, we only created one slot per unique Sector Name.
    // FIX: Include MAT in ID to ensure 1:1 mapping with the predefined list (Escala).
    // This ensures that if there are 3 people in "Portaria", we get 3 presets.

    if (seenIds.has(id)) return;

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

    // Time parsing
    const time = extractTimeInputs(vig.horario || "");
    const meal = extractTimeInputs(vig.refeicao || "");

    presets.push({
      id,
      name: vig.setor,
      campus: campus, // FIX: Use the normalized campus variable!
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
