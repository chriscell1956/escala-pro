export function getEquipeColor(eq: string) {
    switch (eq?.toUpperCase()) {
        case 'A': return 'bg-yellow-500';
        case 'B': return 'bg-blue-500';
        case 'C': return 'bg-white';
        case 'D': return 'bg-green-500';
        case 'ECO1': return 'bg-purple-500';
        case 'ECO2': return 'bg-pink-500';
        default: return 'bg-slate-400';
    }
}
