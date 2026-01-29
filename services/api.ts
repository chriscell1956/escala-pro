import {
  Vigilante,
  AuthResponse,
  AuditLog,
  User,
  IntervalPriority,
  DepartmentPreset,
} from "../types";

// --- CONFIGURAÇÃO API (LOCAL ADAPTER) ---
// Em produção (Vercel), usa caminhos relativos "/api"
// Em desenvolvimento, usa localhost:3001
const isLocal =
  typeof window !== "undefined" &&
  (window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1");
const API_URL = isLocal ? "http://localhost:3001/api" : "/api";

export const api = {
  updateConnection() {
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
      // const data = await res.json(); // Unused
      return { online: true, message: "Conectado ao Servidor Local" };
    } catch {
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
    } catch {
      return { success: false, message: "Erro de conexão ao fazer login." };
    }
  },

  async getUsers(): Promise<User[]> {
    try {
      const res = await fetch(`${API_URL}/users?t=${Date.now()}`, {
        cache: "no-store",
      });
      if (!res.ok) return [];
      return await res.json();
    } catch {
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
      if (!res.ok) {
        const errorJSON = await res.json().catch(() => ({}));
        if (errorJSON.details) {
          alert(`ERRO SERVIDOR: ${errorJSON.details}`);
        }
        console.error("API: saveUsers failed", res.status, errorJSON);
        return false;
      }
      return true;
    } catch (e) {
      console.error("API saveUsers exception", e);
      alert("Erro de Conexão ao salvar usuários.");
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
        const saved = await this.saveUsers(currentUsers);
        if (!saved) console.error("API: Erro em saveUsers()");
        return saved;
      }
      console.warn(
        `API: updateUser falhou. Usuário ${targetMat} não encontrado na lista atual.`,
      );
      return false;
    } catch (e) {
      console.error("API: updateUser exception:", e);
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

  async updateVigilanteMaster(mat: string, updates: Partial<Vigilante>): Promise<boolean> {
    try {
      const res = await fetch(`${API_URL}/vigilantes/${mat}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      return res.ok;
    } catch (e) {
      console.error("API updateVigilanteMaster error:", e);
      return false;
    }
  },

  async loadData(month: number, isDraft = false): Promise<Vigilante[] | null> {
    try {
      const url = `${API_URL}/escala/${month}${isDraft ? "?type=draft&" : "?"}t=${Date.now()}`;

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout

      const res = await fetch(url, {
        cache: "no-store",
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (!res.ok) {
        console.error(`[API] loadData(${month}) HTTP Error ${res.status}`);
        return null;
      }
      const json = await res.json();
      console.log(`[API] loadData(${month}) response:`, json);
      if (json && Array.isArray(json.dados)) {
        console.log(`[API] Returning json.dados (${json.dados.length} items)`);
        return json.dados;
      }
      if (Array.isArray(json)) {
        console.log(`[API] Returning json array (${json.length} items)`);
        return json;
      }
      console.warn("[API] Unexpected response format:", json);
      return null;
    } catch (e: any) {
      console.error(`[API] loadData(${month}) FATAL ERROR:`, e);
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
    } catch {
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
    } catch {
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
    } catch {
      return false;
    }
  },

  // --- NEW: Presets Management ---

  async loadPresets(): Promise<DepartmentPreset[]> {
    try {
      const res = await fetch(`${API_URL}/presets?t=${Date.now()}`, {
        cache: "no-store",
      });
      if (!res.ok) return [];
      return await res.json();
    } catch {
      return [];
    }
  },

  async savePresets(presets: any[]): Promise<any[]> {
    try {
      const response = await fetch(`${API_URL}/presets`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(presets),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `Erro do servidor (${response.status})`);
      }

      const data = await response.json();
      if (Array.isArray(data)) return data;
      throw new Error("Resposta inválida do servidor.");
    } catch (error: any) {
      console.error("API Save Presets Error:", error);
      throw error;
    }
  },
};
