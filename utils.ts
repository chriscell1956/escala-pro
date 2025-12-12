import { Team, Vacation, Vigilante, Conflict, IntervalPriority } from './types';
import { PEAK_HOURS } from './constants';

// Helper para extrair ano e mês do formato YYYYMM
export const getYear = (period: number) => Math.floor(period / 100);
export const getMonth = (period: number) => period % 100;

export const getDaysInMonth = (period: number) => {
    const y = getYear(period);
    const m = getMonth(period);
    return new Date(y, m, 0).getDate();
};

export const cleanString = (str: any) => {
    if (!str) return "";
    return String(str).replace(/[\u200B-\u200D\uFEFF\u00A0]/g, "").trim().toUpperCase();
};

// FUNÇÃO CRÍTICA: Calcula dias de trabalho com continuidade 12x36
// Base: DEZEMBRO 2025 (202512).
export const calculateDaysForTeam = (team: Team, period: number, vacation?: Vacation): number[] => {
    const year = getYear(period);
    const month = getMonth(period);
    const daysInMonth = getDaysInMonth(period);
    const days: number[] = [];
    
    // ANCORA: DEZEMBRO 2025
    let workOnEven = false; // Se true, trabalha dia 2, 4... Se false, dia 1, 3...
    const t = cleanString(team);
    const isTeamAD = t === 'A' || t === 'D';
    const isTeamBC = t === 'B' || t === 'C';

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
            if (cM > 12) { cM = 1; cY++; }
            currentPeriod = cY * 100 + cM;
        }

        if (isTeamAD) workOnEven = isADEven;
        else if (isTeamBC) workOnEven = !isADEven;
    }

    for (let d = 1; d <= daysInMonth; d++) {
        if (vacation) {
            if (d >= vacation.start && d <= vacation.end) continue;
        }
        
        const date = new Date(year, month - 1, d);
        const dayOfWeek = date.getDay(); // 0 = Sunday
        let isWork = false;
        
        if (t === 'E1') {
            if (dayOfWeek !== 0) isWork = true; // Seg a Sab
        } else if (t === 'E2' || t === 'ADM') {
            if (dayOfWeek >= 1 && dayOfWeek <= 5) isWork = true; // Seg a Sex
        } else {
            // Lógica 12x36 baseada na paridade calculada
            const isDayEven = (d % 2 === 0);
            if (isDayEven === workOnEven) isWork = true;
        }
        
        if (isWork) days.push(d);
    }
    return days;
};

// --- Time & Status Logic ---

interface TimeRange {
    start: number;
    end: number;
    crossDay: boolean;
}

export const parseTimeInput = (timeStr: string): number | null => {
    if (!timeStr) return null;
    const [h, m] = timeStr.split(':').map(Number);
    if (isNaN(h) || isNaN(m)) return null;
    return h * 60 + m;
};

export const extractTimeInputs = (str: string) => {
    if (!str || str.toLowerCase().includes('expediente') || str === '***' || str === '-') {
        return { start: '', end: '' };
    }
    const matches = [...str.toLowerCase().matchAll(/(\d{1,2})h(\d{0,2})/g)];
    if (matches.length < 2) return { start: '', end: '' };

    const fmt = (h: string, m: string) => {
        return `${h.padStart(2, '0')}:${(m || '0').padStart(2, '0')}`;
    };

    const start = fmt(matches[0][1], matches[0][2]);
    let h2 = matches[1][1];
    if (h2 === '24') h2 = '00';
    const end = fmt(h2, matches[1][2]);

    return { start, end };
};

export const formatTimeInputs = (start: string, end: string) => {
    if (!start || !end) return '';
    const [h1, m1] = start.split(':');
    const [h2, m2] = end.split(':');
    
    const fmt = (h: string, m: string) => {
        const min = parseInt(m);
        return `${parseInt(h)}h${min > 0 ? min.toString().padStart(2,'0') : ''}`;
    };
    return `${fmt(h1, m1)} às ${fmt(h2, m2)}`;
};

export const parseScheduleString = (str: string): TimeRange | null => {
    if(!str || str==='***' || str==='-' || str.length < 5) return null;
    const s = str.toLowerCase();
    
    if(s.includes('expediente')) return {start: 7*60, end: 18*60, crossDay: false};
    
    const matches = [...s.matchAll(/(\d{1,2})h(\d{0,2})/g)];
    if(matches.length < 2) return null;
    
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
        crossDay: start > end
    };
};

export const getVigilanteStatus = (vig: Vigilante, day: number, timeStr: string) => {
    const dias = vig.dias || [];
    const coberturas = vig.coberturas || [];

    const worksToday = dias.includes(day);
    const coversToday = coberturas.find(c => c.dia === day);
    
    if (!worksToday && !coversToday) return { active: false };
    
    if (!timeStr) return { active: true, status: 'NO POSTO', variant: 'success', location: coversToday ? coversToday.local : vig.campus };

    const targetMins = parseTimeInput(timeStr);
    if (targetMins === null) return { active: true, status: 'NO POSTO', variant: 'success', location: coversToday ? coversToday.local : vig.campus };

    const override = vig.tempOverrides?.[day];
    const effectiveSchedule = override?.horario || vig.horario;
    const effectiveRefeicao = override?.refeicao || vig.refeicao;

    const workRange = parseScheduleString(effectiveSchedule);
    if (!workRange) return { active: false }; 

    let isWorkingHour = false;
    if (!workRange.crossDay) {
        isWorkingHour = targetMins >= workRange.start && targetMins <= workRange.end;
    } else {
        isWorkingHour = targetMins >= workRange.start || targetMins <= workRange.end;
    }
    
    if (!isWorkingHour) return { active: false };

    const breakRange = parseScheduleString(effectiveRefeicao);
    if (breakRange) {
        let onBreak = false;
        if (!breakRange.crossDay) {
            onBreak = targetMins >= breakRange.start && targetMins <= breakRange.end;
        } else {
            onBreak = targetMins >= breakRange.start || targetMins <= breakRange.end;
        }
        
        if (onBreak) return { active: true, status: 'INTERVALO', variant: 'warning', location: coversToday ? coversToday.local : vig.campus };
    }

    return { active: true, status: 'NO POSTO', variant: 'success', location: coversToday ? coversToday.local : vig.campus };
};

export interface AvailabilityStatus {
    available: boolean;
    type: 'EXTRA' | 'REMANEJAMENTO' | 'OCUPADO' | 'FERIAS' | 'AFASTADO' | 'ACUMULO';
    label: string;
    color: string;
}

export const checkAvailability = (vig: Vigilante, day: number): AvailabilityStatus => {
    if (vig.campus === 'AFASTADOS') {
        return { available: false, type: 'AFASTADO', label: 'Afastado', color: 'bg-red-200 text-red-800' };
    }

    if (vig.vacation && day >= vig.vacation.start && day <= vig.vacation.end) {
        return { available: false, type: 'FERIAS', label: 'Férias', color: 'bg-yellow-200 text-yellow-800' };
    }

    const coberturas = vig.coberturas || [];
    const existingCoverages = coberturas.filter(c => c.dia === day);
    
    // Se já tem cobertura, permite acumular/trocar, mas alerta
    if (existingCoverages.length > 0) {
        return { 
            available: true, 
            type: 'ACUMULO', 
            label: `Já cobre (${existingCoverages.length})`, 
            color: 'bg-purple-100 text-purple-800 border-purple-300' 
        };
    }

    const dias = vig.dias || [];
    const isWorkingNormal = dias.includes(day);
    
    if (isWorkingNormal) {
        return { 
            available: true, 
            type: 'REMANEJAMENTO', 
            label: 'No Posto', 
            color: 'bg-green-100 text-green-800 border-green-300' 
        };
    }

    // DISPONÍVEL PARA EXTRA
    return { 
        available: true, 
        type: 'EXTRA',
        label: 'Folga', 
        color: 'bg-white text-slate-600 border-slate-200' 
    };
};

export const calculateIntervalRisk = (sector: string, refeicaoStr: string, overrides: Record<string, IntervalPriority> = {}): IntervalPriority => {
    if (overrides[sector]) return overrides[sector];

    if (!refeicaoStr || refeicaoStr.length < 5) return 'GREEN';
    
    const range = parseScheduleString(refeicaoStr);
    if (!range) return 'GREEN';

    const sectorUpper = sector.toUpperCase();
    const isCriticalSector = sectorUpper.includes('PORTARIA') || sectorUpper.includes('CATRACA') || sectorUpper.includes('GUARITA');
    const isClassBlock = sectorUpper.includes('BLOCO') || sectorUpper.includes('SALA') || sectorUpper.includes('ALFA') || sectorUpper.includes('CHARLIE');

    const overlap = (start1: number, end1: number, start2: number, end2: number) => {
        return Math.max(0, Math.min(end1, end2) - Math.max(start1, start2)) > 0;
    };

    const overlapsMorning = overlap(range.start, range.end, PEAK_HOURS.MORNING.start, PEAK_HOURS.MORNING.end);
    const overlapsLunch = overlap(range.start, range.end, PEAK_HOURS.LUNCH.start, PEAK_HOURS.LUNCH.end);
    const overlapsEvening = overlap(range.start, range.end, PEAK_HOURS.EVENING.start, PEAK_HOURS.EVENING.end);

    if (isCriticalSector) {
        if (overlapsMorning || overlapsLunch || overlapsEvening) return 'RED'; 
        return 'ORANGE';
    }

    if (isClassBlock) {
        if (overlapsEvening) return 'ORANGE'; 
        return 'YELLOW';
    }

    return 'YELLOW';
};

export const analyzeConflicts = (data: Vigilante[], period: number, targetTeam: string = 'TODAS'): Conflict[] => {
    const conflicts: Conflict[] = [];
    const daysInMonth = getDaysInMonth(period);
    
    // Group Data
    const map: Record<string, Record<string, Vigilante[]>> = {};
    
    data.forEach(v => {
        if (v.campus === 'AFASTADOS') return;
        if (!map[v.campus]) map[v.campus] = {};
        if (!map[v.campus][v.eq]) map[v.campus][v.eq] = [];
        map[v.campus][v.eq].push(v);
    });

    for (let day = 1; day <= daysInMonth; day++) {
        Object.keys(map).forEach(campus => {
            Object.keys(map[campus]).forEach(eq => {
                if (targetTeam !== 'TODAS' && cleanString(eq) !== cleanString(targetTeam)) return;

                const standardDays = calculateDaysForTeam(eq, period);
                
                if (standardDays.includes(day)) {
                    const teamMembers = map[campus][eq];
                    const totalMembers = teamMembers.length;
                    
                    let workingCount = 0;
                    
                    // Conta quem da equipe está realmente trabalhando (sem folga, sem férias, sem cobertura externa)
                    teamMembers.forEach(v => {
                        const dias = v.dias || [];
                        const coberturas = v.coberturas || [];
                        const isScheduled = dias.includes(day);
                        const isCoveringElsewhere = coberturas.some(c => c.dia === day);
                        const isVacation = v.vacation && day >= v.vacation.start && day <= v.vacation.end;

                        if (isScheduled && !isCoveringElsewhere && !isVacation) {
                            workingCount++;
                        }
                    });

                    // Verifica se alguém de fora está cobrindo aqui
                    data.forEach(v => {
                        const coberturas = v.coberturas || [];
                        if (coberturas.some(c => c.dia === day && c.local === campus)) {
                            workingCount++;
                        }
                    });

                    // LÓGICA ANTIGA RECUPERADA: 
                    // Se o número de trabalhando for menor que a metade do total de membros, é conflito.
                    if (totalMembers > 0 && workingCount < Math.ceil(totalMembers * 0.5)) {
                        conflicts.push({
                            dia: day,
                            campus,
                            equipe: eq,
                            msg: `Efetivo Baixo (${workingCount}/${totalMembers})`
                        });
                    }
                }
            });
        });
    }

    return conflicts;
};

export const checkVacationReturn = (obs: string, period: number): boolean => {
    if (!obs) return false;
    const matches = [...obs.matchAll(/(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?/g)];
    const targetMonth = getMonth(period);
    const targetYear = getYear(period);
    if (matches.length > 0) {
        const lastMatch = matches[matches.length - 1];
        const dayPart = parseInt(lastMatch[1]);
        const monthPart = parseInt(lastMatch[2]);
        let yearPart = lastMatch[3] ? parseInt(lastMatch[3]) : targetYear;
        if (yearPart < 100) yearPart += 2000;
        const endDate = new Date(yearPart, monthPart - 1, dayPart);
        const targetStartDate = new Date(targetYear, targetMonth - 1, 1);
        return endDate < targetStartDate;
    }
    return false;
};