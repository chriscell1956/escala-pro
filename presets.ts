import { DepartmentPreset } from "./types";

export interface SectorPreset {
  campus: string;
  horario: string;
  refeicao: string;
}

// 1. 12x36 SECTORS (DIURNO / NOTURNO)
// These are generated via the loop in generateDefaultPresets
export const sectorPresets: Record<
  string,
  { DIURNO?: SectorPreset; NOTURNO?: SectorPreset; EXPEDIENTE?: SectorPreset }
> = {
  // --- CAMPUS I (12x36) ---
  "Guarita PO-01 / Bloco A / Alfa 01": {
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
  "Tesouraria Alfa / Fisioterapia Alfa 10": {
    DIURNO: {
      campus: "CAMPUS I",
      horario: "06h às 18h15",
      refeicao: "11h45 às 13h00", // "11:45 às 13:00"
    },
    // Note: User separated Tesouraria Alfa 02 and Fisioterapia Alfa 10 for Noturno
  },
  "Tesouraria Alfa 02": {
    NOTURNO: {
      campus: "CAMPUS I",
      horario: "18h às 06h15",
      refeicao: "22h20 às 23h35",
    },
  },
  "Fisioterapia Alfa 10": {
    NOTURNO: {
      campus: "CAMPUS I",
      horario: "18h às 06h15",
      refeicao: "23h45 às 01h00",
    },
  },
  "Ronda 5 / CFTV / Central": {
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

  // --- CAMPUS II (12x36) ---
  "Guarita PO-02": {
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
  "Est. Prof. Charlie 1 / Hosp. Vet. Charlie 4": {
    DIURNO: {
      campus: "CAMPUS II",
      horario: "06h às 18h15",
      refeicao: "10h20 às 11h35",
    },
    NOTURNO: {
      campus: "CAMPUS II",
      horario: "18h às 06h15",
      refeicao: "23h45 às 01h00", // User specified different break for night
    },
  },
  "Rondas 1, 2 e 3": {
    DIURNO: {
      campus: "CAMPUS II",
      horario: "06h às 18h15",
      refeicao: "11h45 às 13h00",
    },
    NOTURNO: {
      campus: "CAMPUS II",
      horario: "18h às 06h15",
      refeicao: "23h45 às 01h00",
    },
  },
  "Zootecnia Charlie 3 / PO-06 Tarde": {
    DIURNO: {
      campus: "CAMPUS II",
      horario: "06h às 18h15",
      refeicao: "10h20 às 11h35",
    },
  },

  // --- CAMPUS III / CHÁCARA / LAB (12x36) ---
  "Portaria PO-03 / PO-04": {
    // User update: PO-04 included
    DIURNO: {
      campus: "CAMPUS III",
      horario: "06h às 18h15",
      refeicao: "10h20 às 11h35",
    },
  },
  "Portaria PO-03 (Noturno) / Igreja": {
    // Specific key for Noturno
    NOTURNO: {
      campus: "CAMPUS III",
      horario: "18h às 06h15",
      refeicao: "23h45 às 01h00",
    },
  },
  "Ronda 06 (CIII)": {
    DIURNO: {
      campus: "CAMPUS III",
      horario: "07h às 19h15",
      refeicao: "12h45 às 14h00",
    },
    NOTURNO: {
      campus: "CAMPUS III",
      horario: "19h às 07h15",
      refeicao: "00h45 às 02h00",
    },
  },
  "Chácara PO-05": {
    DIURNO: {
      campus: "CHÁCARA DA REITORIA",
      horario: "06h às 18h00",
      refeicao: "11h40 às 12h40",
    },
    NOTURNO: {
      campus: "CHÁCARA DA REITORIA",
      horario: "18h às 06h00",
      refeicao: "22h00 às 23h00",
    },
  },
  "Laboratório Lima 01": {
    // Renamed from Lab. Lima 01
    DIURNO: {
      campus: "LABORATÓRIO",
      horario: "06h às 18h15",
      refeicao: "11h45 às 13h00",
    },
    NOTURNO: {
      campus: "LABORATÓRIO",
      horario: "18h às 06h15",
      refeicao: "23h45 às 01h00", // Standard night break assumed as user listed generic lunch for both shifts
    },
  },
};

// Helper to generate default presets dynamically
export const generateDefaultPresets = (): DepartmentPreset[] => {
  const presets: DepartmentPreset[] = [];

  // ==========================================
  // USUÁRIO SOLICITOU ZERAR TODOS OS PRESETS
  // PARA RECRIAÇÃO MANUAL DO ZERO.
  // ==========================================

  /*
  // ==========================================
  // 1. GENERATE 12x36 PRESETS (Based on sectorPresets)
  // ==========================================
  Object.entries(sectorPresets).forEach(([key, config]) => {
    // DIURNO
    if (config.DIURNO) {
      const horarioStr = config.DIURNO.horario;
      const parts = horarioStr.split(" ");
      const start = parts[0]?.replace("h", ":") || "06:00";
      // Handle cases like "18:15" vs "18h"
      let end = parts[2]?.replace("h", ":") || "18:00";
      if (!end.includes(":")) end += ":00";
      if (!start.includes(":")) end += ":00"; // fallback

      // Correct parsing for "18h15" -> "18:15"
      const cleanTime = (t: string) => {
        if (t.includes("h")) return t.replace("h", ":");
        return t;
      }

      presets.push({
        id: `${key}-DIURNO`,
        name: key,
        campus: config.DIURNO.campus,
        sector: key,
        type: "12x36_DIURNO",
        timeStart: cleanTime(parts[0]),
        timeEnd: cleanTime(parts[2]),
        horario: horarioStr,
        refeicao: config.DIURNO.refeicao,
      });
    }

    // NOTURNO
    if (config.NOTURNO) {
      const horarioStr = config.NOTURNO.horario;
      const parts = horarioStr.split(" ");

      const cleanTime = (t: string) => {
        if (t.includes("h")) return t.replace("h", ":");
        return t;
      }

      let refeicao = config.NOTURNO.refeicao || "22h00 às 23h00"; // Default fallback

      presets.push({
        id: `${key}-NOTURNO`,
        name: key,
        campus: config.NOTURNO.campus,
        sector: key,
        type: "12x36_NOTURNO",
        timeStart: cleanTime(parts[0]),
        timeEnd: cleanTime(parts[2]),
        horario: horarioStr,
        refeicao: refeicao,
      });
    }
  });


  // ==========================================
  // 2. GENERATE EXPEDIENTE / SPECIFIC PRESETS
  // ==========================================

  const addPresets = (
    configList: {
      name: string;
      count: number;
      campus: string;
      horario: string;
      refeicao: string;
      type?: "ECO_1" | "ECO_2" | "EXP_ADM" | "12x36_DIURNO" | "12x36_NOTURNO";
    }[]
  ) => {
    configList.forEach((cfg) => {
      // Heuristic parsing for time
      let start = "07:00";
      let end = "17:00";

      // Try to find time pattern in "06h-15h15"
      if (cfg.horario.includes("-")) {
        // Format "06h-15h15"
        const p = cfg.horario.split("-");
        const s = p[0].trim().replace("h", ":00");
        // handle "(Sex...)"
        const e = p[1].split("(")[0].trim().replace("h", ":");
        start = s.includes(":") ? s : s + ":00";
        end = e.includes(":") ? e : e + ":00";
      } else {
        const times = cfg.horario.match(/(\d{2}[:h]\d{2}|\d{2}[:h]?)/g);
        if (times && times.length >= 2) {
          start = times[0].replace("h", ":00");
          end = times[1].replace("h", ":00");
        }
      }

      // INFER TYPE BASED ON SATURDAY
      let inferredType = cfg.type;
      if (!inferredType) {
        const h = cfg.horario.toLowerCase();
        if (h.includes("sáb") || h.includes("sab")) {
          inferredType = "ECO_1";
        } else {
          inferredType = "ECO_2";
        }
      }

      for (let i = 0; i < cfg.count; i++) {
        presets.push({
          id: `${cfg.campus.replace(/\s+/g, "-")}-${cfg.name.replace(
            /\s+/g,
            "-"
          )}-${i + 1}`,
          name: cfg.name,
          campus: cfg.campus,
          sector: cfg.name,
          type: inferredType as any, // Cast to avoid TS issues during transition
          horario: cfg.horario,
          refeicao: cfg.refeicao,
          timeStart: start,
          timeEnd: end,
        });
      }
    });
  };

  // --- CAMPUS I (EXPEDIENTE) ---
  const campus1Exp = [
    {
      name: "Bloco B / Alfa 06 (Vigilância)",
      count: 1,
      campus: "CAMPUS I - EXPEDIENTE VIG", // Using VIG category 
      horario: "06h-15h15 (Sáb 07h-12h)",
      refeicao: "10h20-11h35"
    },
    {
      name: "Bloco B / Alfa 06 (C.A.)",
      count: 1,
      campus: "CAMPUS I - EXPEDIENTE C.A.",
      horario: "06h-16h15",
      refeicao: "10h20-11h35"
    },
    {
      name: "Alfa 07 (C.A.)",
      count: 1,
      campus: "CAMPUS I - EXPEDIENTE C.A.",
      horario: "09h45-20h00",
      refeicao: "13h00-14h15"
    },
    {
      name: "Bloco D / Alfa 11 (Vigilância)",
      count: 1,
      campus: "CAMPUS I - EXPEDIENTE VIG",
      horario: "06h-15h15 (Sáb 08h-13h)",
      refeicao: "11h45-13h00"
    },
    {
      name: "Bloco D / Alfa 11 (C.A.)",
      count: 1,
      campus: "CAMPUS I - EXPEDIENTE C.A.",
      horario: "09h45-20h00",
      refeicao: "13h00-14h15"
    },
    {
      name: "Bloco G / Alfa 08 (E-COMUM)",
      count: 1,
      campus: "CAMPUS I - EXPEDIENTE C.A.",
      horario: "06h-16h15",
      refeicao: "11h00-12h15"
    },
    {
      name: "Bloco H / Alfa 04 (E-COMUM)",
      count: 1,
      campus: "CAMPUS I - EXPEDIENTE C.A.",
      horario: "06h-16h15",
      refeicao: "11h00-12h15"
    },
  ];

  // --- CAMPUS II (EXPEDIENTE) ---
  const campus2Exp = [
    {
      name: "Blocos B1, B2 e Charlie 14, 12",
      count: 4,
      campus: "CAMPUS II - EXPEDIENTE C.A.",
      horario: "06h-16h15",
      refeicao: "11h30-12h45"
    },
    {
      name: "Charlie 14 / Charlie 12 (C.A.)",
      count: 2,
      campus: "CAMPUS II - EXPEDIENTE C.A.",
      horario: "09h45-20h00",
      refeicao: "13h00-14h15"
    },
    {
      name: "Charlie 09, 10, 11 e 15 (E-COMUM)",
      count: 4,
      campus: "CAMPUS II - EXPEDIENTE C.A.",
      horario: "06h-16h15",
      refeicao: "10h20-11h35"
    },
    {
      name: "Charlie 09, 10, 11 e 15 (C.A.)",
      count: 1,
      campus: "CAMPUS II - EXPEDIENTE C.A.",
      horario: "09h45-20h00",
      refeicao: "13h00-14h15"
    },
    {
      name: "Pedestre PO-06",
      count: 1,
      campus: "CAMPUS II - EXPEDIENTE VIG",
      horario: "05h45-15h00 (Sáb 06h-11h)",
      refeicao: "10h20-11h35"
    },
    {
      name: "Portaria Serviço PO-07",
      count: 1,
      campus: "CAMPUS II - EXPEDIENTE VIG",
      horario: "07h-17h15",
      refeicao: "11h35-12h50"
    },
  ];


  // --- LABORATORIO / AMBULATÓRIO (EXPEDIENTE) ---
  const labs = [
    {
      name: "Laboratório Lima 02 (Expediente)",
      count: 1,
      campus: "LABORATÓRIO - EXPEDIENTE",
      horario: "05h45-15h00",
      refeicao: "10h30-11h45"
    },
    {
      name: "Ambulatório Lima 03 (Expediente)",
      count: 1,
      campus: "LABORATÓRIO - EXPEDIENTE",
      horario: "06h-16h15",
      refeicao: "11h00-12h15"
    },
    {
      name: "Ambulatório Lima 04 (Expediente)",
      count: 1,
      campus: "LABORATÓRIO - EXPEDIENTE",
      horario: "08h-18h15",
      refeicao: "12h45-14h00"
    },
  ];

  // addPresets(campus1Exp);
  // addPresets(campus2Exp);
  // addPresets(labs);
  */

  return presets;
};
