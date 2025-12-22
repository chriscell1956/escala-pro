export interface SectorPreset {
  campus: string;
  horario: string;
  refeicao: string;
}

export const sectorPresets: Record<
  string,
  { DIURNO?: SectorPreset; NOTURNO?: SectorPreset }
> = {
  // CAMPUS I
  "GUARITA PO-01": {
    DIURNO: {
      campus: "CAMPUS I - DIURNO",
      horario: "06h às 18h15",
      refeicao: "10h20 às 11h35",
    },
    NOTURNO: {
      campus: "CAMPUS I - NOTURNO",
      horario: "18h às 06h15",
      refeicao: "22h20 às 23h35",
    },
  },
  "BLOCO A (ALFA 01)": {
    DIURNO: {
      campus: "CAMPUS I - DIURNO",
      horario: "06h às 18h15",
      refeicao: "11h45 às 13h",
    },
    NOTURNO: {
      campus: "CAMPUS I - NOTURNO",
      horario: "18h às 06h15",
      refeicao: "23h45 às 01h",
    },
  },
  "TESOUR. ALFA 02": {
    DIURNO: {
      campus: "CAMPUS I - DIURNO",
      horario: "06h às 18h15",
      refeicao: "10h20 às 11h35",
    },
    NOTURNO: {
      campus: "CAMPUS I - NOTURNO",
      horario: "18h às 06h15",
      refeicao: "22h20 às 23h35",
    },
  },
  "FISIOTER. ALFA 10": {
    DIURNO: {
      campus: "CAMPUS I - DIURNO",
      horario: "06h às 18h15",
      refeicao: "11h45 às 13h",
    },
    NOTURNO: {
      campus: "CAMPUS I - NOTURNO",
      horario: "18h às 06h15",
      refeicao: "22h20 às 23h35",
    },
  },
  "RONDA 5": {
    DIURNO: {
      campus: "CAMPUS I - DIURNO",
      horario: "06h às 18h15",
      refeicao: "10h20 às 11h35",
    },
    NOTURNO: {
      campus: "CAMPUS I - NOTURNO",
      horario: "18h às 06h15",
      refeicao: "22h20 às 23h35",
    },
  },
  "CFTV CENTRAL": {
    DIURNO: {
      campus: "CAMPUS I - DIURNO",
      horario: "06h às 18h15",
      refeicao: "10h45 às 12h",
    },
    NOTURNO: {
      campus: "CAMPUS I - NOTURNO",
      horario: "18h às 06h15",
      refeicao: "23h45 às 01h",
    },
  },
  "ALFA 03 CANTINA": {
    DIURNO: {
      campus: "CAMPUS I - DIURNO",
      horario: "06h às 18h15",
      refeicao: "11h45 às 13h",
    },
    NOTURNO: {
      campus: "CAMPUS I - NOTURNO",
      horario: "18h às 06h15",
      refeicao: "23h45 às 01h",
    },
  },
  "ALFA 03": {
    NOTURNO: {
      campus: "CAMPUS I - NOTURNO",
      horario: "18h às 06h15",
      refeicao: "23h45 às 01h",
    },
  },
  "ALFA 17": {
    DIURNO: {
      campus: "CAMPUS I - DIURNO",
      horario: "06h às 18h15",
      refeicao: "10h20 às 11h35",
    },
  },
  // CAMPUS II
  "PO-02": {
    DIURNO: {
      campus: "CAMPUS II - DIURNO",
      horario: "06h às 18h15",
      refeicao: "10h20 às 11h35",
    },
    NOTURNO: {
      campus: "CAMPUS II - NOTURNO",
      horario: "18h às 06h15",
      refeicao: "22h20 às 23h35",
    },
  },
  "GUARITA PO-02": {
    NOTURNO: {
      campus: "CAMPUS II - NOTURNO",
      horario: "18h às 06h15",
      refeicao: "22h20 às 23h35",
    },
  },
  "EST PROF CHARLIE 1": {
    DIURNO: {
      campus: "CAMPUS II - DIURNO",
      horario: "06h às 18h15",
      refeicao: "10h20 às 11h35",
    },
  },
  "EST PROF CHARLIE 01": {
    NOTURNO: {
      campus: "CAMPUS II - NOTURNO",
      horario: "18h às 06h15",
      refeicao: "23h45 às 01h",
    },
  },
  "HOSP VET CHARLIE 4": {
    DIURNO: {
      campus: "CAMPUS II - DIURNO",
      horario: "06h às 18h15",
      refeicao: "10h20 às 11h35",
    },
    NOTURNO: {
      campus: "CAMPUS II - NOTURNO",
      horario: "18h às 06h15",
      refeicao: "22h20 às 23h35",
    },
  },
  "HOSP VET CHARLIE 04": {
    NOTURNO: {
      campus: "CAMPUS II - NOTURNO",
      horario: "18h às 06h15",
      refeicao: "22h20 às 23h35",
    },
  },
  "RONDA 1": {
    DIURNO: {
      campus: "CAMPUS II - DIURNO",
      horario: "06h às 18h15",
      refeicao: "11h45 às 13h",
    },
    NOTURNO: {
      campus: "CAMPUS II - NOTURNO",
      horario: "18h às 06h15",
      refeicao: "23h45 às 01h",
    },
  },
  "RONDA 2": {
    DIURNO: {
      campus: "CAMPUS II - DIURNO",
      horario: "06h às 18h15",
      refeicao: "10h20 às 11h35",
    },
    NOTURNO: {
      campus: "CAMPUS II - NOTURNO",
      horario: "18h às 06h15",
      refeicao: "22h20 às 23h35",
    },
  },
  "RONDA 3": {
    DIURNO: {
      campus: "CAMPUS II - DIURNO",
      horario: "06h às 18h15",
      refeicao: "11h45 às 13h",
    },
    NOTURNO: {
      campus: "CAMPUS II - NOTURNO",
      horario: "18h às 06h15",
      refeicao: "23h45 às 01h",
    },
  },
  "ZOOTECNIA CHARLIE 3": {
    DIURNO: {
      campus: "CAMPUS II - DIURNO",
      horario: "06h às 18h15",
      refeicao: "10h20 às 11h35",
    },
  },
  "PO-06 TARDE": {
    DIURNO: {
      campus: "CAMPUS II - DIURNO",
      horario: "06h às 18h15",
      refeicao: "11h45 às 13h",
    },
  },
  "BLOCO Q CHARLIE 2": {
    DIURNO: {
      campus: "CAMPUS II - DIURNO",
      horario: "06h às 18h15",
      refeicao: "11h45 às 13h",
    },
  },
  // CAMPUS III
  "PORT. PO-03": {
    DIURNO: {
      campus: "CAMPUS III - DIURNO",
      horario: "06h às 18h15",
      refeicao: "10h20 às 11h35",
    },
    NOTURNO: {
      campus: "CAMPUS III - NOTURNO",
      horario: "18h às 06h15",
      refeicao: "23h45 às 01h",
    },
  },
  "PORT PO-03": {
    NOTURNO: {
      campus: "CAMPUS III - NOTURNO",
      horario: "18h às 06h15",
      refeicao: "23h45 às 01h",
    },
  },
  "MOTO RONDA 06": {
    DIURNO: {
      campus: "CAMPUS III - DIURNO",
      horario: "07h às 19h15",
      refeicao: "12h45 às 14h",
    },
  },
  "RONDA 06": {
    NOTURNO: {
      campus: "CAMPUS III - NOTURNO",
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
      campus: "CHÁCARA DA DONA ANA",
      horario: "06h às 18h",
      refeicao: "11h40 às 12h40",
    },
    NOTURNO: {
      campus: "CHÁCARA DA DONA ANA",
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
      campus: "LABORATÓRIO",
      horario: "18h às 06h15",
      refeicao: "22h30 às 23h45",
    },
  },
};
