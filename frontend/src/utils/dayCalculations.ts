
import { getDaysInMonth } from 'date-fns';

export function calculateProjectedDays(
    year: number,
    month: number,
    pattern: '12x36' | 'SD' | 'SC',
    equipe: string
): number[] {
    const daysInMonth = getDaysInMonth(new Date(year, month - 1));
    const days: number[] = [];

    if (pattern === 'SD' || pattern === 'SC') {
        // SD/SC = Diário (Todos os dias)
        // Adjust rule if SC excludes weekends later.
        for (let d = 1; d <= daysInMonth; d++) {
            days.push(d);
        }
    } else if (pattern === '12x36') {
        // Regra de Negócio:
        // Equipe A / C = IMPAR (1, 3, 5...)
        // Equipe B / D = PAR (2, 4, 6...)
        // Equipe ECO1 / ECO2 etc? Need clarification.
        // Assuming:
        // A, C, ECO1 = Odd?
        // B, D, ECO2 = Even?

        // Let's implement basic Par/Impar logic based on classic strict A/B.
        // If Equipe is not standard, default to Odd? Or Block?
        // User said: "Sistema calcula... com base em Equipe".

        const isEvenTeam = ['B', 'D', 'ECO2', 'PAR'].includes(equipe.toUpperCase());
        const startDay = isEvenTeam ? 2 : 1;

        for (let d = startDay; d <= daysInMonth; d += 2) {
            days.push(d);
        }
    }

    return days;
}

export function validateCompatibility(setorJornada: any, vigilante: any): string | null {
    // 3.2 Regra de Compatibilidade
    const jornadaNome = setorJornada.jornadas?.nome?.toUpperCase() || '';
    const setorNome = setorJornada.setores?.nome?.toUpperCase() || '';
    const vigEquipe = vigilante.equipe?.toUpperCase() || '';
    const vigRole = vigilante.role?.toUpperCase() || ''; // Assuming role exists or infer from matricula/equipe

    // Se setor for Expediente (SD)
    // NÃO permitir vigilante ECO1 / ECO2?? 
    // Wait, usually Expediente IS for ADM/support. ECO is Operational?
    // User request: "Se o setor for Expediente -> NÃO permitir vigilante ECO1 / ECO2"
    if (jornadaNome.includes('EXPEDIENTE') || jornadaNome === 'SD') {
        if (vigEquipe.startsWith('ECO')) {
            return 'Vigilante de Equipe Operacional (ECO) não pode assumir Expediente.';
        }
    }

    // Se setor for 12x36
    // NÃO permitir vigilante ADM
    if (jornadaNome.includes('12X36')) {
        if (vigEquipe === 'ADM' || vigEquipe === 'ADMIN') {
            return 'Vigilante ADM não pode assumir posto 12x36.';
        }
    }

    return null; // OK
}
