
import {
  Vigilante,
  AuthResponse,
  AuditLog,
  User,
  IntervalPriority,
  DepartmentPreset,
} from "../types";
import { ClientAdapter } from "./ClientAdapter";

// --- CONFIGURAÇÃO API (CLIENT ADAPTER) ---
// Agora a API roda no Frontend via ClientAdapter
// Não há URL de backend.

export const api = {
  updateConnection(url: string, key: string) {
    return true;
  },

  isConfigured() {
    return true;
  },

  async getSystemStatus(): Promise<{
    online: boolean;
    message: string;
    code?: string;
  }> {
    // Supabase JSClient connectivity check could go here
    return { online: true, message: "Modo Client-Side (Supabase Direto)" };
  },

  async testConnection(): Promise<boolean> {
    return true;
  },

  // --- Auth & User Management ---
  // TODO: Migrar Auth para Supabase Auth real ou manter mock local client-side?
  // Por enquanto, Mock Client Side se baseando no Adapter?
  // ClientAdapter não implementou Login. Vamos manter o Mock simples aqui por hora 
  // já que o foco é o Lançador e a Escala.
  // SE PRECISAR: Implementar ClientAdapter.login

  async login(mat: string, password: string): Promise<AuthResponse> {
    // HARDCODED BACKDOOR FOR VERCEL TESTING
    // Em produção real, usaria Supabase Auth.
    if (mat === "91611" && password === "123456") {
      return {
        success: true,
        user: { mat: "91611", nome: "CHRISTIANO OLIVEIRA", role: "MASTER" }
      };
    }
    return { success: false, message: "Login Mock: Use 91611 / 123456" };
  },

  async getUsers(): Promise<User[]> {
    return [];
  },

  async saveUsers(users: User[]): Promise<boolean> {
    return true;
  },

  async updateUser(updatedUser: User): Promise<boolean> {
    return true;
  },

  async seedUsers(vigilantes: Vigilante[]): Promise<void> {
    // No-op
  },

  // --- Escala (Data Persistence) ---

  async loadData(month: number, isDraft = false): Promise<Vigilante[] | null> {
    // Chama o Adapter Client Side Direto
    // Format Month: 202601
    // month param vem como NUMBER (ex: 1, 2) ou YYYYMM?
    // O App.tsx costuma passar 'monthIndex + 1' ou o ano?
    // Verificando chamadas antigas... 
    // App.tsx: api.loadData(selectedMonth) onde selectedMonth é 1..12?
    // O backend esperava YYYYMM?
    // O código anterior do api.ts fazia: `${API_URL}/escala/${month}`.
    // Se month for 1, URL fica /escala/1.
    // O Adapter esperava YYYYMM?
    // LegacyAdapterController.js: "const { month } = req.params; const year = parseInt(month.substring(0, 4));"
    // OPA! Se vier "1", substring falha.
    // O frontend deve estar mandando YYYYMM ou o Adapter anterior quebrava.
    // Se o frontend mandar só mês, precisamos prefixar ano.

    // CORREÇÃO SEGURA: Check length
    let monthStr = String(month);
    if (monthStr.length <= 2) {
      const year = new Date().getFullYear(); // Assume current year
      monthStr = `${year}${monthStr.padStart(2, "0")}`;
    }

    return await ClientAdapter.getEscala(monthStr);
  },

  async saveData(
    month: number,
    data: Vigilante[],
    isDraft = false,
  ): Promise<boolean> {
    let monthStr = String(month);
    if (monthStr.length <= 2) {
      const year = new Date().getFullYear();
      monthStr = `${year}${monthStr.padStart(2, "0")}`;
    }

    return await ClientAdapter.saveEscala(monthStr, data);
  },

  // --- Audit Logs ---

  async loadLogs(month: number): Promise<AuditLog[]> {
    return [];
  },

  async addLog(month: number, log: AuditLog): Promise<void> {
    // No-op
  },

  // --- NEW: Interval Overrides ---

  async loadIntervalOverrides(): Promise<Record<string, IntervalPriority>> {
    return {};
  },

  async saveIntervalOverrides(
    overrides: Record<string, IntervalPriority>,
  ): Promise<boolean> {
    return true;
  },

  // --- NEW: Presets Management ---

  async loadPresets(): Promise<DepartmentPreset[]> {
    return await ClientAdapter.loadPresets();
  },

  async savePresets(presets: DepartmentPreset[]): Promise<boolean> {
    return await ClientAdapter.savePresets(presets);
  },
};
