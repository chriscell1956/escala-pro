import { ShiftType } from "./constants";

export interface FixedSector {
    id: string; // The "Code" (e.g., PO-01, ALFA-04)
    label: string; // The "Pretty Name" (e.g., Portaria Principal)
    campus: string; // Broad Group
    baseShift: string; // Default shift type
    team: ("A" | "B" | "C" | "D" | "ECO" | "ADM")[]; // Allowed teams
}

export const FIXED_SECTORS: FixedSector[] = [
    // --- ADM ---
    { id: "ADM-SUP", label: "SUP. SEGURANÇA", campus: "SUPERVISÃO E ADMINISTRAÇÃO", baseShift: "EXPEDIENTE", team: ["ADM"] },
    { id: "ADM-FISC", label: "FISCAL ADM", campus: "SUPERVISÃO E ADMINISTRAÇÃO", baseShift: "EXPEDIENTE", team: ["ADM"] },
    { id: "ADM-GHEL", label: "ADMINISTRATIVO", campus: "SUPERVISÃO E ADMINISTRAÇÃO", baseShift: "EXPEDIENTE", team: ["ADM"] },
    { id: "FISC-OP", label: "FISCAL OPERACIONAL", campus: "SUPERVISÃO E ADMINISTRAÇÃO", baseShift: "12x36_DIURNO", team: ["A", "B", "C", "D"] },

    // --- CAMPUS I (12x36) ---
    { id: "PO-01", label: "GUARITA PO-01", campus: "CAMPUS I", baseShift: "12x36_DIURNO", team: ["A", "B", "C", "D"] },
    { id: "ALFA-01", label: "BLOCO A (ALFA 01)", campus: "CAMPUS I", baseShift: "12x36_DIURNO", team: ["A", "B", "C", "D"] },
    { id: "ALFA-02", label: "TESOUR. ALFA 02", campus: "CAMPUS I", baseShift: "12x36_DIURNO", team: ["A", "B", "C", "D"] },
    { id: "ALFA-03", label: "ALFA 03 CANTINA", campus: "CAMPUS I", baseShift: "12x36_DIURNO", team: ["A", "B", "C", "D"] },
    { id: "ALFA-08", label: "ALFA 08", campus: "CAMPUS I", baseShift: "12x36_DIURNO", team: ["A", "B", "C", "D"] },
    { id: "ALFA-10", label: "FISIOTER. ALFA 10", campus: "CAMPUS I", baseShift: "12x36_DIURNO", team: ["A", "B", "C", "D"] },
    { id: "ALFA-17", label: "ALFA 17", campus: "CAMPUS I", baseShift: "12x36_DIURNO", team: ["A", "B", "C", "D"] },
    { id: "RONDA-05", label: "RONDA 5", campus: "CAMPUS I", baseShift: "12x36_DIURNO", team: ["A", "B", "C", "D"] },
    { id: "CFTV-CEN", label: "CFTV CENTRAL", campus: "CAMPUS I", baseShift: "12x36_DIURNO", team: ["A", "B", "C", "D"] },

    // --- CAMPUS I (ECO / EXPEDIENTE) ---
    { id: "ALFA-04", label: "BLOCO H", campus: "CAMPUS I", baseShift: "ECO_1", team: ["ECO"] },
    { id: "ALFA-06", label: "BLOCO B", campus: "CAMPUS I", baseShift: "ECO_1", team: ["ECO"] },
    { id: "ALFA-07", label: "BLOCO B (A07)", campus: "CAMPUS I", baseShift: "ECO_1", team: ["ECO"] },
    { id: "ALFA-11", label: "BLOCO D (A11)", campus: "CAMPUS I", baseShift: "ECO_1", team: ["ECO"] },
    { id: "CFTV-EXP", label: "CFTV EXP.", campus: "CAMPUS I", baseShift: "ECO_1", team: ["ECO"] },

    // --- CAMPUS II (12x36) ---
    { id: "PO-02", label: "GUARITA PO-02", campus: "CAMPUS II", baseShift: "12x36_DIURNO", team: ["A", "B", "C", "D"] },
    { id: "PO-06", label: "PO-06 PEDESTRE", campus: "CAMPUS II", baseShift: "12x36_DIURNO", team: ["A", "B", "C", "D"] },
    { id: "CHAR-01", label: "EST PROF CHARLIE 1", campus: "CAMPUS II", baseShift: "12x36_DIURNO", team: ["A", "B", "C", "D"] },
    { id: "CHAR-02", label: "BLOCO Q CHARLIE 2", campus: "CAMPUS II", baseShift: "12x36_DIURNO", team: ["A", "B", "C", "D"] },
    { id: "CHAR-03", label: "ZOOTECNIA CHARLIE 3", campus: "CAMPUS II", baseShift: "12x36_DIURNO", team: ["A", "B", "C", "D"] },
    { id: "CHAR-04", label: "HOSP VET CHARLIE 4", campus: "CAMPUS II", baseShift: "12x36_DIURNO", team: ["A", "B", "C", "D"] },
    { id: "RONDA-01", label: "RONDA 1", campus: "CAMPUS II", baseShift: "12x36_DIURNO", team: ["A", "B", "C", "D"] },
    { id: "RONDA-02", label: "RONDA 2", campus: "CAMPUS II", baseShift: "12x36_DIURNO", team: ["A", "B", "C", "D"] },
    { id: "RONDA-03", label: "RONDA 3", campus: "CAMPUS II", baseShift: "12x36_DIURNO", team: ["A", "B", "C", "D"] },

    // --- CAMPUS II (ECO / EXPEDIENTE) ---
    { id: "CHAR-09", label: "BLOCO B3 (C09)", campus: "CAMPUS II", baseShift: "ECO_1", team: ["ECO"] },
    { id: "CHAR-10", label: "BLOCO B3 (C10)", campus: "CAMPUS II", baseShift: "ECO_1", team: ["ECO"] },
    { id: "CHAR-11", label: "BLOCO B3 (C11)", campus: "CAMPUS II", baseShift: "ECO_1", team: ["ECO"] },
    { id: "CHAR-12", label: "BLOCO B2 (C12)", campus: "CAMPUS II", baseShift: "ECO_1", team: ["ECO"] },
    { id: "CHAR-13", label: "BLOCO B2 (C13)", campus: "CAMPUS II", baseShift: "ECO_1", team: ["ECO"] },
    { id: "CHAR-14", label: "BLOCO B1 (C14)", campus: "CAMPUS II", baseShift: "ECO_1", team: ["ECO"] },
    { id: "CHAR-15", label: "BLOCO B3 (C15)", campus: "CAMPUS II", baseShift: "ECO_1", team: ["ECO"] },

    // --- CAMPUS III ---
    { id: "PO-03", label: "PORT. PO-03", campus: "CAMPUS III", baseShift: "12x36_DIURNO", team: ["A", "B", "C", "D"] },
    { id: "RONDA-06", label: "RONDA 06", campus: "CAMPUS III", baseShift: "12x36_DIURNO", team: ["A", "B", "C", "D"] },

    // --- OUTROS ---
    { id: "PO-05", label: "PO-05", campus: "CHÁCARA DA REITORIA", baseShift: "12x36_DIURNO", team: ["A", "B", "C", "D"] },
    { id: "LIMA-01", label: "LIMA 01", campus: "LABORATÓRIO", baseShift: "12x36_DIURNO", team: ["A", "B", "C", "D"] },
    { id: "LIMA-02", label: "LIMA 02", campus: "LABORATÓRIO", baseShift: "12x36_DIURNO", team: ["A", "B", "C", "D"] },
    { id: "LIMA-03", label: "LIMA 03", campus: "LABORATÓRIO", baseShift: "EXPEDIENTE", team: ["ECO"] },
    { id: "LIMA-04", label: "LIMA 04", campus: "LABORATÓRIO", baseShift: "EXPEDIENTE", team: ["ECO"] },
];
