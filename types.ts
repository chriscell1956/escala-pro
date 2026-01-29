export type Team = "A" | "B" | "C" | "D" | "E1" | "E2" | "ADM" | string;

export interface Vacation {
  start: number;
  end: number;
}

export interface Coverage {
  dia: number;
  local: string;
  tipo: string; // REMANEJAMENTO, EXTRA, INTERVALO
  origem: string;
}

export interface Request {
  day: number;
  option: "A" | "B"; // A = Principal, B = Secundária
  timestamp: number; // Para saber quem pediu primeiro
  status: "PENDING" | "APPROVED" | "REJECTED";
}

export interface Vigilante {
  nome: string;
  mat: string;
  eq: Team;
  setor: string;
  campus: string;
  horario: string;
  refeicao: string;
  vacation?: Vacation;

  // App State properties
  dias: number[]; // Array of days working in the current month
  faltas?: number[];
  saidasAntecipadas?: number[];
  status?: "PENDENTE" | "AUTO_OK" | "MANUAL_OK" | string;
  manualLock: boolean;
  folgasGeradas: number[];
  coberturas: Coverage[];

  // Temporary overrides keyed by day number
  tempOverrides?: Record<number, { horario?: string; refeicao?: string }>;

  // Specific for absences
  obs?: string;

  // New Features
  folgasDesejadas?: number[]; // Deprecated (Legacy)
  requests?: Request[]; // New System
  requestsLocked?: boolean; // Se true, o usuário já enviou e está aguardando
  bancoHoras?: string; // Ex: "+12h", "-4h"
}

export interface Conflict {
  dia: number;
  msg: string;
  campus: string;
  equipe: string;
}

export type UserRole = "MASTER" | "FISCAL" | "USER";

export interface User {
  mat: string;
  nome: string;
  perfil: UserRole; // MASTER = Gestor, FISCAL = Operacional, USER = Visualização
  password?: string;
  eq?: string; // Equipe associada (e.g. para Fiscais)
  // Granular Permissions
  canManageIntervals?: boolean;
  canPrint?: boolean;
  canViewLogs?: boolean;
  canSimulate?: boolean; // Permite entrar no modo simulação e publicar
  canViewCFTV?: boolean;
  permissions?: VisibilityPermission[];
}

export interface VisibilityPermission {
  team: string; // "A", "B", "C", "D", "ECO 1", "ECO 2", "ADM"
  canView: boolean;
  canEdit: boolean;
}

export interface AuthResponse {
  success: boolean;
  user?: User;
  token?: string;
  message?: string;
  offline?: boolean;
}

export interface AuditLog {
  id: string;
  timestamp: number;
  user: string; // Nome do supervisor que fez a ação
  action:
  | "EDICAO"
  | "COBERTURA"
  | "IMPORTACAO"
  | "RESET"
  | "SISTEMA"
  | "FOLGAS"
  | "FERIAS"
  | "SOLICITACAO"
  | "ALOCACAO";
  details: string;
  targetName?: string; // Nome do vigilante afetado (opcional)
}

export type ViewMode =
  | "escala"
  | "lancador"
  | "intervalos"
  | "solicitacoes"
  | "cftv"
  | "alocacao"
  | "config";

export type IntervalPriority = "RED" | "ORANGE" | "YELLOW" | "GREEN";

export interface DepartmentPreset {
  id: string;
  db_id?: number; // ID real do banco de dados (para updates)
  name: string; // e.g. "Portaria Principal - Manhã"
  campus: string;
  sector: string;
  code?: string; // DB: codigo_radio
  address?: string; // Legacy: codigo_radio
  team?: string; // DB: equipe
  type?: string; // ShiftType key (e.g., "12x36_DIURNO")
  timeStart: string;
  timeEnd: string;
  mealStart?: string;
  mealEnd?: string;
  mealDuration?: number; // 60 or 75 minutes
  horario?: string;
  refeicao?: string;
}

export interface IntervalConflict {
  time: string; // "12:00"
  sector: string;
  campus: string;
  uncovered: boolean;
  vigilantes: string[]; // List of names
  coveredBy?: string; // Name of coverage
}
