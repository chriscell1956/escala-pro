import { Vigilante } from "./types";

export const SUPER_ADMIN_MAT = "91611";

export const PEAK_HOURS = {
    MORNING: { start: 6 * 60, end: 8 * 60 + 30 }, // 06:00 - 08:30 (Entrada)
    LUNCH: { start: 11 * 60, end: 13 * 60 + 30 }, // 11:00 - 13:30 (Almoço/Troca)
    EVENING: { start: 17 * 60 + 30, end: 19 * 60 + 30 }, // 17:30 - 19:30 (Entrada Noturno)
};

// Formato YYYYMM para evitar conflitos de ano
export const BASE_MONTH_OPTIONS = [
    { value: 202601, label: "JANEIRO 2026" },
    { value: 202602, label: "FEVEREIRO 2026" },
    { value: 202603, label: "MARÇO 2026" },
    { value: 202604, label: "ABRIL 2026" },
    { value: 202605, label: "MAIO 2026" },
    { value: 202606, label: "JUNHO 2026" },
    { value: 202607, label: "JULHO 2026" },
    { value: 202608, label: "AGOSTO 2026" },
    { value: 202609, label: "SETEMBRO 2026" },
    { value: 202610, label: "OUTUBRO 2026" },
    { value: 202611, label: "NOVEMBRO 2026" },
    { value: 202612, label: "DEZEMBRO 2026" },
];

export const TEAM_OPTIONS = [
    "A",
    "B",
    "C",
    "D",
    "ECO1",
    "ECO2",
    "ADM",
    "SUPERVISOR",
];

export type ShiftType =
    | "12x36_DIURNO"
    | "12x36_NOTURNO"
    | "EXP_ADM"
    | "ECO_1"
    | "ECO_2";

export const SHIFT_TYPES: Record<
    ShiftType,
    { label: string; worksSaturday: boolean }
> = {
    "12x36_DIURNO": { label: "12x36 Diurno", worksSaturday: true },
    "12x36_NOTURNO": { label: "12x36 Noturno", worksSaturday: true },
    EXP_ADM: { label: "Exp. Administrativo (Seg-Sex)", worksSaturday: false },
    ECO_1: { label: "ECO 1 (Manhã/Tarde - Sáb)", worksSaturday: true },
    ECO_2: { label: "ECO 2 (Tarde/Noite - Seg-Sex)", worksSaturday: false },
};

// Simplified export to avoid huge blob for now, just the essentials
export const DECEMBER_2025_PRESET: Omit<Vigilante, "vacation">[] = []; 
