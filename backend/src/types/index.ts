export interface EscalaMensal {
    id: number;
    ano: number;
    mes: number;
    status: 'PROVISORIA' | 'OFICIAL';
    criado_em: string;
}

export interface Setor {
    id: number;
    nome: string;
    codigo_radio: string;
    campus: string;
    critico: boolean;
}

export interface SetorJornada {
    id: number;
    setor_id: number;
    jornada_id: number;
    horario_id: number;
    // Joins
    setores?: Setor;
}

export interface EscalaSetor {
    id: number;
    escala_mensal_id: number;
    setor_jornada_id: number;
}
