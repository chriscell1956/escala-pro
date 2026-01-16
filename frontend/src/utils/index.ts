export type Team = string;
export interface Vacation {
    start: number;
    end: number;
}
export interface Vigilante {
    id: number;
    nome: string;
    mat: string;
    equipe: string;
    eq: string; // Alias for equipe
    setor?: string;
    campus?: string;
    horario?: string;
    refeicao?: string;
    dias?: number[];
    folgasGeradas?: number[];
    faltas?: number[];
    vacation?: Vacation;
    saidasAntecipadas?: number[];
    coberturas?: { dia: number; local: string }[];
    tempOverrides?: Record<number, { horario?: string; refeicao?: string }>;
    manualLock?: boolean;
    posto_id?: number; // Added for Alocacao compatibility
}

// ------------------------------------------------------------------
// DATE HELPERS
// ------------------------------------------------------------------

export const getYear = (period: number) => Math.floor(period / 100);
export const getMonth = (period: number) => period % 100;

export const getDaysInMonth = (period: number) => {
    const y = getYear(period);
    const m = getMonth(period);
    return new Date(y, m, 0).getDate();
};

export const cleanString = (str: any) => {
    if (!str) return "";
    return String(str)
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "") // Remove accents
        .replace(/[\u200B-\u200D\uFEFF\u00A0]/g, "")
        .trim()
        .toUpperCase();
};

export const parseDateString = (dateStr: string): Date | null => {
    if (!dateStr) return null;
    const [y, m, d] = dateStr.split("-").map(Number);
    if (!y || !m || !d) return null;
    return new Date(y, m - 1, d);
};

// ------------------------------------------------------------------
// PERMISSIONS HELPERS
// ------------------------------------------------------------------

export const canEditVigilante = (_user: any, _vigilante: Vigilante) => {
    // if (!user) return false;
    // if (user.role === 'ADMIN' || user.role === 'MASTER') return true;
    return true; // Simplified for now
};

export const isVigilanteVisibleToFiscal = (_vigilante: Vigilante, _user: any) => {
    // if (!user) return true;
    return true; // Simplified for now
};

// ------------------------------------------------------------------
// COLOR HELPERS
// ------------------------------------------------------------------

export function getEquipeColor(eq: string) {
    switch (eq?.toUpperCase()) {
        case 'A': return 'bg-yellow-500';
        case 'B': return 'bg-blue-500';
        case 'C': return 'bg-white text-black border border-slate-200'; // Adjusted for visibility
        case 'D': return 'bg-green-500';
        case 'ECO1': return 'bg-purple-500';
        case 'ECO2': return 'bg-pink-500';
        case 'ADM': return 'bg-slate-500';
        default: return 'bg-slate-400';
    }
}

// ------------------------------------------------------------------
// SCHEDULE LOGIC (12x36 & ECO)
// ------------------------------------------------------------------

// Base: DEZEMBRO 2025 (202512).
export const calculateDaysForTeam = (
    team: Team,
    period: number,
    vacation?: Vacation,
): number[] => {
    const year = getYear(period);
    const month = getMonth(period);
    const daysInMonth = getDaysInMonth(period);
    const days: number[] = [];

    const t = cleanString(team).replace(/\s/g, "");

    // Regras de equipe especiais (ECO1, ECO2, ADM)
    if (t === "ECO1" || t === "E1") {
        for (let d = 1; d <= daysInMonth; d++) {
            if (vacation && d >= vacation.start && d <= vacation.end) continue;
            const dayOfWeek = new Date(year, month - 1, d).getDay();
            if (dayOfWeek !== 0) days.push(d); // Seg a Sab
        }
        return days;
    }

    if (t === "ECO2" || t === "E2" || t === "ADM") {
        for (let d = 1; d <= daysInMonth; d++) {
            if (vacation && d >= vacation.start && d <= vacation.end) continue;
            const dayOfWeek = new Date(year, month - 1, d).getDay();
            if (dayOfWeek >= 1 && dayOfWeek <= 5) days.push(d); // Seg a Sex
        }
        return days;
    }

    // Lógica para 12x36 (A, B, C, D, etc.)
    let workOnEven = false; // Se true, trabalha dia 2, 4... Se false, dia 1, 3...
    const isTeamAD = t === "A" || t === "D";
    const isTeamBC = t === "B" || t === "C";

    if (period < 202512) {
        // Fallback simples para pré-Dez 25 (Novembro 25)
        if (isTeamAD) workOnEven = true;
        else if (isTeamBC) workOnEven = false;
    } else {
        // Lógica Dinâmica Pós-Dez 25
        let currentPeriod = 202512;
        let isADEven = true; // Em Dez 25, A/D é PAR

        while (currentPeriod < period) {
            const d = getDaysInMonth(currentPeriod);
            // Se o mês tem 31 dias, a paridade INVERTE no próximo mês
            if (d === 31) {
                isADEven = !isADEven;
            }

            // Incrementa periodo
            let cM = getMonth(currentPeriod);
            let cY = getYear(currentPeriod);
            cM++;
            if (cM > 12) {
                cM = 1;
                cY++;
            }
            currentPeriod = cY * 100 + cM;
        }

        if (isTeamAD) workOnEven = isADEven;
        else if (isTeamBC) workOnEven = !isADEven;
    }

    for (let d = 1; d <= daysInMonth; d++) {
        if (vacation && d >= vacation.start && d <= vacation.end) continue;

        const isDayEven = d % 2 === 0;
        if (isDayEven === workOnEven) {
            days.push(d);
        }
    }
    return days;
};

// ------------------------------------------------------------------
// TIME HELPERS
// ------------------------------------------------------------------

interface TimeRange {
    start: number;
    end: number;
    crossDay: boolean;
}

export const parseScheduleString = (str: string): TimeRange | null => {
    if (!str || str === "***" || str === "-" || str.length < 5) return null;
    const s = str.toLowerCase();

    if (s.includes("expediente"))
        return { start: 7 * 60, end: 18 * 60, crossDay: false };

    const matches = [...s.matchAll(/(\d{1,2})h(\d{0,2})/g)];
    if (matches.length < 2) return null;

    const h1 = parseInt(matches[0][1]);
    const m1 = matches[0][2] ? parseInt(matches[0][2]) : 0;

    let h2 = parseInt(matches[1][1]);
    const m2 = matches[1][2] ? parseInt(matches[1][2]) : 0;

    const start = h1 * 60 + m1;
    let end = h2 * 60 + m2;

    if (h2 === 24) end = 24 * 60;

    return {
        start,
        end,
        crossDay: start > end,
    };
};

export const extractTimeInputs = (str: string) => {
    if (
        !str ||
        str.toLowerCase().includes("expediente") ||
        str === "***" ||
        str === "-"
    ) {
        return { start: "", end: "" };
    }
    const matches = [...str.toLowerCase().matchAll(/(\d{1,2})h(\d{0,2})/g)];
    if (matches.length < 2) return { start: "", end: "" };

    const fmt = (h: string, m: string) => {
        return `${h.padStart(2, "0")}:${(m || "0").padStart(2, "0")}`;
    };

    const start = fmt(matches[0][1], matches[0][2]);
    let h2 = matches[1][1];
    if (h2 === "24") h2 = "00";
    const end = fmt(h2, matches[1][2]);

    return { start, end };
};
