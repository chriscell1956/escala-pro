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
  const seenIds = new Set<string>();

  DECEMBER_2025_PRESET.forEach((vig) => {
    // ... logic removed to prevent specific legacy pollution ...
  });
  */

  return presets;
};
