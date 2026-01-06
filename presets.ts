import { DepartmentPreset } from "./types";

export interface SectorPreset {
  campus: string;
  horario: string;
  refeicao: string;
}

export const sectorPresets: Record<
  string,
  { DIURNO?: SectorPreset; NOTURNO?: SectorPreset; EXPEDIENTE?: SectorPreset }
> = {
  // CAMPUS I
  "GUARITA PO-01": {
    DIURNO: {
      campus: "CAMPUS I",
      horario: "06h às 18h15",
      refeicao: "10h20 às 11h35",
    },
    NOTURNO: {
      campus: "CAMPUS I",
      horario: "18h às 06h15",
      refeicao: "22h20 às 23h35",
    },
  },

  "BLOCO A (ALFA 01)": {
    DIURNO: {
      campus: "CAMPUS I",
      horario: "06h às 18h15",
      refeicao: "11h45 às 13h",
    },
    NOTURNO: {
      campus: "CAMPUS I",
      horario: "18h às 06h15",
      refeicao: "23h45 às 01h",
    },
  },
  "TESOUR. ALFA 02": {
    DIURNO: {
      campus: "CAMPUS I",
      horario: "06h às 18h15",
      refeicao: "10h20 às 11h35",
    },
    NOTURNO: {
      campus: "CAMPUS I",
      horario: "18h às 06h15",
      refeicao: "22h20 às 23h35",
    },
  },
  "FISIOTER. ALFA 10": {
    DIURNO: {
      campus: "CAMPUS I",
      horario: "06h às 18h15",
      refeicao: "11h45 às 13h",
    },
    NOTURNO: {
      campus: "CAMPUS I",
      horario: "18h às 06h15",
      refeicao: "22h20 às 23h35",
    },
  },
  "RONDA 5": {
    DIURNO: {
      campus: "CAMPUS I",
      horario: "06h às 18h15",
      refeicao: "10h20 às 11h35",
    },
    NOTURNO: {
      campus: "CAMPUS I",
      horario: "18h às 06h15",
      refeicao: "22h20 às 23h35",
    },
  },
  "CFTV CENTRAL": {
    DIURNO: {
      campus: "CAMPUS I",
      horario: "06h às 18h15",
      refeicao: "10h45 às 12h",
    },
    NOTURNO: {
      campus: "CAMPUS I",
      horario: "18h às 06h15",
      refeicao: "23h45 às 01h",
    },
  },
  "ALFA 03 CANTINA": {
    DIURNO: {
      campus: "CAMPUS I",
      horario: "06h às 18h15",
      refeicao: "11h45 às 13h",
    },
    NOTURNO: {
      campus: "CAMPUS I",
      horario: "18h às 06h15",
      refeicao: "23h45 às 01h",
    },
  },
  "ALFA 03": {
    NOTURNO: {
      campus: "CAMPUS I",
      horario: "18h às 06h15",
      refeicao: "23h45 às 01h",
    },
  },
  "ALFA 17": {
    DIURNO: {
      campus: "CAMPUS I",
      horario: "06h às 18h15",
      refeicao: "10h20 às 11h35",
    },
  },
  // CAMPUS II

  "PO-02": {
    DIURNO: {
      campus: "CAMPUS II",
      horario: "06h às 18h15",
      refeicao: "10h20 às 11h35",
    },
    NOTURNO: {
      campus: "CAMPUS II",
      horario: "18h às 06h15",
      refeicao: "22h20 às 23h35",
    },
  },
  "GUARITA PO-02": {
    NOTURNO: {
      campus: "CAMPUS II",
      horario: "18h às 06h15",
      refeicao: "22h20 às 23h35",
    },
  },
  "EST PROF CHARLIE 1": {
    DIURNO: {
      campus: "CAMPUS II",
      horario: "06h às 18h15",
      refeicao: "10h20 às 11h35",
    },
  },
  "EST PROF CHARLIE 01": {
    NOTURNO: {
      campus: "CAMPUS II",
      horario: "18h às 06h15",
      refeicao: "23h45 às 01h",
    },
  },
  "HOSP VET CHARLIE 4": {
    DIURNO: {
      campus: "CAMPUS II",
      horario: "06h às 18h15",
      refeicao: "10h20 às 11h35",
    },
    NOTURNO: {
      campus: "CAMPUS II",
      horario: "18h às 06h15",
      refeicao: "22h20 às 23h35",
    },
  },
  "HOSP VET CHARLIE 04": {
    NOTURNO: {
      campus: "CAMPUS II",
      horario: "18h às 06h15",
      refeicao: "22h20 às 23h35",
    },
  },
  "RONDA 1": {
    DIURNO: {
      campus: "CAMPUS II",
      horario: "06h às 18h15",
      refeicao: "11h45 às 13h",
    },
    NOTURNO: {
      campus: "CAMPUS II",
      horario: "18h às 06h15",
      refeicao: "23h45 às 01h",
    },
  },
  "RONDA 2": {
    DIURNO: {
      campus: "CAMPUS II",
      horario: "06h às 18h15",
      refeicao: "10h20 às 11h35",
    },
    NOTURNO: {
      campus: "CAMPUS II",
      horario: "18h às 06h15",
      refeicao: "22h20 às 23h35",
    },
  },
  "RONDA 3": {
    DIURNO: {
      campus: "CAMPUS II",
      horario: "06h às 18h15",
      refeicao: "11h45 às 13h",
    },
    NOTURNO: {
      campus: "CAMPUS II",
      horario: "18h às 06h15",
      refeicao: "23h45 às 01h",
    },
  },
  "ZOOTECNIA CHARLIE 3": {
    DIURNO: {
      campus: "CAMPUS II",
      horario: "06h às 18h15",
      refeicao: "10h20 às 11h35",
    },
  },
  "PO-06 TARDE": {
    DIURNO: {
      campus: "CAMPUS II",
      horario: "06h às 18h15",
      refeicao: "11h45 às 13h",
    },
  },
  "BLOCO Q CHARLIE 2": {
    DIURNO: {
      campus: "CAMPUS II",
      horario: "06h às 18h15",
      refeicao: "11h45 às 13h",
    },
  },
  // CAMPUS III
  "PORT. PO-03": {
    DIURNO: {
      campus: "CAMPUS III",
      horario: "06h às 18h15",
      refeicao: "10h20 às 11h35",
    },
    NOTURNO: {
      campus: "CAMPUS III",
      horario: "18h às 06h15",
      refeicao: "23h45 às 01h",
    },
  },
  "PORT PO-03": {
    NOTURNO: {
      campus: "CAMPUS III",
      horario: "18h às 06h15",
      refeicao: "23h45 às 01h",
    },
  },
  "MOTO RONDA 06": {
    DIURNO: {
      campus: "CAMPUS III",
      horario: "07h às 19h15",
      refeicao: "12h45 às 14h",
    },
  },
  "RONDA 06": {
    NOTURNO: {
      campus: "CAMPUS III",
      horario: "19h às 07h15",
      refeicao: "00h45 às 02h",
    },
  },
  // CHACARA
  "PO-05": {
    DIURNO: {
      campus: "CHÁCARA DA REITORIA",
      horario: "06h às 18h",
      refeicao: "11h40 às 12h40",
    },
    NOTURNO: {
      campus: "CHÁCARA DA REITORIA",
      horario: "18h às 06h",
      refeicao: "22h às 23h",
    },
  },
  "CHÁCARA DA DONA ANA": {
    DIURNO: {
      campus: "CHÁCARA DA REITORIA",
      horario: "06h às 18h",
      refeicao: "11h40 às 12h40",
    },
    NOTURNO: {
      campus: "CHÁCARA DA REITORIA",
      horario: "18h às 06h",
      refeicao: "22h às 23h",
    },
  },
  // LABORATORIO
  "LIMA 01": {
    DIURNO: {
      campus: "LABORATÓRIO",
      horario: "06h às 18h15",
      refeicao: "11h45 às 13h",
    },
    NOTURNO: {
      refeicao: "22h30 às 23h45",
    },
  },
};

// Helper to generate default presets dynamically
export const generateDefaultPresets = (): DepartmentPreset[] => {
  const presets: DepartmentPreset[] = [];

  // 1. Iterate over Generic Sector Presets (DIURNO/NOTURNO/OLD EXPEDIENTE)
  Object.entries(sectorPresets).forEach(([key, config]) => {
    // DIURNO
    if (config.DIURNO) {
      const horarioStr = config.DIURNO.horario || "06h às 18h";
      const parts = horarioStr.split(" ");
      const start = parts[0]?.replace("h", ":") || "06:00";
      const end = parts[2]?.replace("h", ":") || "18:00";

      presets.push({
        id: `${key}-DIURNO`,
        name: key,
        campus: config.DIURNO.campus,
        sector: key,
        type: "12x36_DIURNO",
        timeStart: start.includes(":") ? start : `${start}:00`,
        timeEnd: end.includes(":") ? end : `${end}:00`,
        horario: horarioStr,
        refeicao: config.DIURNO.refeicao || "",
      });
    }

    // LEGACY EXPEDIENTE (If any left in sectorPresets)
    if (config.EXPEDIENTE) {
      // Safety check: if horario is missing, define default
      const horarioStr = config.EXPEDIENTE.horario || "07h às 17h";
      const parts = horarioStr.split(" ");

      const start = parts[0]?.replace("h", ":") || "07:00";
      const end = parts[2]?.replace("h", ":") || "17:00";

      presets.push({
        id: `${key}-EXPEDIENTE`,
        name: key,
        campus: config.EXPEDIENTE.campus,
        sector: key,
        type: "5x2_EXPEDIENTE",
        timeStart: start.includes(":") ? start : `${start}:00`,
        timeEnd: end.includes(":") ? end : `${end}:00`,
        horario: horarioStr,
        refeicao: config.EXPEDIENTE.refeicao || "",
      });
    }

    // NOTURNO
    if (config.NOTURNO) {
      const horarioStr = config.NOTURNO.horario || "18h às 06h";
      const parts = horarioStr.split(" ");
      const start = parts[0]?.replace("h", ":") || "18:00";
      const end = parts[2]?.replace("h", ":") || "06:00";

      presets.push({
        id: `${key}-NOTURNO`,
        name: key,
        campus: config.NOTURNO.campus,
        sector: key,
        type: "12x36_NOTURNO",
        timeStart: start.includes(":") ? start : `${start}:00`,
        timeEnd: end.includes(":") ? end : `${end}:00`,
        horario: horarioStr,
        refeicao: config.NOTURNO.refeicao || "",
      });
    }
  });

  // 2. SUPERVISÃO E ADMINISTRAÇÃO (Specific Sectors)
  const supervisaoConfig = [
    { name: "SUP. SEGURANÇA", count: 1 },
    { name: "FISCAL ADM", count: 2 },
    { name: "ADMINISTRATIVO", count: 1 },
    { name: "FISCAL OPERACIONAL", count: 5 },
  ];

  supervisaoConfig.forEach((cfg) => {
    for (let i = 0; i < cfg.count; i++) {
      presets.push({
        id: `SUPERVISAO-ADM-${cfg.name.replace(/\s+/g, "-")}-${i + 1}`,
        name: cfg.name,
        campus: "SUPERVISÃO E ADMINISTRAÇÃO",
        sector: cfg.name,
        type: "ADM",
        horario: "Expediente",
        refeicao: "12h - 13h",
      });
    }
  });

  // 3. EXPEDIENTE CAMPUS I - VIG (Specific Sectors)
  const camp1ExpVigConfig = [{ name: "CFTV", count: 1 }];
  camp1ExpVigConfig.forEach((cfg) => {
    for (let i = 0; i < cfg.count; i++) {
      presets.push({
        id: `CAMPUS-I-EXP-VIG-${cfg.name.replace(/\s+/g, "-")}-${i + 1}`,
        name: cfg.name,
        campus: "CAMPUS I - EXPEDIENTE VIG",
        sector: cfg.name,
        type: "EXPEDIENTE",
        horario: "07h às 17h00", // Updated to match user preference if needed, or default
        refeicao: "11h - 12h", // Adjusted typical break
      });
    }
  });

  // 4. EXPEDIENTE CAMPUS I - C.A. (Specific Sectors)
  const camp1ExpCAConfig = [
    { name: "Bloco B / Alfa 06 / Alfa 07", count: 4 },
    { name: "Bloco D / Alfa 11", count: 3 },
    { name: "Bloco G / Alfa 08", count: 2 },
    { name: "Bloco H / Alfa 04", count: 2 },
  ];
  camp1ExpCAConfig.forEach((cfg) => {
    for (let i = 0; i < cfg.count; i++) {
      presets.push({
        id: `CAMPUS-I-EXP-CA-${cfg.name.replace(/\s+/g, "-")}-${i + 1}`,
        name: cfg.name,
        campus: "CAMPUS I - EXPEDIENTE C.A.",
        sector: cfg.name,
        type: "EXPEDIENTE",
        horario: "07h às 17h00",
        refeicao: "12h - 13h",
      });
    }
  });

  // 5. EXPEDIENTE CAMPUS II - VIG (Specific Sectors)
  const camp2ExpVigConfig = [
    { name: "Pedestre PO-06", count: 1 },
    { name: "Portaria de Serviço PO-07", count: 2 },
  ];
  camp2ExpVigConfig.forEach((cfg) => {
    for (let i = 0; i < cfg.count; i++) {
      presets.push({
        id: `CAMPUS-II-EXP-VIG-${cfg.name.replace(/\s+/g, "-")}-${i + 1}`,
        name: cfg.name,
        campus: "CAMPUS II - EXPEDIENTE VIG",
        sector: cfg.name,
        type: "EXPEDIENTE",
        horario: "07h às 17h00",
        refeicao: "12h - 13h",
      });
    }
  });

  // 6. EXPEDIENTE CAMPUS II - C.A. (Specific Sectors)
  const camp2ExpCAConfig = [
    { name: "Bloco B-1 / Charlie 14", count: 2 },
    { name: "Bloco B-2 / Charlie 12", count: 2 },
    { name: "Charlie 09", count: 3 },
    { name: "Charlie 10", count: 3 },
    { name: "Charlie 11", count: 2 },
    { name: "Charlie 15", count: 2 },
  ];
  camp2ExpCAConfig.forEach((cfg) => {
    for (let i = 0; i < cfg.count; i++) {
      presets.push({
        id: `CAMPUS-II-EXP-CA-${cfg.name.replace(/\s+/g, "-")}-${i + 1}`,
        name: cfg.name,
        campus: "CAMPUS II - EXPEDIENTE C.A.",
        sector: cfg.name,
        type: "EXPEDIENTE",
        horario: "07h às 17h00",
        refeicao: "12h - 13h",
      });
    }
  });

  // 7. LABORATÓRIO / AMBULATÓRIO (EXPEDIENTE)
  const labExpConfig = [
    { name: "Lima 02 (Laboratório)", count: 1 },
    { name: "Lima 03 (Ambulatório)", count: 1 },
    { name: "Lima 04 (Ambulatório)", count: 1 },
  ];
  labExpConfig.forEach((cfg) => {
    for (let i = 0; i < cfg.count; i++) {
      presets.push({
        id: `LAB-EXP-${cfg.name.replace(/\s+/g, "-")}-${i + 1}`,
        name: cfg.name,
        campus: "LABORATÓRIO - EXPEDIENTE",
        sector: cfg.name,
        type: "EXPEDIENTE",
        horario: "07h às 17h00",
        refeicao: "12h - 13h",
      });
    }
  });

  return presets;
};
