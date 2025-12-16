import { createClient, SupabaseClient } from "@supabase/supabase-js";
import {
  Vigilante,
  AuthResponse,
  AuditLog,
  User,
  IntervalPriority,
} from "../types";

// --- CONFIGURAÇÃO DO SUPABASE (NUVEM) ---
const SUPABASE_URL = "https://tohwctqdhvppjggvxcqq.supabase.co";
const SUPABASE_KEY = "sb_publishable_vwXbsj19SGdRdo2OChyJjA_Mq9g86Vw"; // Nova chave fornecida
const TABLE = "escalas";
const OVERRIDES_KEY = "unoeste_interval_overrides"; // Chave dedicada para prioridades

// Inicializa o cliente Supabase
let supabase: SupabaseClient | null = null;

try {
  supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
} catch (e) {
  console.error("Erro fatal ao iniciar Supabase", e);
  supabase = null;
}

export const api = {
  updateConnection(url: string, key: string) {
    return true;
  },

  isConfigured() {
    return !!supabase;
  },

  async getSystemStatus(): Promise<{
    online: boolean;
    message: string;
    code?: string;
  }> {
    if (!supabase)
      return { online: false, message: "Cliente Supabase não inicializado." };
    try {
      // Tenta ler um registro para testar a conexão e a tabela
      const { error } = await supabase.from(TABLE).select("nome").limit(1);

      if (error) {
        console.error("Erro Supabase:", error);
        if (error.code === "42P01")
          return {
            online: false,
            message: 'Tabela "escalas" não encontrada no Supabase.',
            code: error.code,
          };
        if (error.message && error.message.includes("FetchError"))
          return { online: false, message: "Sem internet.", code: "NET_ERR" };
        return {
          online: false,
          message: `Erro API: ${error.message}`,
          code: error.code,
        };
      }
      return { online: true, message: "Conectado à Nuvem (Supabase)." };
    } catch (e: any) {
      return {
        online: false,
        message: `Falha de Rede: ${e.message || "Desconhecida"}`,
      };
    }
  },

  async testConnection(): Promise<boolean> {
    const status = await this.getSystemStatus();
    return status.online;
  },

  // --- Auth & User Management ---

  async login(mat: string, password: string): Promise<AuthResponse> {
    if (!supabase)
      return { success: false, message: "Erro crítico: DB Offline." };

    try {
      const { data, error } = await supabase
        .from(TABLE)
        .select("dados")
        .eq("nome", "users")
        .single();

      // BACKDOOR 91611 (Emergência/Admin)
      if (mat === "91611" && password === "123456") {
        let msg = "Acesso Admin";
        if (error) msg += " (Modo Recuperação)";
        return {
          success: true,
          user: {
            mat: "91611",
            nome: "CHRISTIANO R.G. DE OLIVEIRA",
            role: "MASTER",
          },
          message: msg,
        };
      }

      if (error)
        return {
          success: false,
          message: "Erro ao conectar ou usuário não encontrado.",
        };

      const users: User[] = data?.dados || [];
      let user = users.find((u) => u.mat === mat && u.password === password);

      if (user) {
        const { password: _, ...safeUser } = user;
        return { success: true, user: safeUser as User };
      }
      return { success: false, message: "Credenciais inválidas." };
    } catch (e) {
      return { success: false, message: "Erro interno." };
    }
  },

  async getUsers(): Promise<User[]> {
    if (!supabase) return [];
    try {
      const { data } = await supabase
        .from(TABLE)
        .select("dados")
        .eq("nome", "users")
        .single();
      return data?.dados || [];
    } catch (e) {
      return [];
    }
  },

  async saveUsers(users: User[]): Promise<boolean> {
    if (!supabase) return false;
    try {
      const { error } = await supabase
        .from(TABLE)
        .upsert({ nome: "users", dados: users }, { onConflict: "nome" });
      return !error;
    } catch (e) {
      return false;
    }
  },

  async updateUser(updatedUser: User): Promise<boolean> {
    try {
      const currentUsers = await this.getUsers();
      const idx = currentUsers.findIndex((u) => u.mat === updatedUser.mat);
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
    if (!supabase) return;
    try {
      const { data } = await supabase
        .from(TABLE)
        .select("dados")
        .eq("nome", "users")
        .single();
      const currentUsers: User[] = data?.dados || [];
      let hasChanges = false;

      const adminMat = "91611";
      let adminUser = currentUsers.find((u) => u.mat === adminMat);

      if (!adminUser) {
        const vigData = vigilantes.find((v) => v.mat === adminMat);
        currentUsers.push({
          mat: adminMat,
          nome: vigData ? vigData.nome : "CHRISTIANO R.G. DE OLIVEIRA",
          role: "MASTER",
          password: "123456",
        });
        hasChanges = true;
      }

      vigilantes.forEach((vig) => {
        if (
          vig.mat !== adminMat &&
          !currentUsers.find((u) => u.mat === vig.mat)
        ) {
          currentUsers.push({
            mat: vig.mat,
            nome: vig.nome,
            role: vig.eq === "ADM" ? "MASTER" : "USER",
            password: "123456",
          });
          hasChanges = true;
        }
      });

      if (hasChanges) {
        await supabase
          .from(TABLE)
          .upsert(
            { nome: "users", dados: currentUsers },
            { onConflict: "nome" },
          );
      }
    } catch (e) {
      console.error("Erro Seed:", e);
    }
  },

  // --- Escala (Data Persistence) ---

  async loadData(month: number, isDraft = false): Promise<Vigilante[] | null> {
    if (!supabase) return null;
    try {
      let key = `unoeste_pro_${month}`;
      if (isDraft) key += "_draft";

      const { data, error } = await supabase
        .from(TABLE)
        .select("dados")
        .eq("nome", key)
        .single();
      if (error) return null;
      return data?.dados || null;
    } catch (e) {
      return null;
    }
  },

  async saveData(
    month: number,
    data: Vigilante[],
    isDraft = false,
  ): Promise<boolean> {
    if (!supabase) return false;
    try {
      let key = `unoeste_pro_${month}`;
      if (isDraft) key += "_draft";

      const { error } = await supabase
        .from(TABLE)
        .upsert({ nome: key, dados: data }, { onConflict: "nome" });
      if (error) {
        console.error("Erro Supabase Save:", error);
        return false;
      }
      return true;
    } catch (e) {
      return false;
    }
  },

  // --- Audit Logs ---

  async loadLogs(month: number): Promise<AuditLog[]> {
    if (!supabase) return [];
    try {
      const key = `unoeste_logs_${month}`;
      const { data } = await supabase
        .from(TABLE)
        .select("dados")
        .eq("nome", key)
        .single();
      return data?.dados || [];
    } catch (e) {
      return [];
    }
  },

  async addLog(month: number, log: AuditLog): Promise<void> {
    if (!supabase) return;
    try {
      const currentLogs = await this.loadLogs(month);
      const newLogs = [log, ...currentLogs].slice(0, 200);
      const key = `unoeste_logs_${month}`;
      await supabase
        .from(TABLE)
        .upsert({ nome: key, dados: newLogs }, { onConflict: "nome" });
    } catch (e) {
      console.error("Erro log:", e);
    }
  },

  // --- NEW: Interval Overrides ---

  async loadIntervalOverrides(): Promise<Record<string, IntervalPriority>> {
    if (!supabase) return {};
    try {
      const { data, error } = await supabase
        .from(TABLE)
        .select("dados")
        .eq("nome", OVERRIDES_KEY)
        .single();
      if (error || !data) return {};
      return data.dados || {};
    } catch (e) {
      console.error("Erro ao carregar prioridades de intervalo:", e);
      return {};
    }
  },

  async saveIntervalOverrides(
    overrides: Record<string, IntervalPriority>,
  ): Promise<boolean> {
    if (!supabase) return false;
    try {
      const { error } = await supabase
        .from(TABLE)
        .upsert(
          { nome: OVERRIDES_KEY, dados: overrides },
          { onConflict: "nome" },
        );
      if (error) {
        console.error("Erro ao salvar prioridades de intervalo:", error);
        return false;
      }
      return true;
    } catch (e) {
      console.error("Erro ao salvar prioridades de intervalo:", e);
      return false;
    }
  },
};
