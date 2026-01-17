import {
  Vigilante,
  AuthResponse,
  AuditLog,
  User,
  IntervalPriority,
  DepartmentPreset,
} from "../types";

// --- CONFIGURAÇÃO API (LOCAL ADAPTER) ---
const API_URL = "http://localhost:3001/api";

export const api = {
  updateConnection(url: string, key: string) {
    // No-op for local adapter
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
    try {
      const res = await fetch(`${API_URL}/health`);
      if (!res.ok) throw new Error("Offline");
      const data = await res.json();
      return { online: true, message: "Conectado ao Servidor Local" };
    } catch (e: any) {
      return {
        online: false,
        message:
          "Servidor Local Offline. Verifique se 'npm start' está rodando.",
      };
    }
  },

  async testConnection(): Promise<boolean> {
    const status = await this.getSystemStatus();
    return status.online;
  },

  // --- Auth & User Management ---

  async login(mat: string, password: string): Promise<AuthResponse> {
    try {
      const res = await fetch(`${API_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mat, password }),
      });
      const data = await res.json();
      return data;
    } catch (e) {
      return { success: false, message: "Erro de conexão ao fazer login." };
    }
  },

  async getUsers(): Promise<User[]> {
    try {
      const res = await fetch(`${API_URL}/users`);
      if (!res.ok) return [];
      return await res.json();
    } catch (e) {
      return [];
    }
  },

  async saveUsers(users: User[]): Promise<boolean> {
    try {
      const res = await fetch(`${API_URL}/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(users),
      });
      return res.ok;
    } catch (e) {
      return false;
    }
  },

  async updateUser(updatedUser: User): Promise<boolean> {
    try {
      const currentUsers = await this.getUsers();
      const targetMat = String(updatedUser.mat).trim();
      const idx = currentUsers.findIndex(
        (u) => String(u.mat).trim() === targetMat,
      );

      if (idx > -1) {
        currentUsers[idx] = updatedUser;
        return await this.saveUsers(currentUsers);
      }
      return false;
    } catch (e) {
      return false;
    }
  },

  async seedUsers(vigilantes: Vigilante[]): Promise<void> {
    try {
      await fetch(`${API_URL}/seed-users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vigilantes }),
      });
    } catch (e) {
      console.error("Seed Error:", e);
    }
  },

  // --- Escala (Data Persistence) ---

  async loadData(month: number, isDraft = false): Promise<Vigilante[] | null> {
    try {
      const url = `${API_URL}/escala/${month}${isDraft ? "?type=draft" : ""}`;
      const res = await fetch(url);
      if (!res.ok) return null;
      const json = await res.json();
      // O Adapter retorna { dados: [...] } ou direto [...]?
      // O server.js antigo (filesystem) retornava [...].
      // O LegacyAdapterController.getEscala retorna { dados: [...] }.
      // Vamos suportar ambos.
      if (json && Array.isArray(json.dados)) return json.dados;
      if (Array.isArray(json)) return json;
      return null;
    } catch (e) {
      return null;
    }
  },

  async saveData(
    month: number,
    data: Vigilante[],
    isDraft = false,
  ): Promise<boolean> {
    try {
      const url = `${API_URL}/escala/${month}${isDraft ? "?type=draft" : ""}`;
      // Importante: Enviar { dados: data } para corresponder ao esperado pelo Adapter
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dados: data }),
      });
      return res.ok;
    } catch (e) {
      console.error("Save Error:", e);
      return false;
    }
  },

  // --- Audit Logs ---

  async loadLogs(month: number): Promise<AuditLog[]> {
    try {
      const res = await fetch(`${API_URL}/logs/${month}`);
      if (!res.ok) return [];
      return await res.json();
    } catch (e) {
      return [];
    }
  },

  async addLog(month: number, log: AuditLog): Promise<void> {
    try {
      await fetch(`${API_URL}/logs/${month}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(log),
      });
    } catch (e) {
      console.error("Log error:", e);
    }
  },

  // --- NEW: Interval Overrides ---

  async loadIntervalOverrides(): Promise<Record<string, IntervalPriority>> {
    try {
      const res = await fetch(`${API_URL}/overrides`);
      if (!res.ok) return {};
      return await res.json();
    } catch (e) {
      return {};
    }
  },

  async saveIntervalOverrides(
    overrides: Record<string, IntervalPriority>,
  ): Promise<boolean> {
    try {
      const res = await fetch(`${API_URL}/overrides`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(overrides),
      });
      return res.ok;
    } catch (e) {
      return false;
    }
  },

  // --- NEW: Presets Management ---

  async loadPresets(): Promise<DepartmentPreset[]> {
    try {
      const res = await fetch(`${API_URL}/presets`);
      if (!res.ok) return [];
      return await res.json();
    } catch (e) {
      return [];
    }
  },

  async savePresets(presets: DepartmentPreset[]): Promise<boolean> {
    try {
      const res = await fetch(`${API_URL}/presets`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(presets),
      });
      return res.ok;
    } catch (e) {
      return false;
    }
  },
};
