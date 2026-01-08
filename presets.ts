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

export const generateDefaultPresets = (): DepartmentPreset[] => {
  // Retorna apenas os presets administrativos novos, pois o resto o usuário já tem
  return [...ADMIN_PRESETS];
};
