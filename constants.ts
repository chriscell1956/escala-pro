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
  | "ECO_2"
  | "5x2_EXPEDIENTE";

export const SHIFT_TYPES: Record<
  ShiftType,
  { label: string; worksSaturday: boolean }
> = {
  "12x36_DIURNO": { label: "12x36 Diurno", worksSaturday: true },
  "12x36_NOTURNO": { label: "12x36 Noturno", worksSaturday: true },
  EXP_ADM: { label: "Exp. Administrativo (Seg-Sex)", worksSaturday: false },
  ECO_1: { label: "ECO 1 (Manhã/Tarde - Sáb)", worksSaturday: true },
  ECO_2: { label: "ECO 2 (Tarde/Noite - Seg-Sex)", worksSaturday: false },
  "5x2_EXPEDIENTE": { label: "5x2 Expediente (Seg-Sex)", worksSaturday: false },
};

// DADOS DEZEMBRO 2025 JÁ PROCESSADOS (PRESET) - REMOVIDO PARA EVITAR FANTASMAS
// DADOS ZERADOS
export const DECEMBER_2025_PRESET: Omit<Vigilante, "vacation">[] = [];

export const INITIAL_DB: Vigilante[] = [];

export const SECTOR_OPTIONS = [
  "GUARITA PO-01",
  "BLOCO A (Alfa 01)",
  "TESOUR. Alfa 02",
  "FISIOTER. Alfa 10",
  "RONDA 5",
  "CFTV CENTRAL",
  "ALFA 03 CANTINA",
  "ALFA 17",
  "ALFA 03",
  "BLOCO B ALFA 06",
  "BLOCO H ALFA 04",
  "CFTV",
  "PO-02",
  "EST PROF Charlie 1",
  "HOSP VET Charlie 4",
  "RONDA 1",
  "RONDA 2",
  "RONDA 3",
  "Zootecnia Charlie 3",
  "PO-06 TARDE",
  "BLOCO Q Charlie 2",
  "GUARITA PO-02",
  "EST PROF Charlie 01",
  "HOSP VET Charlie 04",
  "Charlie 10",
  "PEDESTRE PO-06",
  "Charlie 11",
  "BLOCO B-1",
  "CHARLIE 14",
  "BLOCO B-2",
  "CHARLIE 12",
  "CHARLIE 09",
  "PORT. PO-03",
  "MOTO RONDA 06",
  "PORT PO-03",
  "RONDA 06",
  "PO-05",
  "LIMA 01",
  "LIMA 02",
  "LIMA 03",
  "LIMA 04",
  "LIMA 02 NOTURNO",
];
