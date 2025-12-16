import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  Vigilante,
  ViewMode,
  User,
  Conflict,
  AuditLog,
  IntervalPriority,
  UserRole,
  Request,
  Team,
} from "./types";
import {
  INITIAL_DB,
  BASE_MONTH_OPTIONS,
  TEAM_OPTIONS,
  SUPER_ADMIN_MAT,
  DECEMBER_2025_PRESET,
} from "./constants";
import {
  calculateDaysForTeam,
  cleanString,
  getVigilanteStatus,
  analyzeConflicts,
  extractTimeInputs,
  formatTimeInputs,
  checkVacationReturn,
  calculateIntervalRisk,
  checkAvailability,
  getDaysInMonth,
} from "./utils";
import {
  Button,
  Input,
  Badge,
  Card,
  Modal,
  Icons,
  UnoesteSecurityLogo,
  Select,
} from "./components/ui";
import { api } from "./services/api";

// --- IMPORTS DE COMPONENTES REFATORADOS ---
import { ErrorBoundary } from "./components/common/ErrorBoundary";
import { LancadorView } from "./components/views/LancadorView";
import { AppHeader } from "./components/layout/AppHeader";
import { EscalaView } from "./components/views/EscalaView";
// Nota: CalendarGrid agora é usado internamente pelo LancadorView, não precisa importar aqui

// Define extended type for Interval View
type IntervalVigilante = Vigilante & {
  isOnBreak: boolean;
  isCovered: boolean;
  coveredBy?: string;
  risk: IntervalPriority;
  currentStatus: string;
  isOverridden: boolean;
  effectiveCampus: string;
  effectiveSector: string;
  hasTempSchedule: boolean;
  effectiveRefeicao: string;
  effectiveHorario: string;
};

// Lista de ADMs que não devem aparecer para Fiscais
const EXCLUDED_ADM_MATS = ["100497", "60931"];
const CORINGA_MATS = ["76154", "72911"]; // João Galvão e Marcio Pivaro

// Helper para definir visibilidade cruzada de equipes
const getVisibleTeams = (fiscalTeam: string) => {
  const t = cleanString(fiscalTeam);
  if (t === "A") return ["A", "ECO2", "E2"];
  if (t === "B") return ["B", "ECO2", "E2"];
  if (t === "C") return ["C", "ECO1", "E1"];
  if (t === "D") return ["D", "ECO1", "E1"];
  return [t];
};

function AppContent() {
  // --- Auth State ---
  const [user, setUser] = useState<User | null>(null);
  const [loginMat, setLoginMat] = useState("");
  const [loginPass, setLoginPass] = useState("");
  const [showLoginPass, setShowLoginPass] = useState(false);
  const [authError, setAuthError] = useState("");

  // --- System Status State ---
  const [dbStatus, setDbStatus] = useState<{
    online: boolean;
    message: string;
  }>({ online: false, message: "Verificando conexão..." });
  const [isSilentUpdating, setIsSilentUpdating] = useState(false);

  // --- App State ---
  // FIX: Inicia com o mês atual baseado na data do sistema
  const [month, setMonth] = useState<number>(() => {
    const now = new Date();
    return now.getFullYear() * 100 + (now.getMonth() + 1);
  });
  const [monthOptions, setMonthOptions] = useState(() => {
    return BASE_MONTH_OPTIONS.map((opt) => {
      const y = Math.floor(opt.value / 100);
      const m = opt.value % 100;
      const names = [
        "JAN",
        "FEV",
        "MAR",
        "ABR",
        "MAI",
        "JUN",
        "JUL",
        "AGO",
        "SET",
        "OUT",
        "NOV",
        "DEZ",
      ];
      return { ...opt, label: `${names[m - 1]} ${String(y).slice(-2)}` };
    });
  });
  const [view, setView] = useState<ViewMode>("escala");
  const [data, setData] = useState<Vigilante[]>([]);
  const [, setIsLoading] = useState(false);
  const [viewingDraft, setViewingDraft] = useState(false); // Indicates if we are seeing a draft

  // --- SIMULATION MODE STATE ---
  const [isSimulationMode, setIsSimulationMode] = useState(false);
  const [unsavedChanges, setUnsavedChanges] = useState(false);

  // --- CONFLICT & SUGGESTION STATE ---
  const [isConflictModalOpen, setIsConflictModalOpen] = useState(false);
  const [proposedData, setProposedData] = useState<Vigilante[] | null>(null);
  const [suggestionConflicts, setSuggestionConflicts] = useState<Conflict[]>(
    [],
  );

  // Toast Notification State
  const [toast, setToast] = useState<{
    msg: string;
    type: "success" | "error" | "info";
  } | null>(null);

  const showToast = (
    msg: string,
    type: "success" | "error" | "info" = "success",
  ) => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Filters Global
  const [searchTerm, setSearchTerm] = useState("");
  const [filterEq, setFilterEq] = useState<string>("TODAS");

  // Filters Lancador
  const [lancadorSearch, setLancadorSearch] = useState("");
  const [selectedLancadorTeam, setSelectedLancadorTeam] =
    useState<string>("TODAS");
  const [showMobileEditor, setShowMobileEditor] = useState(false);

  // New Vigilante Modal
  const [isNewVigModalOpen, setIsNewVigModalOpen] = useState(false);
  const [newVigForm, setNewVigForm] = useState({ nome: "", mat: "", eq: "A" });

  // Daily View Filters
  const [filterDay, setFilterDay] = useState<string>("");
  const [filterTime, setFilterTime] = useState<string>("");

  // Interval View Category Filter
  const [intervalCategory, setIntervalCategory] = useState<string>("TODOS");

  // Editor State
  const [editingVig, setEditingVig] = useState<Vigilante | null>(null);
  const [timeInputs, setTimeInputs] = useState({
    hStart: "",
    hEnd: "",
    rStart: "",
    rEnd: "",
  });
  const [vacationInputs, setVacationInputs] = useState({ start: "", end: "" });
  const [editorMode, setEditorMode] = useState<
    "days" | "vacation" | "falta" | "partial"
  >("days");

  // Coverage Selection
  const [coverageTarget, setCoverageTarget] = useState<{
    dia: number;
    campus: string;
    equipe: string;
  } | null>(null);
  const [isCoverageModalOpen, setIsCoverageModalOpen] = useState(false);
  const [coverageSearch, setCoverageSearch] = useState("");

  // Import/Export State
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importedData, setImportedData] = useState<Vigilante[] | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Logs State
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [, setLogFilterDate] = useState("");
  const [logFilterSearch, setLogFilterSearch] = useState("");

  // Interval Management State
  const [intervalEditVig, setIntervalEditVig] = useState<Vigilante | null>(
    null,
  );
  const [intervalCoverageModalOpen, setIntervalCoverageModalOpen] =
    useState(false);
  const [intervalCoverageSearch, setIntervalCoverageSearch] = useState(""); // Estado do filtro de busca no modal

  // Temporary Schedule Edit
  const [isTempEditorOpen, setIsTempEditorOpen] = useState(false);
  const [tempEditVig, setTempEditVig] = useState<Vigilante | null>(null);
  const [tempTimeInputs, setTempTimeInputs] = useState({
    hStart: "",
    hEnd: "",
    rStart: "",
    rEnd: "",
  });

  // Priority Overrides
  const [intervalOverrides, setIntervalOverrides] = useState<
    Record<string, IntervalPriority>
  >({});
  const [isPriorityModalOpen, setIsPriorityModalOpen] = useState(false);
  const [targetSectorForPriority, setTargetSectorForPriority] = useState<
    string | null
  >(null);

  // Help Modal
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);

  // --- User Management State ---
  const [isUserMgmtModalOpen, setIsUserMgmtModalOpen] = useState(false);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [userSearch, setUserSearch] = useState("");
  const [formUserMat, setFormUserMat] = useState("");
  const [formUserNome, setFormUserNome] = useState("");
  const [editingUser, setEditingUser] = useState<User | null>(null);
  // New: Permissions State for Form
  const [formPermissions, setFormPermissions] = useState({
    canManageIntervals: false,
    canViewLogs: false,
    canPrint: false,
    canSimulate: false,
    canViewCFTV: false,
  });

  // Password Modal State
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [newPassword, setNewPassword] = useState("");

  // --- DERIVED PERMISSIONS & HELPERS ---
  const isMaster = user?.role === "MASTER";
  const isFiscal = user?.role === "FISCAL" || isMaster || user?.canSimulate; // "isFiscal" here implies "Has Fiscal Capabilities or higher"
  const isUser = user?.role === "USER";

  const canPrint = user?.canPrint ?? (isMaster || isFiscal);
  const canViewLogs = user?.canViewLogs ?? isMaster;
  const canManageIntervals = user?.canManageIntervals ?? isFiscal;
  const canViewCFTV =
    (user as { canViewCFTV?: boolean })?.canViewCFTV || isMaster;
  const canEnterSimulation = isFiscal;

  // Verifica se é mês futuro baseado na data atual
  // (Movido para cima para ser usado no teamsStatus)
  const isFutureMonth = useMemo(() => {
    const now = new Date();
    const currentPeriod = now.getFullYear() * 100 + (now.getMonth() + 1);
    return month > currentPeriod;
  }, [month]);

  const filteredMonthOptions = useMemo(() => {
    if (user?.role !== "USER") return monthOptions;

    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth(); // 0-11

    const visibleMonths = [];
    for (let i = 0; i < 3; i++) {
      const d = new Date(year, month + i, 1);
      const periodValue = d.getFullYear() * 100 + (d.getMonth() + 1);
      visibleMonths.push(periodValue);
    }

    return monthOptions.filter((opt) => visibleMonths.includes(opt.value));
  }, [monthOptions, user]);

  // --- WORKFLOW STATE & PROGRESS (Termômetro de Planejamento) ---
  const teamsStatus = useMemo(() => {
    const status: Record<
      string,
      { ready: boolean; percent: number; label: string }
    > = {};

    // FIX: Remove ADM e SUPERVISOR do termômetro de progresso
    TEAM_OPTIONS.filter((t) => t !== "ADM" && t !== "SUPERVISOR").forEach(
      (team) => {
        // FIX: Normalização para garantir que ECO1/E1 e ECO2/E2 sejam contados juntos
        const targetTeam = cleanString(team);
        const members = data.filter((v) => {
          if (v.campus === "AFASTADOS") return false;
          const vTeam = cleanString(v.eq);
          const vTeamNorm =
            vTeam === "E1" ? "ECO1" : vTeam === "E2" ? "ECO2" : vTeam;
          const targetTeamNorm =
            targetTeam === "E1"
              ? "ECO1"
              : targetTeam === "E2"
                ? "ECO2"
                : targetTeam;
          return vTeamNorm === targetTeamNorm;
        });

        const total = members.length;

        if (total === 0) {
          status[team] = { ready: false, percent: 0, label: "0/0" };
          return;
        }

        // LÓGICA DE CONTAGEM:
        // Conta apenas quem está confirmado (OK / manualLock = true), alinhado com o status "Pendente/OK" do Lançador.
        const filled = members.filter((v) => v.manualLock).length;

        const isReady = members.some(
          (v) => (v as { draftReady?: boolean }).draftReady,
        );

        // LÓGICA DE TRAVA 99%:
        // Calcula a porcentagem real baseada no preenchimento
        let percent = Math.round((filled / total) * 100);

        // Se deu 100% matematicamente, mas o Fiscal NÃO clicou em "Enviar", trava em 99%
        if (percent >= 100 && !isReady) {
          percent = 99;
        }

        // Apenas se estiver explicitamente marcado como pronto (Enviado), vira 100%
        if (isReady) percent = 100;

        status[team] = {
          ready: isReady,
          percent: percent,
          label: `${filled}/${total}`,
        };
      },
    );
    return status;
  }, [data, isFutureMonth]); // Adicionado isFutureMonth nas dependências

  const nextMonth = useMemo(() => {
    let y = Math.floor(month / 100);
    let m = month % 100;
    m++;
    if (m > 12) {
      m = 1;
      y++;
    }
    return y * 100 + m;
  }, [month]);

  const currentLabel = useMemo(
    () =>
      monthOptions.find((o) => o.value === month)?.label || `Período ${month}`,
    [month, monthOptions],
  );

  const currentUserVig = useMemo(() => {
    if (!user) return null;
    const uMat = String(user.mat).trim();
    let v = data.find((x) => String(x.mat).trim() === uMat);
    if (!v) {
      const backup = INITIAL_DB.find((db) => String(db.mat).trim() === uMat);
      if (backup) {
        const days = calculateDaysForTeam(backup.eq, month, backup.vacation);
        v = {
          ...backup,
          dias: days,
          status: "RECUPERADO",
          manualLock: false,
          folgasGeradas: [],
          coberturas: [],
        };
      }
    }
    return v || null;
  }, [data, user, month]);

  // --- Effects ---

  // --- LIVE CLOCK EFFECT ---
  const [isLiveTime, setIsLiveTime] = useState(true);
  useEffect(() => {
    if (isLiveTime) {
      const update = () => {
        const now = new Date();
        setFilterDay(String(now.getDate()));
        const hh = String(now.getHours()).padStart(2, "0");
        const mm = String(now.getMinutes()).padStart(2, "0");
        setFilterTime(`${hh}:${mm}`);
      };
      update();
      const interval = setInterval(update, 1000);
      return () => clearInterval(interval);
    }
  }, [isLiveTime]);

  useEffect(() => {
    const savedUser = localStorage.getItem("uno_user");
    if (savedUser) {
      try {
        const u = JSON.parse(savedUser);
        u.mat = String(u.mat).trim();
        setUser(u);
        if (u.role === "USER") {
          setSearchTerm(u.nome);
        }
      } catch (e) {
        console.error("Erro ao ler usuário salvo", e);
        localStorage.removeItem("uno_user");
      }
    }

    checkSystemStatus();
  }, []);

  // --- AUTO-UPDATE (POLLING) ---
  // Verifica atualizações no banco a cada 10 segundos
  useEffect(() => {
    if (
      !user ||
      isSimulationMode ||
      unsavedChanges ||
      editingVig ||
      isNewVigModalOpen
    )
      return;

    const intervalId = setInterval(() => {
      // Chama o carregamento em modo silencioso (sem spinner)
      loadDataForMonth(month, true);
    }, 10000); // 10 segundos

    return () => clearInterval(intervalId);
  }, [
    user,
    month,
    isSimulationMode,
    unsavedChanges,
    editingVig,
    isNewVigModalOpen,
  ]);

  const checkSystemStatus = async () => {
    setDbStatus({ online: false, message: "Testando conexão..." });
    const status = await api.getSystemStatus();
    setDbStatus(status);
    if (status.online) {
      api.seedUsers(INITIAL_DB);
    }
  };

  useEffect(() => {
    if (user) {
      // Automatically enter simulation mode for FUTURE months if not user
      setIsSimulationMode(false); // Alterado: Sempre inicia em modo de visualização (leitura)
      setUnsavedChanges(false);
      loadDataForMonth(month);
    }
  }, [month, user]);

  useEffect(() => {
    if (editingVig) {
      const h = extractTimeInputs(editingVig.horario);
      const r = extractTimeInputs(editingVig.refeicao);
      setTimeInputs({
        hStart: h.start,
        hEnd: h.end,
        rStart: r.start,
        rEnd: r.end,
      });
      setVacationInputs({
        start: editingVig.vacation ? String(editingVig.vacation.start) : "",
        end: editingVig.vacation ? String(editingVig.vacation.end) : "",
      });
      setShowMobileEditor(true);
      // Default to 'days' unless already in vacation mode
      if (editorMode !== "vacation") setEditorMode("days");
    }
  }, [editingVig]);

  useEffect(() => {
    if (tempEditVig) {
      const dayNum = filterDay ? parseInt(filterDay) : new Date().getDate();
      const override = tempEditVig.tempOverrides?.[dayNum];
      const scheduleToUse = override?.horario || tempEditVig.horario;
      const breakToUse = override?.refeicao || tempEditVig.refeicao;
      const h = extractTimeInputs(scheduleToUse);
      const r = extractTimeInputs(breakToUse);
      setTempTimeInputs({
        hStart: h.start,
        hEnd: h.end,
        rStart: r.start,
        rEnd: r.end,
      });
    }
  }, [tempEditVig, filterDay]);

  useEffect(() => {
    if (isUserMgmtModalOpen && user?.role === "MASTER") {
      loadUsers();
      cancelEditUser();
      setUserSearch("");
    }
  }, [isUserMgmtModalOpen]);

  const loadUsers = async () => {
    const users = await api.getUsers();
    const fixedUsers = users.map((u) =>
      String(u.mat).trim() === "91611"
        ? { ...u, nome: "CHRISTIANO R.G. DE OLIVEIRA" }
        : u,
    );
    setAllUsers(fixedUsers.sort((a, b) => a.nome.localeCompare(b.nome)));
  };

  const loadDataForMonth = async (m: number, isSilent = false) => {
    if (!isSilent) {
      setIsLoading(true);
    } else {
      setIsSilentUpdating(true); // Ativa o indicador
    }
    setViewingDraft(false);

    const now = new Date();
    const currentPeriod = now.getFullYear() * 100 + (now.getMonth() + 1);
    const isFuture = m > currentPeriod;

    // STRATEGY:
    // 1. Try to load OFFICIAL first.
    // 2. If Manager/Fiscal AND Future, Try to load DRAFT.

    let fetchedData = await api.loadData(m, false); // Load Official

    // If user is Fiscal/Master, check if a DRAFT exists for this month
    if (user?.role !== "USER" && isFuture) {
      const draftData = await api.loadData(m, true); // Load Draft
      if (draftData && draftData.length > 0) {
        fetchedData = draftData;
        setViewingDraft(true);
        // setIsSimulationMode(true); // Removido: Carrega o rascunho mas aguarda clique em EDITAR
        showToast("Carregando Rascunho (Não publicado)", "info");
      } else {
        // Future month with no draft? Start fresh or from official
        // setIsSimulationMode(true); // Removido: Aguarda clique em EDITAR
      }
    } else {
      // Regular User
      if (!fetchedData || fetchedData.length === 0) {
        // If official data is empty for future, show nothing/placeholder
        if (isFuture) {
          setData([]);
          if (!isSilent) {
            setIsLoading(false);
          } else {
            setTimeout(() => setIsSilentUpdating(false), 500);
          }
          return;
        }
      }
    }

    const fetchedLogs = await api.loadLogs(m);
    setLogs(fetchedLogs || []);

    // NEW: Load interval overrides from DB
    const fetchedOverrides = await api.loadIntervalOverrides();
    setIntervalOverrides(fetchedOverrides);

    let finalData: Vigilante[] = [];

    if (fetchedData && fetchedData.length > 0) {
      finalData = fetchedData.map((v) => {
        // Sanitização e correções
        const matStr = String(v.mat).trim();
        if (matStr === "61665")
          return { ...v, mat: "61655", dias: v.dias || [] };
        if (matStr === "91611") {
          return {
            ...v,
            nome: "CHRISTIANO R.G. DE OLIVEIRA",
            dias: v.dias || [],
          };
        }
        return { ...v, dias: v.dias || [] }; // Garante que dias é array
      });
    } else {
      // AUTOMATIC PROPAGATION: Try to load PREVIOUS month first
      let prevM = m - 1;
      if (m % 100 === 1) prevM = (Math.floor(m / 100) - 1) * 100 + 12;

      const prevData = await api.loadData(prevM, false); // Load Official Previous

      if (prevData && prevData.length > 0) {
        // If previous month exists, use its roster as base for current month
        finalData = prevData.map((v) => {
          const {
            vacation: _v,
            tempOverrides: _t,
            folgasGeradas: _f,
            coberturas: _c,
            ...base
          } = v;

          // FIX: Remove draftReady para garantir que o novo mês comece como pendente (0%)
          if ("draftReady" in base) delete (base as any).draftReady;

          let newCampus = base.campus;
          let newSetor = base.setor;
          let newObs = "";
          let newStatus = "PENDENTE";

          if (base.campus === "AFASTADOS") {
            const shouldReturn = checkVacationReturn(base.obs || "", m);
            if (shouldReturn) {
              const original = INITIAL_DB.find((db) => db.mat === base.mat);
              if (original && original.campus !== "AFASTADOS") {
                newCampus = original.campus;
                newSetor = original.setor;
              } else {
                newCampus = "OUTROS";
                newSetor = "RETORNO";
              }
            }
          }

          // FIX: Lógica específica para ECO ao virar o mês (Dias Úteis)
          let newDays: number[] = [];
          const teamClean = cleanString(base.eq);

          if (newCampus === "AFASTADOS") {
            newDays = [];
          } else if (["ECO1", "E1", "ECO2", "E2"].includes(teamClean)) {
            const y = Math.floor(m / 100);
            const mon = (m % 100) - 1;
            const dInM = new Date(y, mon + 1, 0).getDate();
            for (let d = 1; d <= dInM; d++) {
              const dw = new Date(y, mon, d).getDay();
              // ECO 1 (6x1) -> Seg a Sab (0=Dom)
              if (teamClean === "ECO1" || teamClean === "E1") {
                if (dw !== 0) newDays.push(d);
              } else {
                // ECO 2 (5x2) -> Seg a Sex
                if (dw >= 1 && dw <= 5) newDays.push(d);
              }
            }
          } else {
            newDays = calculateDaysForTeam(base.eq, m);
          }

          let fixedNome = base.nome;
          if (String(base.mat).trim() === "91611")
            fixedNome = "CHRISTIANO R.G. DE OLIVEIRA";

          return {
            ...base,
            nome: fixedNome,
            campus: newCampus,
            setor: newSetor,
            obs: newObs,
            status: newStatus,
            dias: newDays,
            manualLock: false,
            folgasGeradas: [],
            coberturas: [],
          } as Vigilante;
        });
        if (user?.role !== "USER")
          showToast("Base gerada a partir do mês anterior.", "info");
      } else {
        if (m === 202512) {
          finalData = DECEMBER_2025_PRESET.map(
            (v) => ({ ...v, dias: v.dias || [] }) as Vigilante,
          );
        } else {
          finalData = INITIAL_DB.map((v) => {
            let standardDays: number[] = [];
            const teamClean = cleanString(v.eq);

            if (v.campus === "AFASTADOS") {
              standardDays = [];
            } else if (["ECO1", "E1", "ECO2", "E2"].includes(teamClean)) {
              // Lógica ECO para meses sem histórico (Base Inicial)
              const y = Math.floor(m / 100);
              const mon = (m % 100) - 1;
              const dInM = new Date(y, mon + 1, 0).getDate();
              for (let d = 1; d <= dInM; d++) {
                const dw = new Date(y, mon, d).getDay();
                // ECO 1 (6x1) -> Seg a Sab (0=Dom)
                if (teamClean === "ECO1" || teamClean === "E1") {
                  if (dw !== 0) standardDays.push(d);
                } else {
                  // ECO 2 (5x2) -> Seg a Sex
                  if (dw >= 1 && dw <= 5) standardDays.push(d);
                }
              }
            } else {
              standardDays = calculateDaysForTeam(v.eq, m, v.vacation);
            }

            const finalDays = standardDays.filter(
              (d) => !(v.folgasGeradas || []).includes(d),
            );
            return {
              ...v,
              eq: cleanString(v.eq),
              dias: finalDays,
              status: "PENDENTE",
            } as Vigilante;
          });
        }
      }
    }

    // --- FIX: GARANTIA DE INTEGRIDADE (ECO 1 / ECO 2) ---
    // Verifica se membros do INITIAL_DB estão faltando na escala carregada e os adiciona.
    // Isso garante que ECO 1 e ECO 2 apareçam mesmo se não existirem no mês anterior.
    INITIAL_DB.forEach((dbVig) => {
      const isPresent = finalData.some(
        (v) => String(v.mat).trim() === String(dbVig.mat).trim(),
      );

      if (!isPresent) {
        let days: number[] = [];
        const teamClean = cleanString(dbVig.eq);

        if (dbVig.campus === "AFASTADOS") {
          days = [];
        } else if (["ECO1", "E1", "ECO2", "E2"].includes(teamClean)) {
          const y = Math.floor(m / 100);
          const mon = (m % 100) - 1;
          const dInM = new Date(y, mon + 1, 0).getDate();
          for (let d = 1; d <= dInM; d++) {
            const dw = new Date(y, mon, d).getDay();
            if (teamClean === "ECO1" || teamClean === "E1") {
              if (dw !== 0) days.push(d); // 6x1 (Seg-Sab)
            } else {
              if (dw >= 1 && dw <= 5) days.push(d); // 5x2 (Seg-Sex)
            }
          }
        } else {
          days = calculateDaysForTeam(dbVig.eq, m, dbVig.vacation);
        }

        finalData.push({
          ...dbVig,
          dias: days,
          status: "PENDENTE",
          manualLock: false,
          folgasGeradas: [],
          coberturas: [],
        });
      }
    });

    // Restore User if missing
    if (user) {
      const userMat = String(user.mat).trim();
      const exists = finalData.find((v) => String(v.mat).trim() === userMat);
      if (!exists) {
        const backupUser = INITIAL_DB.find(
          (db) => String(db.mat).trim() === userMat,
        );
        if (backupUser) {
          const standardDays =
            backupUser.campus === "AFASTADOS"
              ? []
              : calculateDaysForTeam(backupUser.eq, m, backupUser.vacation);
          const restoredVig: Vigilante = {
            ...backupUser,
            dias: standardDays,
            status: "PENDENTE",
            manualLock: false,
            folgasGeradas: [],
            coberturas: [],
          };
          finalData.push(restoredVig);
        }
      }
    }

    // --- PROTEÇÃO DE DADOS DO VIGILANTE (Feature 2) ---
    // Se for Usuário Comum e Mês Futuro: Mostra os dias reais (folgas/trabalho),
    // mas mantém Setor/Horário/Campus "atuais" para evitar confusão com mudanças não oficializadas.
    if (user?.role === "USER" && isFuture) {
      finalData = finalData.map((v) => {
        const original = INITIAL_DB.find((db) => db.mat === v.mat);
        if (original) {
          // Mantém 'dias', 'folgasGeradas', 'vacation' do futuro, mas mascara o local/horário
          return {
            ...v,
            setor: original.setor,
            campus: original.campus,
            horario: original.horario,
            refeicao: original.refeicao,
          };
        }
        return v;
      });
    }

    setData(finalData);
    if (!isSilent) {
      setIsLoading(false);
    } else {
      setTimeout(() => setIsSilentUpdating(false), 500);
    }
  };

  // Modified saveData to handle drafts
  const saveData = async (
    newData: Vigilante[],
    forcePublish = false,
  ): Promise<boolean> => {
    setData(newData);

    // If Simulating/Planning (Future Month) AND NOT Force Publishing, save as DRAFT.
    // If Current Month, standard behavior is Official unless we add a specific "Draft Mode" toggle for current month too.
    // For now, let's assume Future = Draft by default for managers.

    const saveAsDraft = isSimulationMode && !forcePublish;

    const success = await api.saveData(month, newData, saveAsDraft);

    if (success) {
      if (saveAsDraft) {
        setUnsavedChanges(true); // Visually indicate it's not "Official" yet
        setViewingDraft(true);
        showToast("Rascunho salvo na nuvem (Invisível para usuários).", "info");
      } else {
        setUnsavedChanges(false);
        setViewingDraft(false);
        showToast("Dados salvos e publicados!", "success");
      }
    } else {
      showToast("Erro ao salvar na nuvem!", "error");
    }
    return success;
  };

  // --- MEMOIZED VIEWS ---
  const conflicts = useMemo(() => {
    // FIX: Não exibir alertas de conflito em meses futuros (Planejamento) para não poluir a tela
    if (isFutureMonth) return [];

    const rawConflicts = analyzeConflicts(
      data,
      month,
      filterEq === "AFASTADOS" ? "TODAS" : filterEq,
    );

    // FIX: Remove falsos positivos de conflito para equipes ECO nos fins de semana
    return rawConflicts.filter((c) => {
      const team = cleanString(c.equipe);
      const year = Math.floor(month / 100);
      const mon = (month % 100) - 1;
      const date = new Date(year, mon, c.dia);
      const dayOfWeek = date.getDay(); // 0 = Dom, 6 = Sab

      // ECO 1 (6x1) -> Folga Domingo. Se der conflito no Domingo, ignora.
      if (team === "ECO1" || team === "E1") {
        if (dayOfWeek === 0) return false;
      }

      // ECO 2 (5x2) -> Folga Sábado e Domingo. Se der conflito, ignora.
      if (team === "ECO2" || team === "E2") {
        if (dayOfWeek === 0 || dayOfWeek === 6) return false;
      }

      return true;
    });
  }, [data, month, filterEq, isFutureMonth]);

  const lancadorList = useMemo(() => {
    let filtered = data.filter((v) => v.campus !== "AFASTADOS");

    // Regra Fiscal: Vê apenas sua própria equipe no Lançador
    if (user?.role === "FISCAL" && !isMaster) {
      // Exclui ADMs específicos
      filtered = filtered.filter((v) => !EXCLUDED_ADM_MATS.includes(v.mat));

      if (currentUserVig) {
        const myEq = cleanString(currentUserVig.eq);
        const visibleTeams = getVisibleTeams(myEq);
        filtered = filtered.filter((v) =>
          visibleTeams.includes(cleanString(v.eq)),
        );
      } else {
        filtered = []; // Fiscal sem equipe não vê ninguém
      }
    }

    // Filtro visual do dropdown (Aplica-se DEPOIS da restrição de segurança)
    if (selectedLancadorTeam !== "TODAS") {
      filtered = filtered.filter(
        (v) => cleanString(v.eq) === cleanString(selectedLancadorTeam),
      );
    }

    if (lancadorSearch) {
      const term = lancadorSearch.toUpperCase();
      filtered = filtered.filter(
        (v) => v.nome.toUpperCase().includes(term) || v.mat.includes(term),
      );
    }

    return filtered.sort((a, b) => a.nome.localeCompare(b.nome));
  }, [
    data,
    selectedLancadorTeam,
    lancadorSearch,
    user,
    currentUserVig,
    isMaster,
  ]);

  const lancadorSummary = useMemo(() => {
    const total = lancadorList.length;
    const ok = lancadorList.filter((v) => v.manualLock).length;
    const pending = total - ok;
    return { total, ok, pending };
  }, [lancadorList]);

  const groupedData = useMemo<
    Record<
      string,
      (Vigilante & {
        displayStatus?: { active: boolean; status: string; variant: string };
      })[]
    >
  >(() => {
    let displayList = [...data];
    if (
      isUser &&
      currentUserVig &&
      !data.find((v) => v.mat === currentUserVig.mat)
    ) {
      displayList.push(currentUserVig);
    }
    if (!displayList.length)
      return {} as Record<
        string,
        (Vigilante & {
          displayStatus?: { active: boolean; status: string; variant: string };
        })[]
      >;

    let filtered = displayList.filter((v) => {
      // 1. Usuário comum só vê a si mesmo
      if (isUser && view !== "solicitacoes") {
        const uMat = String(user?.mat || "").trim();
        const vMat = String(v.mat || "").trim();
        return uMat === vMat;
      }

      // 2. Fiscal: Exclui ADMs específicos
      if (user?.role === "FISCAL" && EXCLUDED_ADM_MATS.includes(v.mat)) {
        return false;
      }

      // --- CORREÇÃO DE VISIBILIDADE DO FISCAL ---
      // Fiscal só vê EXATAMENTE a sua equipe na tabela principal.
      // Impede ver outros fiscais ou outras equipes.
      if (user?.role === "FISCAL" && currentUserVig) {
        const myEq = cleanString(currentUserVig.eq);
        const targetEq = cleanString(v.eq);
        const visibleTeams = getVisibleTeams(myEq);
        // Se não for da minha equipe, esconde.
        if (!visibleTeams.includes(targetEq)) return false;
      }

      // 3. Filtros da UI
      if (filterEq === "AFASTADOS") {
        return v.campus === "AFASTADOS";
      }
      if (v.campus === "AFASTADOS" && !searchTerm) {
        return (
          filterEq !== "TODAS" && cleanString(v.eq) === cleanString(filterEq)
        );
      }
      if (filterEq !== "TODAS" && cleanString(v.eq) !== cleanString(filterEq))
        return false;
      if (
        searchTerm &&
        !v.nome.toUpperCase().includes(searchTerm.toUpperCase()) &&
        !v.mat.includes(searchTerm)
      )
        return false;
      if (filterDay && view === "escala" && !isUser) {
        const dayNum = parseInt(filterDay);
        const status = getVigilanteStatus(v, dayNum, filterTime);
        const isTeamVacation =
          filterEq !== "TODAS" &&
          v.campus === "AFASTADOS" &&
          cleanString(v.eq) === cleanString(filterEq);
        if (!status.active && !isTeamVacation) return false;
      }
      return true;
    });

    // 4. Reordenação para Fiscal
    if (user?.role === "FISCAL" && currentUserVig) {
      const myEq = cleanString(currentUserVig.eq);
      const teamOrder = [myEq, "E1", "E2"];

      filtered.sort((a, b) => {
        const eqA = cleanString(a.eq);
        const eqB = cleanString(b.eq);
        const indexA = teamOrder.indexOf(eqA);
        const indexB = teamOrder.indexOf(eqB);

        if (indexA !== -1 && indexB !== -1) return indexA - indexB; // Ambos na lista de prioridade
        if (indexA !== -1) return -1; // A na lista, B não
        if (indexB !== -1) return 1; // B na lista, A não
        return eqA.localeCompare(eqB); // Nenhum na lista, ordem alfabética
      });
    }

    const groups: Record<
      string,
      (Vigilante & {
        displayStatus?: { active: boolean; status: string; variant: string };
      })[]
    > = {};
    filtered.forEach((v) => {
      let processedVig = {
        ...v,
        displayStatus: null as {
          active: boolean;
          status: string;
          variant: string;
        } | null,
      };
      if (filterDay && view === "escala") {
        const dayNum = parseInt(filterDay);
        const status = getVigilanteStatus(v, dayNum, filterTime);
        processedVig.displayStatus = status;
      }
      if (!groups[v.campus]) groups[v.campus] = [];
      groups[v.campus].push(processedVig);
    });
    return groups;
  }, [
    data,
    view,
    searchTerm,
    filterEq,
    filterDay,
    filterTime,
    user,
    isUser,
    currentUserVig,
  ]);

  const intervalData = useMemo<{
    list: IntervalVigilante[];
    grouped: Record<string, IntervalVigilante[]>;
  }>(() => {
    if ((view !== "intervalos" && view !== "cftv") || !data.length)
      return { list: [], grouped: {} };
    const rawList: IntervalVigilante[] = [];
    const dayNum = filterDay ? parseInt(filterDay) : new Date().getDate();
    const coveredSectorsMap = new Map<string, string>();
    data.forEach((v) => {
      if (v.campus === "AFASTADOS") return;
      v.coberturas?.forEach((c) => {
        if (
          c.dia === dayNum &&
          c.tipo === "INTERVALO" &&
          c.local.startsWith("COB. INTERVALO")
        ) {
          const sector = cleanString(
            c.local.replace(/COB\. INTERVALO\s*/i, ""),
          );
          coveredSectorsMap.set(sector, v.nome);
        }
      });
    });

    let filteredData = data;
    // Apply Fiscal/Master Restriction for Interval View
    if (user?.role === "FISCAL" && !isMaster && currentUserVig) {
      filteredData = filteredData.filter((v) => {
        const vEq = cleanString(v.eq);
        const myEq = cleanString(currentUserVig.eq);
        const visibleTeams = getVisibleTeams(myEq);
        return visibleTeams.includes(vEq);
      });
    }

    filteredData.forEach((v) => {
      if (v.campus === "AFASTADOS") return;
      const status = getVigilanteStatus(v, dayNum, filterTime || "");

      if (
        !status.active ||
        status.status === "FOLGA" ||
        status.status === "FÉRIAS" ||
        status.status === "FORA DE HORÁRIO"
      ) {
        return;
      }

      const isOnBreak = status.status === "INTERVALO";
      const coversToday = v.coberturas?.find((c) => c.dia === dayNum);
      const coveredBy = coveredSectorsMap.get(cleanString(v.setor));
      const isCovered = !!coveredBy && isOnBreak;
      const risk = calculateIntervalRisk(
        v.setor,
        v.tempOverrides?.[dayNum]?.refeicao || v.refeicao,
        intervalOverrides,
      );
      const isOverridden = !!intervalOverrides[v.setor];
      const hasTempSchedule = !!v.tempOverrides?.[dayNum];
      const effectiveRefeicao =
        v.tempOverrides?.[dayNum]?.refeicao || v.refeicao;
      const effectiveHorario = v.tempOverrides?.[dayNum]?.horario || v.horario;

      // BUG FIX: Determine effectiveSector based on REAL-TIME status
      const isActivelyCovering =
        status.status.includes("COBERTURA") && coversToday;
      const finalSector = isActivelyCovering
        ? `${coversToday.local} (COBERTURA)`
        : v.setor;

      // BUG FIX: Determine effectiveCampus
      // If covering an interval, ALWAYS use the original campus for categorization to prevent disappearing.
      // We trust v.campus for the Grouping, but show the specific sector in the list.
      const isIntervalCoverage =
        coversToday && coversToday.tipo === "INTERVALO";

      const effectiveCampus = isIntervalCoverage
        ? v.campus
        : status.location || v.campus;

      rawList.push({
        ...v,
        isOnBreak,
        isCovered,
        coveredBy,
        risk,
        currentStatus: status.status || "NO POSTO",
        isOverridden,
        effectiveCampus,
        effectiveSector: finalSector,
        hasTempSchedule,
        effectiveRefeicao,
        effectiveHorario,
      });
    });

    // BUG FIX: Always return a category to avoid hiding users
    const getCategory = (c: string) => {
      const u = c.toUpperCase();
      if (u.includes("CAMPUS III") || u.includes("CAMPUS 3")) return "CAMPUS 3";
      if (u.includes("CAMPUS II") || u.includes("CAMPUS 2")) return "CAMPUS 2";
      if (u.includes("CAMPUS I") || u.includes("CAMPUS 1")) return "CAMPUS 1";
      if (u.includes("LABORATÓRIO") || u.includes("LIMA")) return "LABORATÓRIO";
      if (u.includes("CHÁCARA")) return "CHÁCARA";
      if (u.includes("COLETA")) return "COLETA";
      if (u.includes("ADMINISTRAÇÃO")) return "ADMINISTRAÇÃO";
      if (u.includes("OUTROS")) return "OUTROS";
      return c; // Fallback to the original string
    };

    const list =
      intervalCategory === "TODOS"
        ? rawList
        : rawList.filter(
            (v) => getCategory(v.effectiveCampus) === intervalCategory,
          );

    const grouped: Record<string, IntervalVigilante[]> = {};
    list.forEach((v) => {
      const category = getCategory(v.effectiveCampus);
      if (!grouped[category]) grouped[category] = [];
      grouped[category].push(v);
    });

    return { list, grouped };
  }, [
    data,
    view,
    filterDay,
    filterTime,
    intervalOverrides,
    intervalCategory,
    user,
    currentUserVig,
    isMaster,
  ]);

  // Estado para filtro do CFTV
  const [cftvFilter, setCftvFilter] = useState<
    "ALL" | "CRITICAL" | "ATTENTION" | "COVERED" | "ACTIVE"
  >("ALL");
  // Estado para filtro interativo da aba Intervalos
  const [intervalStatusFilter, setIntervalStatusFilter] = useState<
    | "ALL"
    | "ON_BREAK"
    | "COVERED"
    | "RISK"
    | "RISK_RED"
    | "RISK_ORANGE"
    | "RISK_YELLOW"
    | "RISK_GREEN"
  >("ALL");

  // --- ACTIONS ---

  const handleSendToSupervision = async () => {
    if (!currentUserVig) return;
    if (
      !confirm("Confirmar envio do planejamento da sua equipe para supervisão?")
    )
      return;

    const myTeam = cleanString(currentUserVig.eq);
    const newData = data.map((v) => {
      // Marca todos da equipe como 'Prontos'
      if (cleanString(v.eq) === myTeam) {
        return { ...v, draftReady: true };
      }
      return v;
    });

    await saveData(newData, false); // Salva como rascunho
    showToast(
      `Planejamento da Equipe ${myTeam} enviado para supervisão!`,
      "success",
    );
  };

  const commitSimulation = async () => {
    // Publish Official acts as a "Commit Draft to Official"
    if (
      !confirm(
        `PUBLICAR OFICIALMENTE?\n\nIsso tornará o rascunho atual VISÍVEL para todos os vigilantes.`,
      )
    )
      return;

    setIsLoading(true);
    // Force publish = true -> Saves to the Official Key and effectively "merges" draft
    const success = await saveData(data, true);
    if (success) {
      setViewingDraft(false); // No longer just a draft
      setIsSimulationMode(false); // Exit simulation mode? Or keep it open but show saved?
      registerLog("SISTEMA", "Publicação Oficial da Escala", "Múltiplos");
    }
    setIsLoading(false);
  };

  const handleSaveDraft = async () => {
    await saveData(data, false); // Save as draft
  };

  const handleExitSimulation = async () => {
    if (unsavedChanges) {
      if (
        !confirm(
          "⚠️ ATENÇÃO: Você tem alterações não salvas.\n\nDeseja realmente SAIR e DESCARTAR o que fez agora?",
        )
      )
        return;
    }
    // Reload original data (Official)
    await loadDataForMonth(month);
    setIsSimulationMode(false);
    setViewingDraft(false);
    showToast("Modo Edição encerrado.");
  };

  const handleAddNextYear = () => {
    const lastOption = monthOptions[monthOptions.length - 1];
    const lastYear = Math.floor(lastOption.value / 100);
    const newYear = lastYear + 1;
    const newOptions = [];
    const names = [
      "JAN",
      "FEV",
      "MAR",
      "ABR",
      "MAI",
      "JUN",
      "JUL",
      "AGO",
      "SET",
      "OUT",
      "NOV",
      "DEZ",
    ];
    for (let i = 1; i <= 12; i++) {
      newOptions.push({
        value: newYear * 100 + i,
        label: `${names[i - 1]} ${String(newYear).slice(-2)}`,
      });
    }
    setMonthOptions([...monthOptions, ...newOptions]);
    showToast(`Ano de ${newYear} adicionado à lista!`, "success");
  };

  const registerLog = (
    action: AuditLog["action"],
    details: string,
    targetName?: string,
  ) => {
    if (!user) return;
    const newLog: AuditLog = {
      id: Date.now().toString(),
      timestamp: Date.now(),
      user: user.nome + (isSimulationMode ? " (RASCUNHO)" : ""),
      action,
      details,
      targetName,
    };
    api.addLog(month, newLog);
    setLogs((prev) => [newLog, ...prev]);
  };

  // User Management Actions...
  const handleCreateUser = async () => {
    if (!formUserMat || !formUserNome)
      return alert("Preencha matrícula e nome.");
    const exists = allUsers.find((u) => u.mat === formUserMat);
    if (exists) return alert("Matrícula já existe.");
    const newUser: User = {
      mat: formUserMat,
      nome: formUserNome.toUpperCase(),
      role: "USER",
      password: "123456",
      ...formPermissions,
    } as User;
    const updatedList = [...allUsers, newUser];
    const success = await api.saveUsers(updatedList);
    if (success) {
      setAllUsers(updatedList);
      setFormUserMat("");
      setFormUserNome("");
      setFormPermissions({
        canManageIntervals: false,
        canViewLogs: false,
        canPrint: false,
        canSimulate: false,
        canViewCFTV: false,
      });
      setIsUserMgmtModalOpen(false);
      showToast("Usuário criado com sucesso!");
      registerLog("SISTEMA", "Novo usuário criado", newUser.nome);
    } else {
      showToast("Erro ao criar usuário.", "error");
    }
  };
  const startEditUser = (userToEdit: User) => {
    if (userToEdit.mat === SUPER_ADMIN_MAT) {
      alert("O Super Admin não pode ser editado aqui.");
      return;
    }
    setEditingUser(userToEdit);
    setFormUserMat(userToEdit.mat);
    setFormUserNome(userToEdit.nome);
    setFormPermissions({
      canManageIntervals: !!userToEdit.canManageIntervals,
      canViewLogs: !!userToEdit.canViewLogs,
      canPrint: !!userToEdit.canPrint,
      canSimulate: !!userToEdit.canSimulate,
      canViewCFTV: !!(userToEdit as { canViewCFTV?: boolean }).canViewCFTV,
    });
  };
  const cancelEditUser = () => {
    setEditingUser(null);
    setFormUserMat("");
    setFormUserNome("");
    setFormPermissions({
      canManageIntervals: false,
      canViewLogs: false,
      canPrint: false,
      canSimulate: false,
      canViewCFTV: false,
    });
  };
  const handleSaveEditUser = async () => {
    if (!editingUser) return;
    if (!formUserMat || !formUserNome)
      return alert("Preencha todos os campos.");
    if (formUserMat !== editingUser.mat) {
      const exists = allUsers.find((u) => u.mat === formUserMat);
      if (exists)
        return alert("Esta matrícula já está em uso por outro usuário.");
    }
    const updatedUser: User = {
      ...editingUser,
      mat: formUserMat,
      nome: formUserNome.toUpperCase(),
      ...formPermissions,
    } as User;
    const updatedList = allUsers.map((u) =>
      u.mat === editingUser.mat ? updatedUser : u,
    );
    const success = await api.saveUsers(updatedList);
    if (success) {
      setAllUsers(updatedList);
      cancelEditUser();
      setIsUserMgmtModalOpen(false);
      showToast("Usuário atualizado com sucesso!");
      registerLog(
        "SISTEMA",
        `Usuário editado: ${editingUser.nome} -> ${updatedUser.nome}`,
      );
    } else {
      showToast("Erro ao atualizar usuário.", "error");
    }
  };
  const handleToggleRole = async (targetUser: User) => {
    if (targetUser.mat === SUPER_ADMIN_MAT)
      return alert("Não é possível alterar o Super Admin.");
    let newRole: UserRole = "USER";
    if (targetUser.role === "USER") newRole = "FISCAL";
    else if (targetUser.role === "FISCAL") newRole = "MASTER";
    else newRole = "USER";
    const updatedUser: User = { ...targetUser, role: newRole };
    const updatedList = allUsers.map((u) =>
      u.mat === targetUser.mat ? updatedUser : u,
    );
    setAllUsers(updatedList);
    const success = await api.updateUser(updatedUser);
    if (success)
      showToast(`Permissão de ${targetUser.nome} alterada para ${newRole}`);
    else loadUsers();
  };
  const handleTogglePermission = async (
    targetUser: User,
    permission: keyof User,
  ) => {
    if (targetUser.role === "MASTER") return;
    const updatedUser: User = {
      ...targetUser,
      [permission]: !targetUser[permission],
    };
    const updatedList = allUsers.map((u) =>
      u.mat === targetUser.mat ? updatedUser : u,
    );
    setAllUsers(updatedList);
    await api.updateUser(updatedUser);
  };
  const handleResetPassword = async (targetUser: User) => {
    if (!confirm(`Resetar senha de ${targetUser.nome} para '123456'?`)) return;
    const updatedUser = { ...targetUser, password: "123456" };
    const success = await api.updateUser(updatedUser);
    if (success) showToast("Senha resetada com sucesso!");
  };
  const handleDeleteUser = async (targetUser: User) => {
    if (targetUser.mat === SUPER_ADMIN_MAT)
      return alert("Não é possível remover o Super Admin.");
    if (!confirm(`Tem certeza que deseja remover ${targetUser.nome}?`)) return;
    const updatedList = allUsers.filter((u) => u.mat !== targetUser.mat);
    const success = await api.saveUsers(updatedList);
    if (success) {
      setAllUsers(updatedList);
      showToast("Usuário removido.");
    }
  };
  const handleChangeOwnPassword = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!user) return;
    if (newPassword.length < 4) return alert("Senha muito curta.");
    const users = await api.getUsers();
    const meIndex = users.findIndex((u) => u.mat === user.mat);
    if (meIndex > -1) {
      users[meIndex].password = newPassword;
      const success = await api.saveUsers(users);
      if (success) {
        showToast("Sua senha foi alterada! Faça login novamente.");
        setIsPasswordModalOpen(false);
        handleLogout();
      }
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    const matClean = loginMat.trim();
    const res = await api.login(matClean, loginPass);
    if (res.success && res.user) {
      const typedUser = res.user as User;
      typedUser.mat = String(typedUser.mat).trim();
      if (typedUser.mat === "91611")
        typedUser.nome = "CHRISTIANO R.G. DE OLIVEIRA";
      if (!typedUser.role)
        typedUser.role = typedUser.mat === SUPER_ADMIN_MAT ? "MASTER" : "USER";
      setUser(typedUser);
      localStorage.setItem("uno_user", JSON.stringify(typedUser));
      if (typedUser.role === "USER") setSearchTerm(typedUser.nome);
    } else {
      setAuthError(res.message || "Erro ao entrar");
    }
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem("uno_user");
    setLoginMat("");
    setLoginPass("");
    setSearchTerm("");
  };

  const handleCreateVigilante = async () => {
    if (!newVigForm.nome || !newVigForm.mat)
      return alert("Preencha Nome e Matrícula.");
    if (data.some((v) => v.mat === newVigForm.mat))
      return alert("Matrícula já existe na escala atual.");

    // --- LÓGICA DE ESPELHAMENTO (BUDDY SYSTEM) ---
    // Tenta encontrar um "padrinho" na mesma equipe para copiar a escala
    const teamBuddy = data.find(
      (v) =>
        cleanString(v.eq) === cleanString(newVigForm.eq) &&
        v.campus !== "AFASTADOS",
    );

    let initialDays: number[] = [];

    if (teamBuddy) {
      initialDays = [...teamBuddy.dias]; // Copia a escala do padrinho
    } else {
      // Fallback se não houver ninguém na equipe (improvável)
      initialDays = calculateDaysForTeam(newVigForm.eq as Team, month);
    }

    const newVig: Vigilante = {
      nome: newVigForm.nome.toUpperCase(),
      mat: newVigForm.mat.trim(),
      eq: newVigForm.eq as Team,
      setor: "NOVO",
      campus: "OUTROS",
      horario: "12x36",
      refeicao: "***",
      dias: initialDays, // Usa a escala espelhada
      manualLock: false,
      status: "PENDENTE",
      folgasGeradas: [],
      coberturas: [],
    };

    // 1. Salva no mês atual
    const newData = [...data, newVig];
    await saveData(newData);
    registerLog("EDICAO", "Criou novo vigilante", newVig.nome);

    // 2. Tenta propagar para os próximos 3 meses (CORREÇÃO MAURO)
    // Isso garante que se o mês futuro já foi aberto/salvo, o novo vigilante seja inserido lá também.
    try {
      let currentM = month;
      for (let i = 0; i < 3; i++) {
        // Calcula o próximo mês
        let y = Math.floor(currentM / 100);
        let m = currentM % 100;
        m++;
        if (m > 12) {
          m = 1;
          y++;
        }
        currentM = y * 100 + m;

        // Tenta carregar o mês futuro
        const futureData = await api.loadData(currentM);

        if (futureData && futureData.length > 0) {
          // Se o mês já existe, verifica se o vigilante já está lá
          if (!futureData.some((v) => v.mat === newVig.mat)) {
            const futureDays = calculateDaysForTeam(newVig.eq, currentM);
            const futureVigEntry = {
              ...newVig,
              dias: futureDays,
              folgasGeradas: [],
              coberturas: [],
              manualLock: false,
              status: "PENDENTE",
            };
            // Remove férias se houver, pois é outro mês
            delete futureVigEntry.vacation;

            const updatedFutureData = [...futureData, futureVigEntry];
            await api.saveData(currentM, updatedFutureData);
            console.log(`Propagado para o mês ${currentM}: ${newVig.nome}`);
          }
        }
      }
      showToast(
        `Criado em ${currentLabel} e atualizado nos meses futuros existentes!`,
        "success",
      );
    } catch (e) {
      console.error("Erro ao propagar para meses seguintes", e);
      showToast(
        "Vigilante criado, mas houve erro ao replicar para futuro.",
        "info",
      );
    }

    setIsNewVigModalOpen(false);
    setNewVigForm({ nome: "", mat: "", eq: "A" });
    setEditingVig(newVig);
    if (window.innerWidth < 768) setShowMobileEditor(true);
  };

  const handleDeleteVigilante = async () => {
    if (!editingVig) return;
    if (
      !confirm(
        `⚠️ PERIGO: Tem certeza que deseja EXCLUIR DEFINITIVAMENTE o vigilante ${editingVig.nome}?\n\nIsso removerá ele desta escala. Se for um erro de cadastro, prossiga.`,
      )
    )
      return;

    const newData = data.filter((v) => v.mat !== editingVig.mat);
    await saveData(newData);
    registerLog("EDICAO", "Excluiu vigilante da escala", editingVig.nome);

    // --- CORREÇÃO: Propagar exclusão para os próximos 3 meses ---
    try {
      let currentM = month;
      for (let i = 0; i < 3; i++) {
        // Calcula o próximo mês
        let y = Math.floor(currentM / 100);
        let m = currentM % 100;
        m++;
        if (m > 12) {
          m = 1;
          y++;
        }
        currentM = y * 100 + m;

        // Tenta carregar o mês futuro
        const futureData = await api.loadData(currentM);

        if (futureData && futureData.length > 0) {
          // Verifica se o vigilante existe lá e remove
          const updatedFutureData = futureData.filter(
            (v) => v.mat !== editingVig.mat,
          );

          if (updatedFutureData.length !== futureData.length) {
            await api.saveData(currentM, updatedFutureData);
            console.log(`Excluído do mês ${currentM}: ${editingVig.nome}`);
          }
        }
      }
      showToast(
        "Vigilante removido do mês atual e dos próximos meses!",
        "info",
      );
    } catch (e) {
      console.error("Erro ao propagar exclusão para meses seguintes", e);
    }

    setEditingVig(null);
    setShowMobileEditor(false);
  };

  const handleRegenerateSchedule = () => {
    if (
      !confirm(
        `⚠️ RECALCULAR ESCALA (${currentLabel})?\n\nIsso irá redefinir os dias de trabalho...`,
      )
    )
      return;
    const newData = data.map((v) => {
      if (v.campus === "AFASTADOS") return v;

      let newDays: number[] = [];
      const teamClean = cleanString(v.eq);

      if (["ECO1", "E1", "ECO2", "E2"].includes(teamClean)) {
        const y = Math.floor(month / 100);
        const mon = (month % 100) - 1;
        const dInM = new Date(y, mon + 1, 0).getDate();
        for (let d = 1; d <= dInM; d++) {
          const dw = new Date(y, mon, d).getDay();
          if (teamClean === "ECO1" || teamClean === "E1") {
            if (dw !== 0) newDays.push(d);
          } else {
            if (dw >= 1 && dw <= 5) newDays.push(d);
          }
        }
      } else {
        newDays = calculateDaysForTeam(v.eq, month, v.vacation);
      }

      const updatedVig = {
        ...v,
        dias: newDays,
        folgasGeradas: v.folgasGeradas.filter((f) => !newDays.includes(f)),
        manualLock: false,
        status: "PENDENTE",
      };

      // FIX: Remove status de pronto ao regenerar
      if ("draftReady" in updatedVig) delete (updatedVig as any).draftReady;

      return updatedVig;
    });
    saveData(newData);
    registerLog("SISTEMA", `Regerou escala completa do mês ${month}`);
    showToast("Escala recalculada com sucesso!");
  };

  const handleClearFutureMonth = async () => {
    if (!isFutureMonth) return;
    if (
      !confirm(
        `⚠️ TEM CERTEZA? Isso apagará TODOS os dados de ${currentLabel}.\n\nAo recarregar, o sistema tentará gerar a escala novamente com base no mês anterior.`,
      )
    )
      return;

    setIsLoading(true);
    // Salva array vazio para limpar
    await saveData([], true);

    // Recarrega para disparar a lógica de geração automática
    await loadDataForMonth(month);

    setIsLoading(false);
    showToast(
      "Mês limpo! A escala foi gerada novamente com base no mês anterior.",
      "success",
    );
  };

  // --- SMART SUGGESTIONS WITH CONFLICT CHECK ---
  const handleSmartSuggest = () => {
    if (!isFiscal) return;

    // Use filtered data directly to avoid dependency on lancadorList which is memoized
    const candidates = data.filter(
      (v) =>
        v.campus !== "AFASTADOS" &&
        !v.manualLock &&
        (selectedLancadorTeam === "TODAS" ||
          cleanString(v.eq) === cleanString(selectedLancadorTeam)),
    );

    if (candidates.length === 0)
      return alert("Todos visíveis já estão confirmados!");

    // Create proposal (deep copy to avoid mutation)
    const newData = JSON.parse(JSON.stringify(data));
    let changes = 0;

    candidates.forEach((cand) => {
      const idx = newData.findIndex((v: Vigilante) => v.mat === cand.mat);
      if (idx > -1) {
        const vig = newData[idx];
        const standardDays = calculateDaysForTeam(vig.eq, month, vig.vacation);
        if (standardDays.length > 5) {
          const d1 =
            standardDays[Math.floor(Math.random() * (standardDays.length - 2))];
          const d2 = d1 + 2;
          const newDays = standardDays.filter((d) => d !== d1 && d !== d2);
          if (newDays.length !== vig.dias.length) {
            vig.dias = newDays;
            vig.folgasGeradas = [d1, d2].filter((x) => x <= 31);
            vig.status = "AUTO_OK";
            vig.manualLock = true;
            changes++;
          }
        }
      }
    });

    if (changes > 0) {
      // Analyze conflicts on the PROPOSED data using the new logic
      const foundConflicts = analyzeConflicts(newData, month);
      setProposedData(newData);
      setSuggestionConflicts(foundConflicts);
      setIsConflictModalOpen(true);
    } else {
      alert("Não foi possível gerar sugestões novas.");
    }
  };

  const confirmSmartSuggestions = () => {
    if (proposedData) {
      saveData(proposedData);
      registerLog("FOLGAS", "Aceitou sugestão inteligente de folgas.");
      showToast("Folgas geradas com sucesso!");
    }
    setIsConflictModalOpen(false);
    setProposedData(null);
  };

  // ... (Rest of actions: Request logic, Editing, etc.)
  const findUserInData = (userData: User | null, allData: Vigilante[]) => {
    if (!userData) return -1;
    const uMat = String(userData.mat).trim();
    return allData.findIndex((v) => String(v.mat).trim() === uMat);
  };

  const handleToggleRequest = (day: number, isWorking: boolean) => {
    if (!user || !isWorking) return;
    const newData = [...data];
    let idx = findUserInData(user, newData);

    // FIX: Se o usuário existe visualmente (Recuperado/Cache) mas não no array data de edição, adiciona agora.
    if (idx === -1 && currentUserVig) {
      const recovered = {
        ...currentUserVig,
        status: "PENDENTE",
        manualLock: false,
      };
      // Garante que obs/status antigos de afastamento não bloqueiem se ele voltou
      if (recovered.campus === "AFASTADOS") {
        recovered.campus = "OUTROS";
        recovered.setor = "RECUPERADO";
      }
      newData.push(recovered);
      idx = newData.length - 1;
    }

    if (idx === -1) {
      showToast(
        "Erro de permissão ou usuário não localizado na escala deste mês.",
        "error",
      );
      return;
    }

    const vigilante = { ...newData[idx] };
    if (vigilante.requestsLocked) {
      showToast("Aguarde a análise da sua solicitação anterior.", "info");
      return;
    }
    const requests = vigilante.requests || [];
    const existingReqIndex = requests.findIndex((r) => r.day === day);
    if (existingReqIndex > -1) {
      const req = requests[existingReqIndex];
      if (req.status === "APPROVED") {
        showToast("Dia já aprovado. Não é possível alterar.", "info");
        return;
      }
      if (req.status === "REJECTED") {
        const updatedRequests = [...requests];
        updatedRequests[existingReqIndex] = {
          ...req,
          status: "PENDING",
          timestamp: Date.now(),
        };
        vigilante.requests = updatedRequests;
        showToast("Solicitação reaberta!");
      } else {
        vigilante.requests = requests.filter((r) => r.day !== day);
      }
    } else {
      const activeCount = requests.filter(
        (r) => r.status !== "REJECTED",
      ).length;
      if (activeCount >= 2) {
        showToast("Máximo de 2 dias (pendentes/aprovados).", "error");
        return;
      }
      vigilante.requests = [
        ...requests,
        {
          day,
          option: requests.length === 0 ? "A" : "B",
          timestamp: Date.now(),
          status: "PENDING",
        },
      ];
    }
    newData[idx] = vigilante;
    setData(newData);
  };

  const confirmRequests = () => {
    if (!user) return;
    const newData = [...data];
    const idx = findUserInData(user, newData);
    if (idx === -1 && currentUserVig) {
      const newVig = { ...currentUserVig, requestsLocked: true };
      if (!newVig.requests || newVig.requests.length === 0)
        return showToast("Selecione ao menos 1 dia.", "error");
      const updatedData = [...newData, newVig];
      saveData(updatedData);
      showToast("Solicitação enviada com sucesso! Aguarde aprovação.");
      return;
    }
    if (idx === -1) return;
    const vigilante = { ...newData[idx] };
    const count = (vigilante.requests || []).length;
    if (count === 0) return showToast("Selecione ao menos 1 dia.", "error");
    vigilante.requestsLocked = true;
    newData[idx] = vigilante;
    saveData(newData);
    showToast("Solicitação enviada com sucesso! Aguarde aprovação.");
  };
  const handleApproveRequest = (vig: Vigilante, req: Request) => {
    const newData = [...data];
    const idx = newData.findIndex((v) => v.mat === vig.mat);
    if (idx === -1) return;
    const targetVig = { ...newData[idx] };
    if (!targetVig.requests) return;
    const rIndex = targetVig.requests.findIndex((r) => r.day === req.day);
    if (rIndex > -1) {
      targetVig.requests[rIndex].status = "APPROVED";
    }
    targetVig.dias = targetVig.dias.filter((d) => d !== req.day);
    if (!targetVig.folgasGeradas.includes(req.day)) {
      targetVig.folgasGeradas.push(req.day);
      targetVig.folgasGeradas.sort((a, b) => a - b);
    }
    targetVig.manualLock = true;
    targetVig.requestsLocked = false;
    newData[idx] = targetVig;
    saveData(newData);
    registerLog("SOLICITACAO", `Aprovou folga dia ${req.day}`, targetVig.nome);
    showToast("Solicitação Aprovada!");
  };
  const handleRejectRequest = (vig: Vigilante, req: Request) => {
    const newData = [...data];
    const idx = newData.findIndex((v) => v.mat === vig.mat);
    if (idx === -1) return;
    const targetVig = { ...newData[idx] };
    if (!targetVig.requests) return;
    const rIndex = targetVig.requests.findIndex((r) => r.day === req.day);
    if (rIndex > -1) {
      targetVig.requests[rIndex].status = "REJECTED";
    }
    targetVig.requestsLocked = false;
    newData[idx] = targetVig;
    saveData(newData);
    registerLog(
      "SOLICITACAO",
      `Rejeitou solicitação dia ${req.day}`,
      targetVig.nome,
    );
    showToast("Solicitação rejeitada.");
  };
  const handleExport = () => {
    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    const prefix = isSimulationMode ? "RASCUNHO_" : "BACKUP_";
    link.download = `${prefix}escala_periodo_${month}_${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    registerLog("SISTEMA", "Arquivo gerado (Exportação).");
    showToast("Arquivo baixado com sucesso!");
  };

  const handleImportFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const result = e.target?.result as string;
        const json = JSON.parse(result);
        if (Array.isArray(json)) {
          // Safe casting as we validated it's an array
          setImportedData(json as Vigilante[]);
          setIsImportModalOpen(true);
        } else {
          alert("Arquivo inválido.");
        }
      } catch (err) {
        alert("Erro ao ler arquivo JSON.");
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const confirmImport = (action: "replace" | "merge") => {
    if (!importedData) return;
    let finalData: Vigilante[] = [];
    if (action === "replace") {
      finalData = importedData;
      registerLog("IMPORTACAO", "Backup restaurado com substituição total.");
    } else {
      const currentMap = new Map(
        data.map((v) => [v.mat, v] as [string, Vigilante]),
      );
      importedData.forEach((v) => currentMap.set(v.mat, v));
      finalData = Array.from(currentMap.values());
      registerLog("IMPORTACAO", "Backup/Rascunho mesclado.");
    }
    if (isSimulationMode) {
      setData(finalData);
      setUnsavedChanges(true);
      showToast("Dados importados para o modo Simulação. Revise e Publique.");
    } else {
      saveData(finalData);
      showToast("Dados importados e salvos na nuvem!");
    }
    setIsImportModalOpen(false);
    setImportedData(null);
  };
  const handleSetNow = () => {
    setIsLiveTime((prev) => !prev);
  };
  const handleSaveEditor = () => {
    if (!editingVig) return;
    const newData = [...data];
    const idx = newData.findIndex((v) => v.mat === editingVig.mat);
    if (idx > -1) {
      const originalVig = data[idx];
      const updated = { ...editingVig };

      // Se a equipe mudou, recalcula os dias
      if (originalVig.eq !== updated.eq) {
        updated.dias = calculateDaysForTeam(
          updated.eq,
          month,
          updated.vacation,
        );
        updated.folgasGeradas = []; // Limpa folgas ao trocar de equipe
      }

      if (timeInputs.hStart && timeInputs.hEnd)
        updated.horario = formatTimeInputs(timeInputs.hStart, timeInputs.hEnd);

      // --- LÓGICA DE CÁLCULO AUTOMÁTICO DE INTERVALO (1h15) ---
      if (timeInputs.rStart) {
        const [h, m] = timeInputs.rStart.split(":").map(Number);
        if (!isNaN(h) && !isNaN(m)) {
          let totalMins = h * 60 + m + 75; // Adiciona 75 minutos (1h15)
          const endH = Math.floor(totalMins / 60) % 24;
          const endM = totalMins % 60;
          const rEndCalc = `${String(endH).padStart(2, "0")}:${String(endM).padStart(2, "0")}`;

          // Salva o intervalo formatado (Início calculado + Fim calculado)
          updated.refeicao = formatTimeInputs(timeInputs.rStart, rEndCalc);
        }
      } else {
        // Se não tiver início, limpa o intervalo
        updated.refeicao = "";
      }

      if (vacationInputs.start && vacationInputs.end) {
        const s = parseInt(vacationInputs.start);
        const e = parseInt(vacationInputs.end);
        if (!isNaN(s) && !isNaN(e) && e >= s) {
          updated.vacation = { start: s, end: e };
          const allDays = calculateDaysForTeam(updated.eq, month);
          updated.dias = allDays.filter((d) => d < s || d > e);
        } else {
          updated.vacation = undefined;
          // Recalcula se as férias forem removidas
          if (originalVig.vacation) {
            updated.dias = calculateDaysForTeam(updated.eq, month);
          }
        }
      } else {
        updated.vacation = undefined;
        // Recalcula se as férias forem removidas
        if (originalVig.vacation) {
          updated.dias = calculateDaysForTeam(updated.eq, month);
        }
      }
      updated.manualLock = true;
      updated.status = "MANUAL_OK";
      updated.setor = updated.setor.toUpperCase();
      newData[idx] = updated;
      saveData(newData);
      registerLog("EDICAO", "Alteração manual.", updated.nome);
      setEditingVig(null);
      setShowMobileEditor(false);
    }
  };
  const handleToggleDay = (vig: Vigilante, day: number) => {
    if (!isFiscal) return;
    const newData = [...data];
    const idx = newData.findIndex((v) => v.mat === vig.mat);
    if (idx === -1) return;
    const target = { ...newData[idx] };
    if (target.dias.includes(day)) {
      target.dias = target.dias.filter((d) => d !== day);
      if (!target.folgasGeradas.includes(day)) target.folgasGeradas.push(day);
    } else {
      target.dias.push(day);
      target.dias.sort((a, b) => a - b);
      target.folgasGeradas = target.folgasGeradas.filter((d) => d !== day);
    }
    target.manualLock = true;
    target.status = "MANUAL_OK";
    newData[idx] = target;
    saveData(newData);
    registerLog("EDICAO", `Alteração de dia na escala: ${day}`, target.nome);
    if (editingVig && editingVig.mat === vig.mat) setEditingVig(target);
  };

  // NEW: Handle Falta Toggle
  const handleToggleFalta = (vig: Vigilante, day: number) => {
    if (!isFiscal) return;
    const newData = [...data];
    const idx = newData.findIndex((v) => v.mat === vig.mat);
    if (idx === -1) return;

    const target = { ...newData[idx] };
    if (!target.faltas) target.faltas = [];

    if (target.faltas.includes(day)) {
      target.faltas = target.faltas.filter((d) => d !== day);
    } else {
      target.faltas.push(day);
      target.faltas.sort((a, b) => a - b);
      target.dias = target.dias.filter((d) => d !== day);
    }

    target.manualLock = true;
    newData[idx] = target;
    saveData(newData);
    registerLog("EDICAO", `Alteração de FALTA dia: ${day}`, target.nome);
    if (editingVig && editingVig.mat === vig.mat) setEditingVig(target);
  };

  // NEW: Handle Partial Absence (Saída Antecipada/Passou mal)
  const handleTogglePartial = (vig: Vigilante, day: number) => {
    if (!isFiscal) return;
    const newData = [...data];
    const idx = newData.findIndex((v) => v.mat === vig.mat);
    if (idx === -1) return;

    const target = { ...newData[idx] };
    if (!target.saidasAntecipadas) target.saidasAntecipadas = [];

    if (target.saidasAntecipadas.includes(day)) {
      target.saidasAntecipadas = target.saidasAntecipadas.filter(
        (d) => d !== day,
      );
    } else {
      target.saidasAntecipadas.push(day);
      target.saidasAntecipadas.sort((a, b) => a - b);
      // Se marcou parcial, GARANTE que o dia está como trabalhado (pois trabalhou um pouco)
      if (!target.dias.includes(day)) {
        target.dias.push(day);
        target.dias.sort((a, b) => a - b);
        target.folgasGeradas = target.folgasGeradas.filter((d) => d !== day);
      }
    }

    target.manualLock = true;
    newData[idx] = target;
    saveData(newData);
    registerLog("EDICAO", `Marcou SAÍDA PARCIAL dia: ${day}`, target.nome);
    if (editingVig && editingVig.mat === vig.mat) setEditingVig(target);
  };

  // NEW: Handle Vacation Toggle on Grid
  const handleToggleVacation = (vig: Vigilante, day: number) => {
    if (!isFiscal) return;
    const currentVacation = vig.vacation || { start: 0, end: 0 };
    let newVacation: { start: number; end: number } | undefined = {
      ...currentVacation,
    };

    // Logic:
    // 1. If start is 0 or undefined -> Set start = day
    // 2. If day < start -> Set new start = day
    // 3. If day > start -> Set end = day
    // 4. If day == start == end -> Reset/Clear

    if (!newVacation.start || newVacation.start === 0) {
      newVacation.start = day;
      newVacation.end = day;
    } else if (day < newVacation.start) {
      newVacation.start = day;
    } else if (day > newVacation.start) {
      newVacation.end = day;
    } else if (day === newVacation.start && day === newVacation.end) {
      newVacation = undefined;
    } else if (day === newVacation.start) {
      // Clicking start again could mean nothing or reset
      newVacation = undefined;
    } else {
      // Reset if clicking wildly
      newVacation = { start: day, end: day };
    }

    const newData = [...data];
    const idx = newData.findIndex((v) => v.mat === vig.mat);
    if (idx > -1) {
      const target = { ...newData[idx] };
      target.vacation = newVacation;

      // Remove work days that are inside vacation range
      // We only filter if newVacation exists and is fully defined
      if (newVacation && newVacation.start && newVacation.end) {
        const s = newVacation.start;
        const e = newVacation.end;
        target.dias = (target.dias || []).filter((d) => d < s || d > e);
      }

      target.manualLock = true;
      newData[idx] = target;
      saveData(newData);
      if (editingVig && editingVig.mat === vig.mat) {
        setEditingVig(target);
        // Update inputs for visual feedback
        if (newVacation && newVacation.start)
          setVacationInputs({
            start: String(newVacation.start),
            end: String(newVacation.end || newVacation.start),
          });
        else setVacationInputs({ start: "", end: "" });
      }
    }
  };

  const handleReturnFromAway = (vig: Vigilante) => {
    if (!isFiscal) return;
    if (confirm("Retornar colaborador?")) {
      const newData = [...data];
      const idx = newData.findIndex((x) => x.mat === vig.mat);
      if (idx > -1) {
        const original = INITIAL_DB.find((db) => db.mat === vig.mat);
        const restored = { ...newData[idx] };
        if (original && original.campus !== "AFASTADOS") {
          restored.campus = original.campus;
          restored.setor = original.setor;
          restored.horario = original.horario;
        } else {
          restored.campus = "OUTROS";
          restored.setor = "RETORNO MANUAL";
        }
        restored.status = "PENDENTE";
        restored.obs = "";
        restored.dias = calculateDaysForTeam(restored.eq, month);
        newData[idx] = restored;
        saveData(newData);
        registerLog("EDICAO", "Retorno manual.", vig.nome);
      }
    }
  };
  const handleRemoveCoverage = (vig: Vigilante, dia: number) => {
    if (!canManageIntervals) return;
    if (!confirm("Cancelar esta cobertura?")) return;
    const newData = [...data];
    const idx = newData.findIndex((v) => v.mat === vig.mat);
    if (idx > -1) {
      const v = newData[idx];
      v.coberturas = v.coberturas?.filter((c) => c.dia !== dia) || [];
      saveData(newData);
      registerLog("COBERTURA", `Cobertura do dia ${dia} cancelada`, v.nome);
    }
  };
  const handleOpenTempEditor = (vig: Vigilante) => {
    setTempEditVig(vig);
    setIsTempEditorOpen(true);
  };
  const handleSaveTempSchedule = () => {
    if (!tempEditVig) return;
    if (!tempTimeInputs.hStart || !tempTimeInputs.hEnd) {
      alert("Preencha os campos de Horário.");
      return;
    }
    const dayNum = filterDay ? parseInt(filterDay) : new Date().getDate();
    const newData = [...data];
    const idx = newData.findIndex((v) => v.mat === tempEditVig.mat);
    if (idx > -1) {
      const v = newData[idx];
      if (!v.tempOverrides) v.tempOverrides = {};
      const newSchedule = formatTimeInputs(
        tempTimeInputs.hStart,
        tempTimeInputs.hEnd,
      );

      // --- LÓGICA DE CÁLCULO AUTOMÁTICO DE INTERVALO (1h15) ---
      let newRefeicao = "";
      if (tempTimeInputs.rStart) {
        const [h, m] = tempTimeInputs.rStart.split(":").map(Number);
        if (!isNaN(h) && !isNaN(m)) {
          let totalMins = h * 60 + m + 75; // Adiciona 75 minutos (1h15)
          const endH = Math.floor(totalMins / 60) % 24;
          const endM = totalMins % 60;
          const rEndCalc = `${String(endH).padStart(2, "0")}:${String(endM).padStart(2, "0")}`;

          // Salva o intervalo formatado (Início calculado + Fim calculado)
          newRefeicao = formatTimeInputs(tempTimeInputs.rStart, rEndCalc);
        }
      }

      v.tempOverrides[dayNum] = { horario: newSchedule, refeicao: newRefeicao };
      saveData(newData);
      registerLog(
        "EDICAO",
        `Alteração TEMPORÁRIA de horário no dia ${dayNum}`,
        v.nome,
      );
      setIsTempEditorOpen(false);
      setTempEditVig(null);
      showToast("Horário temporário aplicado para hoje.");
    }
  };
  const openPriorityModal = (sector: string) => {
    if (!canManageIntervals) return;
    setTargetSectorForPriority(sector);
    setIsPriorityModalOpen(true);
  };
  const savePriorityOverride = async (priority: IntervalPriority) => {
    if (!targetSectorForPriority) return;
    const newOverrides = {
      ...intervalOverrides,
      [targetSectorForPriority]: priority,
    };
    const success = await api.saveIntervalOverrides(newOverrides);
    if (success) {
      setIntervalOverrides(newOverrides);
      showToast("Prioridade salva e sincronizada!", "success");
    } else {
      showToast("Erro ao sincronizar prioridade.", "error");
    }
    setIsPriorityModalOpen(false);
    setTargetSectorForPriority(null);
    registerLog(
      "SISTEMA",
      `Prioridade do setor ${targetSectorForPriority} alterada para ${priority}.`,
    );
  };
  const handleApplyIntervalCoverage = (candidate: Vigilante) => {
    if (!intervalEditVig) return;
    const newData = [...data];
    const idx = newData.findIndex((v) => v.mat === candidate.mat);
    if (idx > -1) {
      const v = newData[idx];
      if (!v.coberturas) v.coberturas = [];
      const diaNum = filterDay ? parseInt(filterDay) : -1;
      const sectorTag = cleanString(intervalEditVig.setor);
      v.coberturas.push({
        dia: diaNum,
        local: `COB. INTERVALO ${sectorTag}`,
        tipo: "INTERVALO",
        origem: v.campus,
      });
      saveData(newData);
      registerLog(
        "COBERTURA",
        `Cobriu intervalo de ${intervalEditVig.nome}`,
        v.nome,
      );
      setIntervalCoverageModalOpen(false);
      setIntervalEditVig(null);
      showToast(`✅ Cobertura definida!`);
    }
  };
  const handleRemoveIntervalCoverage = (targetVig: Vigilante) => {
    if (!confirm(`Remover cobertura?`)) return;
    const newData = [...data];
    const dayNum = filterDay ? parseInt(filterDay) : new Date().getDate();
    const targetSector = cleanString(targetVig.setor);
    let found = false;
    for (let i = 0; i < newData.length; i++) {
      const v = newData[i];
      if (!v.coberturas) continue;
      const covIdx = v.coberturas.findIndex((c) => {
        if (c.dia !== dayNum) return false;
        if (c.tipo !== "INTERVALO") return false;
        const localClean = cleanString(
          c.local.replace(/COB\. INTERVALO\s*/i, ""),
        );
        return localClean === targetSector;
      });
      if (covIdx > -1) {
        v.coberturas.splice(covIdx, 1);
        found = true;
        break;
      }
    }
    if (found) {
      saveData(newData);
      registerLog(
        "EDICAO",
        `Removeu cobertura de intervalo de ${targetVig.setor}`,
        targetVig.nome,
      );
      showToast("Cobertura removida!");
    }
  };
  const handleOpenCoverage = (dia: number, campus: string, equipe: string) => {
    if (!canManageIntervals) return;
    setCoverageTarget({ dia, campus, equipe });
    setCoverageSearch("");
    setIsCoverageModalOpen(true);
  };
  const applyCoverage = (
    candidate: Vigilante,
    type: "REMANEJAMENTO" | "EXTRA",
  ) => {
    if (!coverageTarget) return;
    const newData = [...data];
    const idx = newData.findIndex((v) => v.mat === candidate.mat);
    if (idx > -1) {
      const v = newData[idx];
      if (!v.coberturas) v.coberturas = [];
      v.coberturas.push({
        dia: coverageTarget.dia,
        local: coverageTarget.campus,
        tipo: type,
        origem: v.campus,
      });
      v.manualLock = true;
      saveData(newData);
      registerLog("COBERTURA", `[${type}] em ${coverageTarget.campus}`, v.nome);
      setIsCoverageModalOpen(false);
      setCoverageTarget(null);
      showToast(`✅ Cobertura aplicada!`);
    }
  };

  const renderIntervalSummary = () => {
    const total = intervalData.list.length;
    const onBreak = intervalData.list.filter((v) => v.isOnBreak).length;
    const covered = intervalData.list.filter(
      (v) => v.isOnBreak && v.isCovered,
    ).length;

    // Detailed Risk Breakdown
    const countRed = intervalData.list.filter(
      (v) => v.isOnBreak && !v.isCovered && v.risk === "RED",
    ).length;
    const countOrange = intervalData.list.filter(
      (v) => v.isOnBreak && !v.isCovered && v.risk === "ORANGE",
    ).length;
    const countYellow = intervalData.list.filter(
      (v) => v.isOnBreak && !v.isCovered && v.risk === "YELLOW",
    ).length;
    const countGreen = intervalData.list.filter(
      (v) => v.isOnBreak && !v.isCovered && v.risk === "GREEN",
    ).length;

    return (
      <div className="flex flex-col gap-3 mb-6 animate-fade-in">
        {/* Row 1: Operational Stats */}
        <div className="grid grid-cols-3 gap-3">
          <Card
            onClick={() => setIntervalStatusFilter("ALL")}
            className={`p-3 border-l-4 border-l-slate-400 cursor-pointer transition-all hover:shadow-md ${intervalStatusFilter === "ALL" ? "ring-2 ring-slate-400 bg-slate-800" : "bg-slate-800/50"}`}
          >
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Efetivo Local
            </div>
            <div className="text-2xl font-black text-slate-200">{total}</div>
          </Card>
          <Card
            onClick={() =>
              setIntervalStatusFilter(
                intervalStatusFilter === "ON_BREAK" ? "ALL" : "ON_BREAK",
              )
            }
            className={`p-3 border-l-4 border-l-blue-500 cursor-pointer transition-all hover:shadow-md ${intervalStatusFilter === "ON_BREAK" ? "ring-2 ring-blue-500 bg-blue-900/50" : "bg-slate-800/50"}`}
          >
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Em Intervalo
            </div>
            <div className="text-2xl font-black text-blue-400">{onBreak}</div>
          </Card>
          <Card
            onClick={() =>
              setIntervalStatusFilter(
                intervalStatusFilter === "COVERED" ? "ALL" : "COVERED",
              )
            }
            className={`p-3 border-l-4 border-l-emerald-500 cursor-pointer transition-all hover:shadow-md ${intervalStatusFilter === "COVERED" ? "ring-2 ring-emerald-500 bg-emerald-900/50" : "bg-slate-800/50"}`}
          >
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Cobertos
            </div>
            <div className="text-2xl font-black text-emerald-400">
              {covered}
            </div>
          </Card>
        </div>

        {/* Row 2: Risk Dashboard (The "Traffic Light" System) */}
        <div className="grid grid-cols-4 gap-2">
          <Card
            onClick={() =>
              setIntervalStatusFilter(
                intervalStatusFilter === "RISK_RED" ? "ALL" : "RISK_RED",
              )
            }
            className={`p-2 border-l-4 border-l-red-600 cursor-pointer transition-all hover:shadow-md flex flex-col items-center justify-center ${countRed > 0 ? "bg-red-900/80 animate-pulse-slow" : "bg-slate-800/50 opacity-60"} ${intervalStatusFilter === "RISK_RED" ? "ring-2 ring-red-500 scale-105 opacity-100" : ""}`}
          >
            <div className="text-2xl font-black text-white">{countRed}</div>
            <div className="text-[9px] font-bold text-red-200 uppercase tracking-wider">
              🔴 Crítico
            </div>
          </Card>

          <Card
            onClick={() =>
              setIntervalStatusFilter(
                intervalStatusFilter === "RISK_ORANGE" ? "ALL" : "RISK_ORANGE",
              )
            }
            className={`p-2 border-l-4 border-l-orange-500 cursor-pointer transition-all hover:shadow-md flex flex-col items-center justify-center ${countOrange > 0 ? "bg-orange-900/60" : "bg-slate-800/50 opacity-60"} ${intervalStatusFilter === "RISK_ORANGE" ? "ring-2 ring-orange-500 scale-105 opacity-100" : ""}`}
          >
            <div className="text-2xl font-black text-orange-100">
              {countOrange}
            </div>
            <div className="text-[9px] font-bold text-orange-300 uppercase tracking-wider">
              🟠 Alto
            </div>
          </Card>

          <Card
            onClick={() =>
              setIntervalStatusFilter(
                intervalStatusFilter === "RISK_YELLOW" ? "ALL" : "RISK_YELLOW",
              )
            }
            className={`p-2 border-l-4 border-l-yellow-500 cursor-pointer transition-all hover:shadow-md flex flex-col items-center justify-center ${countYellow > 0 ? "bg-yellow-900/40" : "bg-slate-800/50 opacity-60"} ${intervalStatusFilter === "RISK_YELLOW" ? "ring-2 ring-yellow-500 scale-105 opacity-100" : ""}`}
          >
            <div className="text-2xl font-black text-yellow-100">
              {countYellow}
            </div>
            <div className="text-[9px] font-bold text-yellow-300 uppercase tracking-wider">
              🟡 Médio
            </div>
          </Card>

          <Card
            onClick={() =>
              setIntervalStatusFilter(
                intervalStatusFilter === "RISK_GREEN" ? "ALL" : "RISK_GREEN",
              )
            }
            className={`p-2 border-l-4 border-l-slate-500 cursor-pointer transition-all hover:shadow-md flex flex-col items-center justify-center ${countGreen > 0 ? "bg-slate-700" : "bg-slate-800/50 opacity-60"} ${intervalStatusFilter === "RISK_GREEN" ? "ring-2 ring-slate-400 scale-105 opacity-100" : ""}`}
          >
            <div className="text-2xl font-black text-slate-200">
              {countGreen}
            </div>
            <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
              🟢 Baixo
            </div>
          </Card>
        </div>
      </div>
    );
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-800 p-4 relative">
        <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md border-t-8 border-gold-500 relative transition-all animate-fade-in">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-6">
              <UnoesteSecurityLogo className="w-40 h-auto drop-shadow-xl" />
            </div>
            <h2 className="text-brand-800 font-black text-2xl tracking-tight uppercase">
              Sistema de Escalas
            </h2>
            <h3 className="text-gold-500 font-bold text-lg tracking-widest">
              SEGURANÇA
            </h3>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            <Input
              autoFocus
              value={loginMat}
              onChange={(e) => setLoginMat(e.target.value)}
              placeholder="Matrícula"
              className="bg-gray-50 text-lg py-3"
            />
            <div className="relative">
              <Input
                type={showLoginPass ? "text" : "password"}
                value={loginPass}
                onChange={(e) => setLoginPass(e.target.value)}
                placeholder="Senha (Padrão: 123456)"
                className="bg-gray-50 text-lg py-3 pr-10"
              />
              <button
                type="button"
                onClick={() => setShowLoginPass(!showLoginPass)}
                className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-600"
                tabIndex={-1}
              >
                {showLoginPass ? <Icons.EyeOff /> : <Icons.Eye />}
              </button>
            </div>
            {authError && (
              <div className="text-red-600 text-sm font-bold text-center bg-red-50 p-2 rounded border border-red-100 animate-pulse">
                {authError}
              </div>
            )}
            <Button
              type="submit"
              className="w-full py-3 text-lg font-bold shadow-lg"
            >
              ENTRAR
            </Button>
            <div
              className={`mt-4 text-center text-xs font-mono py-2 rounded border ${dbStatus.online ? "bg-green-50 text-green-700 border-green-200" : "bg-orange-50 text-orange-700 border-orange-200"}`}
            >
              {dbStatus.online ? (
                <span className="flex items-center justify-center gap-1">
                  ✅ Conectado
                </span>
              ) : (
                <div>
                  <div className="font-bold flex items-center justify-center gap-1">
                    ⚠️ Falha na Conexão
                  </div>
                  <div className="opacity-80 mt-1">{dbStatus.message}</div>
                  <button
                    type="button"
                    onClick={checkSystemStatus}
                    className="mt-2 text-[10px] underline hover:text-black"
                  >
                    Tentar Novamente
                  </button>
                </div>
              )}
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-slate-900 text-slate-200 font-sans print:h-auto print:overflow-visible">
      <input
        type="file"
        id="fileInput"
        ref={fileInputRef}
        className="hidden"
        accept=".json"
        onChange={handleImportFile}
      />

      <AppHeader
        user={user}
        month={month}
        setMonth={setMonth}
        monthOptions={filteredMonthOptions}
        handleAddNextYear={handleAddNextYear}
        isFutureMonth={isFutureMonth}
        viewingDraft={viewingDraft}
        isSimulationMode={isSimulationMode}
        setIsSimulationMode={setIsSimulationMode}
        handleSaveDraft={handleSaveDraft}
        commitSimulation={commitSimulation}
        handleExitSimulation={handleExitSimulation}
        handleLogout={handleLogout}
        setIsHelpModalOpen={setIsHelpModalOpen}
        setIsPasswordModalOpen={setIsPasswordModalOpen}
        canEnterSimulation={canEnterSimulation}
        canPrint={canPrint}
        isMaster={isMaster}
        canViewLogs={canViewLogs}
        handleExport={handleExport}
        setIsLogModalOpen={setIsLogModalOpen}
        setIsUserMgmtModalOpen={setIsUserMgmtModalOpen}
        fileInputRef={fileInputRef}
        teamsStatus={teamsStatus}
        handleSendToSupervision={handleSendToSupervision}
        isSilentUpdating={isSilentUpdating}
      />

      <div className="bg-slate-900 border-b border-slate-700 p-2 flex flex-col md:flex-row gap-4 print:hidden shadow-sm items-center">
        <div className="flex bg-slate-800 p-1 rounded-lg overflow-x-auto no-scrollbar shrink-0 border border-slate-700">
          <button
            onClick={() => setView("escala")}
            className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all whitespace-nowrap ${view === "escala" ? "bg-blue-600 text-white shadow-md" : "text-slate-400 hover:text-white"}`}
          >
            ESCALA
          </button>
          {isFiscal && (
            <button
              onClick={() => {
                setView("lancador");
              }}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all whitespace-nowrap ${view === "lancador" ? "bg-blue-600 text-white shadow-md" : "text-slate-400 hover:text-white"}`}
            >
              LANÇADOR
            </button>
          )}
          {canManageIntervals && (
            <button
              onClick={() => setView("intervalos")}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all whitespace-nowrap ${view === "intervalos" ? "bg-blue-600 text-white shadow-md" : "text-slate-400 hover:text-white"}`}
            >
              🍽️ INTERVALOS
            </button>
          )}
          {canViewCFTV && (
            <button
              onClick={() => setView("cftv")}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all whitespace-nowrap ${view === "cftv" ? "bg-blue-600 text-white shadow-md" : "text-slate-400 hover:text-white"}`}
            >
              🎥 MONITORAMENTO
            </button>
          )}
          <button
            onClick={() => setView("solicitacoes")}
            className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all whitespace-nowrap ${view === "solicitacoes" ? "bg-blue-600 text-white shadow-md" : "text-slate-400 hover:text-white"}`}
          >
            📅 SOLICITAÇÕES
          </button>
          {isMaster && isFutureMonth && (
            <button
              onClick={handleClearFutureMonth}
              className="px-3 py-1.5 rounded-md text-xs font-bold transition-all whitespace-nowrap bg-red-600 text-white shadow-md hover:bg-red-700 ml-2"
            >
              🗑️ LIMPAR MÊS
            </button>
          )}
        </div>
        <div className="flex items-center gap-2">
          {(!isUser || canManageIntervals || canViewCFTV) &&
            (view === "escala" || view === "intervalos" || view === "cftv") && (
              <div className="flex flex-wrap items-center gap-2 bg-slate-800 p-1.5 rounded-lg border border-slate-700">
                <span className="text-[10px] font-bold text-slate-500 uppercase whitespace-nowrap">
                  Plantão:
                </span>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    placeholder="Dia"
                    className="w-12 text-center text-xs border rounded p-1.5 bg-slate-700 text-white border-slate-600"
                    value={filterDay}
                    onChange={(e) => {
                      setFilterDay(e.target.value);
                      setIsLiveTime(false);
                    }}
                  />
                  <input
                    type="time"
                    className="text-xs border rounded p-1.5 bg-slate-700 text-white border-slate-600"
                    value={filterTime}
                    onChange={(e) => {
                      setFilterTime(e.target.value);
                      setIsLiveTime(false);
                    }}
                  />
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={handleSetNow}
                    className={`text-white text-xs px-3 py-1.5 rounded font-bold shadow-sm flex items-center gap-1 whitespace-nowrap transition-all ${isLiveTime ? "bg-red-600 animate-pulse" : "bg-brand-600 hover:bg-brand-700"}`}
                  >
                    <span className="hidden sm:inline">
                      {isLiveTime ? "PAUSAR" : "AO VIVO"}
                    </span>{" "}
                    <Icons.Clock />
                  </button>
                  {(filterDay || filterTime) && (
                    <button
                      onClick={() => {
                        setFilterDay("");
                        setFilterTime("");
                        setIsLiveTime(false);
                      }}
                      className="bg-slate-200 text-slate-600 text-xs px-2 py-1.5 rounded hover:bg-slate-300"
                    >
                      <Icons.X />
                    </button>
                  )}
                </div>
              </div>
            )}
        </div>
      </div>

      <main className="flex-1 overflow-hidden relative print:overflow-visible print:h-auto">
        {view === "escala" && (
          <EscalaView
            groupedData={groupedData}
            conflicts={conflicts}
            user={user}
            isUser={isUser}
            isFiscal={isFiscal}
            isMaster={isMaster}
            currentUserVig={currentUserVig}
            currentLabel={currentLabel}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            filterEq={filterEq}
            setFilterEq={setFilterEq}
            filterDay={filterDay}
            handleOpenCoverage={handleOpenCoverage}
            handleReturnFromAway={handleReturnFromAway}
            handleRemoveCoverage={handleRemoveCoverage}
          />
        )}

        {/* --- LANÇADOR VIEW --- */}
        {view === "lancador" && (
          <LancadorView
            showMobileEditor={showMobileEditor}
            setShowMobileEditor={setShowMobileEditor}
            currentLabel={currentLabel}
            user={user}
            selectedLancadorTeam={selectedLancadorTeam}
            setSelectedLancadorTeam={setSelectedLancadorTeam}
            lancadorSearch={lancadorSearch}
            setLancadorSearch={setLancadorSearch}
            editingVig={editingVig}
            setEditingVig={setEditingVig}
            lancadorSummary={lancadorSummary}
            lancadorList={lancadorList}
            timeInputs={timeInputs}
            setTimeInputs={setTimeInputs}
            editorMode={editorMode}
            setEditorMode={setEditorMode}
            handleSaveEditor={handleSaveEditor}
            handleDeleteVigilante={handleDeleteVigilante}
            handleToggleDay={handleToggleDay}
            handleToggleVacation={handleToggleVacation}
            handleToggleFalta={handleToggleFalta}
            handleTogglePartial={handleTogglePartial}
            setIsNewVigModalOpen={setIsNewVigModalOpen}
            handleSmartSuggest={handleSmartSuggest}
            month={month}
          />
        )}

        {view === "solicitacoes" && (
          <div className="h-full flex-1 overflow-y-auto bg-slate-900 p-4 md:p-8 pb-20">
            {isUser && !isFiscal && !isMaster && currentUserVig ? (
              <div className="max-w-xl mx-auto space-y-4">
                <div className="bg-slate-800 rounded-xl shadow-lg border border-slate-700 overflow-hidden">
                  <div className="bg-gradient-to-r from-brand-700 to-brand-900 p-6 text-white text-center">
                    <div className="text-5xl mb-2">📅</div>
                    <h2 className="text-2xl font-black tracking-tight">
                      Solicitação de Folga
                    </h2>
                    <p className="opacity-80 text-sm mt-1">
                      Escolha até 2 dias para folgar neste mês.
                    </p>
                  </div>
                  <div className="p-6">
                    <div className="mb-6 bg-yellow-900/20 text-yellow-200 p-4 rounded-lg text-xs leading-relaxed border border-yellow-800">
                      <strong>Regras:</strong>
                      <ul className="list-disc pl-4 mt-1 space-y-1">
                        <li>
                          Você pode escolher <strong>02 (dois)</strong> dias
                          preferenciais.
                        </li>
                        <li>
                          A primeira opção (A) é sua prioridade, a segunda (B) é
                          uma alternativa.
                        </li>
                        <li>
                          Sua solicitação será analisada pelo fiscal/gestor.
                        </li>
                      </ul>
                    </div>

                    <div className="space-y-4">
                      <div className="flex justify-between items-end border-b border-slate-700 pb-2 mb-2">
                        <h3 className="font-bold text-slate-300 text-sm uppercase tracking-wide">
                          Dias Disponíveis
                        </h3>
                        <span className="text-xs font-bold text-brand-400 bg-brand-900/50 px-2 py-1 rounded uppercase">
                          {currentLabel}
                        </span>
                      </div>

                      <div className="grid grid-cols-7 gap-2 text-center mb-1 select-none">
                        {["D", "S", "T", "Q", "Q", "S", "S"].map((d, i) => (
                          <div
                            key={i}
                            className="text-xs font-bold text-slate-500"
                          >
                            {d}
                          </div>
                        ))}
                      </div>

                      <div className="grid grid-cols-7 gap-2">
                        {(() => {
                          const year = Math.floor(month / 100);
                          const mon = (month % 100) - 1;
                          const firstDayIndex = new Date(year, mon, 1).getDay();
                          const padding = Array.from(
                            { length: firstDayIndex },
                            (_, i) => i,
                          );

                          return (
                            <>
                              {padding.map((p) => (
                                <div key={`pad-${p}`}></div>
                              ))}
                              {Array.from(
                                { length: getDaysInMonth(month) },
                                (_, i) => i + 1,
                              ).map((d) => {
                                const isWorking = (
                                  currentUserVig.dias || []
                                ).includes(d);
                                const isSelected = (
                                  currentUserVig.requests || []
                                ).some((r) => r.day === d);
                                const reqStatus = (
                                  currentUserVig.requests || []
                                ).find((r) => r.day === d)?.status;

                                let className =
                                  "h-10 rounded-lg text-sm font-bold flex items-center justify-center transition-all ";

                                if (!isWorking) {
                                  className +=
                                    "bg-slate-800 text-slate-600 cursor-not-allowed";
                                } else if (reqStatus === "APPROVED") {
                                  className +=
                                    "bg-emerald-500 text-white shadow-md ring-2 ring-emerald-300";
                                } else if (reqStatus === "REJECTED") {
                                  className +=
                                    "bg-red-800 text-red-300 cursor-not-allowed decoration-line-through";
                                } else if (isSelected) {
                                  className +=
                                    "bg-brand-600 text-white shadow-md scale-105 ring-2 ring-brand-300 cursor-pointer";
                                } else {
                                  className +=
                                    "bg-slate-700 border border-slate-600 text-slate-300 hover:border-brand-500 hover:text-brand-400 cursor-pointer";
                                }

                                return (
                                  <div
                                    key={d}
                                    onClick={() =>
                                      handleToggleRequest(d, isWorking)
                                    }
                                    className={className}
                                  >
                                    {d}
                                  </div>
                                );
                              })}
                            </>
                          );
                        })()}
                      </div>
                    </div>

                    <div className="mt-8 pt-4 border-t border-slate-700 flex flex-col gap-3">
                      {(currentUserVig.requests || []).length > 0 && (
                        <div className="bg-slate-900/50 rounded-lg p-3 border border-slate-700">
                          <div className="text-xs font-bold text-slate-400 mb-2 uppercase">
                            Resumo do Pedido:
                          </div>
                          {(currentUserVig.requests || []).map((r, i) => (
                            <div
                              key={i}
                              className="flex justify-between items-center text-sm mb-1 last:mb-0"
                            >
                              <span className="font-medium text-slate-300">
                                Dia {r.day}
                              </span>
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded ${r.status === "APPROVED" ? "bg-green-500 text-white" : r.status === "REJECTED" ? "bg-red-500 text-white" : "bg-orange-500 text-white"}`}
                              >
                                {r.status === "PENDING"
                                  ? "AGUARDANDO"
                                  : r.status === "APPROVED"
                                    ? "APROVADO"
                                    : "REJEITADO"}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}

                      <Button
                        onClick={confirmRequests}
                        className={`w-full h-12 text-lg font-bold shadow-lg transition-all ${currentUserVig.requestsLocked ? "bg-gray-600 cursor-not-allowed" : "bg-brand-600 hover:bg-brand-700 hover:-translate-y-1"}`}
                        disabled={!!currentUserVig.requestsLocked}
                      >
                        {currentUserVig.requestsLocked
                          ? "ENVIADO / EM ANÁLISE"
                          : "ENVIAR SOLICITAÇÃO"}
                      </Button>
                      {currentUserVig.requestsLocked && (
                        <p className="text-center text-xs text-slate-500">
                          Para alterar, contate o fiscal.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ) : isFiscal || isMaster ? (
              <div className="max-w-5xl mx-auto">
                <h2 className="text-2xl font-black text-slate-200 mb-6 flex items-center gap-2">
                  <span className="text-3xl">📥</span> Gerenciamento de
                  Solicitações
                </h2>
                {data.filter((v) => v.requests && v.requests.length > 0)
                  .length === 0 ? (
                  <div className="bg-slate-800 rounded-xl shadow-sm p-12 text-center border-2 border-dashed border-slate-700">
                    <div className="text-6xl mb-4 opacity-20">📭</div>
                    <h3 className="text-xl font-bold text-slate-400">
                      Nenhuma solicitação pendente.
                    </h3>
                    <p className="text-slate-500">Tudo tranquilo por aqui.</p>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {data
                      .filter((v) => {
                        if (!v.requests || v.requests.length === 0)
                          return false;
                        // FISCAL FILTER: Show only requests from OWN TEAM. Master sees ALL.
                        if (user?.role === "FISCAL" && currentUserVig) {
                          return (
                            cleanString(v.eq) === cleanString(currentUserVig.eq)
                          );
                        }
                        return true;
                      })
                      .map((vig) => (
                        <Card
                          key={vig.mat}
                          className="p-4 border-l-4 border-l-blue-500 bg-slate-800 border-slate-700"
                        >
                          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                            <div>
                              <h3 className="font-bold text-lg text-slate-200 flex items-center gap-2">
                                {vig.nome} <Badge team={vig.eq} />
                              </h3>
                              <p className="text-xs text-slate-400">
                                {vig.setor} | {vig.campus}
                              </p>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {vig.requests?.map((req) => (
                                <div
                                  key={req.day}
                                  className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${req.status === "APPROVED" ? "bg-emerald-900/50 border-emerald-700" : req.status === "REJECTED" ? "bg-red-900/50 border-red-700" : "bg-slate-700 border-slate-600 shadow-sm"}`}
                                >
                                  <div className="flex flex-col leading-none">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase">
                                      Dia
                                    </span>
                                    <span className="text-xl font-black text-slate-200">
                                      {req.day}
                                    </span>
                                  </div>

                                  {req.status === "PENDING" && (
                                    <div className="flex gap-1 ml-2">
                                      <button
                                        onClick={() =>
                                          handleApproveRequest(vig, req)
                                        }
                                        className="w-8 h-8 rounded bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500 hover:text-white transition-colors flex items-center justify-center"
                                        title="Aprovar"
                                      >
                                        <Icons.Check />
                                      </button>
                                      <button
                                        onClick={() =>
                                          handleRejectRequest(vig, req)
                                        }
                                        className="w-8 h-8 rounded bg-red-500/20 text-red-400 hover:bg-red-500 hover:text-white transition-colors flex items-center justify-center"
                                        title="Rejeitar"
                                      >
                                        <Icons.X />
                                      </button>
                                    </div>
                                  )}

                                  {req.status !== "PENDING" && (
                                    <div
                                      className={`px-2 py-1 rounded text-[10px] font-bold uppercase ml-2 ${req.status === "APPROVED" ? "bg-emerald-500 text-white" : "bg-red-500 text-white"}`}
                                    >
                                      {req.status === "APPROVED"
                                        ? "APROVADO"
                                        : "REJEITADO"}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        </Card>
                      ))}
                  </div>
                )}
              </div>
            ) : null}
          </div>
        )}

        {/* --- INTERVALS VIEW (NOVO) --- */}
        {(view === "intervalos" || view === "cftv") && (
          <div className="flex flex-col h-full bg-slate-900 p-4 overflow-y-auto print:overflow-visible print:h-auto">
            <div className="mb-6 flex flex-col md:flex-row gap-4 items-start md:items-center print:hidden">
              <h2 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
                <span className="text-2xl">
                  {view === "cftv" ? "🎥" : "🍽️"}
                </span>{" "}
                {view === "cftv"
                  ? "Monitoramento CFTV"
                  : "Gestão de Intervalos"}
              </h2>
              <div className="flex gap-2">
                <Select
                  value={intervalCategory}
                  onChange={(e) => setIntervalCategory(e.target.value)}
                  className="w-full md:w-64 bg-slate-800 text-white border-slate-700 shadow-sm"
                >
                  <option value="TODOS">Todas as Áreas</option>
                  <option value="CAMPUS 1">Campus I</option>
                  <option value="CAMPUS 2">Campus II</option>
                  <option value="CAMPUS 3">Campus III</option>
                  <option value="CHÁCARA">Chácara</option>
                  <option value="LABORATÓRIO">Laboratórios</option>
                  <option value="COLETA">Coleta</option>
                </Select>
              </div>
            </div>

            {renderIntervalSummary()}

            {Object.keys(intervalData.grouped).length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-500 border-2 border-dashed border-slate-700 rounded-xl min-h-[300px]">
                <div className="text-4xl mb-2">💤</div>
                <div className="font-bold">
                  Ninguém trabalhando neste horário/filtro.
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 print:block print:w-full">
                {Object.keys(intervalData.grouped)
                  .sort()
                  .map((campus) => {
                    // Filtro Interativo (Clicar nos cards)
                    const filteredVigs = intervalData.grouped[campus].filter(
                      (v) => {
                        if (intervalStatusFilter === "ALL") return true;
                        if (intervalStatusFilter === "ON_BREAK")
                          return v.isOnBreak;
                        if (intervalStatusFilter === "COVERED")
                          return v.isOnBreak && v.isCovered;
                        if (intervalStatusFilter === "RISK")
                          return v.isOnBreak && !v.isCovered;
                        // Specific Risk Filters
                        if (intervalStatusFilter === "RISK_RED")
                          return (
                            v.isOnBreak && !v.isCovered && v.risk === "RED"
                          );
                        if (intervalStatusFilter === "RISK_ORANGE")
                          return (
                            v.isOnBreak && !v.isCovered && v.risk === "ORANGE"
                          );
                        if (intervalStatusFilter === "RISK_YELLOW")
                          return (
                            v.isOnBreak && !v.isCovered && v.risk === "YELLOW"
                          );
                        if (intervalStatusFilter === "RISK_GREEN")
                          return (
                            v.isOnBreak && !v.isCovered && v.risk === "GREEN"
                          );
                        return true;
                      },
                    );

                    if (filteredVigs.length === 0) return null;

                    return (
                      <div
                        key={campus}
                        className="bg-slate-800 rounded-xl shadow-sm border border-slate-700 overflow-hidden break-inside-avoid mb-4 print:shadow-none print:border-2 print:border-black print:mb-6"
                      >
                        <div className="bg-slate-950 px-4 py-2 border-b border-slate-700 font-bold text-sm text-white flex justify-between items-center print:bg-slate-200 print:text-black print:border-black">
                          <span>{campus}</span>
                          <span className="bg-white/20 px-2 py-0.5 rounded-full text-[10px]">
                            {intervalData.grouped[campus].length} Vigilantes
                          </span>
                        </div>
                        <div className="divide-y divide-slate-700 print:divide-black">
                          {filteredVigs.map((vig) => {
                            // Lógica de Cores Visualmente Fortes para Gestão
                            const isCritical =
                              vig.isOnBreak &&
                              !vig.isCovered &&
                              vig.risk === "RED";
                            const isAttention =
                              vig.isOnBreak &&
                              !vig.isCovered &&
                              (vig.risk === "ORANGE" || vig.risk === "YELLOW");
                            const isGreenRisk =
                              vig.isOnBreak &&
                              !vig.isCovered &&
                              vig.risk === "GREEN"; // NEW: Green Risk Logic
                            const isCovered = vig.isOnBreak && vig.isCovered;
                            const isActive = !vig.isOnBreak;

                            let rowClass =
                              "hover:bg-slate-700/50 border-l-4 border-l-slate-600"; // Padrão
                            if (isActive)
                              rowClass =
                                "bg-blue-900/20 border-l-4 border-l-blue-500"; // Azul mais presente
                            if (isCovered)
                              rowClass =
                                "bg-emerald-900/30 border-l-4 border-l-emerald-500"; // Verde bem visível
                            if (isGreenRisk)
                              rowClass =
                                "bg-slate-800/80 border-l-4 border-l-slate-500 opacity-75"; // NEW: Green Risk looks calm/gray
                            if (isAttention)
                              rowClass =
                                "bg-orange-900/30 border-l-4 border-l-orange-500"; // Laranja de atenção
                            if (isCritical)
                              rowClass =
                                "bg-red-900/40 border-l-4 border-l-red-600 animate-pulse-slow"; // Vermelho crítico forte

                            return (
                              <div
                                key={vig.mat}
                                className={`p-3 flex items-start justify-between gap-3 group transition-colors print:border-b print:border-black ${rowClass}`}
                              >
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-0.5">
                                    <div className="font-bold text-slate-200 text-sm truncate">
                                      {vig.nome}
                                    </div>
                                    <Badge team={vig.eq} />
                                    {vig.isOverridden && (
                                      <span
                                        className="text-[9px] bg-purple-100 text-purple-700 px-1 rounded font-bold"
                                        title="Prioridade Manual"
                                      >
                                        AUTO
                                      </span>
                                    )}
                                    {vig.hasTempSchedule && (
                                      <span
                                        className="text-[9px] bg-blue-100 text-blue-700 px-1 rounded font-bold"
                                        title="Horário Temporário"
                                      >
                                        TEMP
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-[11px] text-slate-400 font-medium flex items-center gap-1">
                                    <span>{vig.effectiveSector}</span>
                                    <span className="text-slate-600">•</span>
                                    <span className="font-mono">
                                      {vig.effectiveRefeicao}
                                    </span>
                                  </div>
                                  <div className="mt-1.5 flex gap-2">
                                    <div
                                      className={`text-[10px] font-bold px-2 py-0.5 rounded border inline-flex items-center gap-1 bg-slate-800 border-slate-600 text-slate-300`}
                                    >
                                      {vig.isOnBreak
                                        ? "🍽️ EM INTERVALO"
                                        : "🛡️ NO POSTO"}
                                    </div>
                                    {/* NEW: Logic for Uncovered Badges */}
                                    {vig.isOnBreak && !vig.isCovered && (
                                      <>
                                        {vig.risk === "GREEN" && (
                                          <div className="text-[10px] font-bold px-2 py-0.5 rounded border inline-flex items-center gap-1 bg-slate-700 border-slate-500 text-slate-300">
                                            DESCOBERTO (RISCO BAIXO)
                                          </div>
                                        )}
                                        {vig.risk === "YELLOW" && (
                                          <div className="text-[10px] font-bold px-2 py-0.5 rounded border inline-flex items-center gap-1 bg-yellow-900/50 border-yellow-500 text-yellow-200">
                                            🎥 MONITORAR (RISCO MÉDIO)
                                          </div>
                                        )}
                                        {vig.risk === "ORANGE" && (
                                          <div className="text-[10px] font-bold px-2 py-0.5 rounded border inline-flex items-center gap-1 bg-orange-900/50 border-orange-500 text-orange-200 animate-pulse">
                                            🎥 MONITORAR (RISCO ALTO)
                                          </div>
                                        )}
                                        {vig.risk === "RED" && (
                                          <div className="text-[10px] font-bold px-2 py-0.5 rounded border inline-flex items-center gap-1 bg-red-900/50 border-red-500 text-red-200 animate-pulse">
                                            🎥 MONITORAR (RISCO CRÍTICO)
                                          </div>
                                        )}
                                      </>
                                    )}
                                    {vig.isCovered && (
                                      <div className="text-[10px] font-bold px-2 py-0.5 rounded border bg-emerald-900/50 text-emerald-200 border-emerald-500 inline-flex items-center gap-1">
                                        ✅ COBERTO:{" "}
                                        {vig.coveredBy?.split(" ")[0]}
                                      </div>
                                    )}
                                  </div>
                                </div>

                                {canManageIntervals && view !== "cftv" && (
                                  <div className="flex flex-col gap-1 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity print:hidden">
                                    {vig.isOnBreak && !vig.isCovered ? (
                                      <button
                                        onClick={() => {
                                          setIntervalEditVig(vig);
                                          setIntervalCoverageSearch("");
                                          setIntervalCoverageModalOpen(true);
                                        }}
                                        className="bg-emerald-500 hover:bg-emerald-600 text-white p-1.5 rounded shadow-sm text-[10px] font-bold uppercase tracking-wide"
                                      >
                                        Cobrir
                                      </button>
                                    ) : vig.isCovered ? (
                                      <button
                                        onClick={() =>
                                          handleRemoveIntervalCoverage(vig)
                                        }
                                        className="bg-red-100 hover:bg-red-200 text-red-600 p-1.5 rounded shadow-sm text-[10px] font-bold uppercase tracking-wide"
                                      >
                                        Liberar
                                      </button>
                                    ) : (
                                      <div className="h-6"></div>
                                    )}
                                    <div className="flex gap-1">
                                      <button
                                        onClick={() =>
                                          handleOpenTempEditor(vig)
                                        }
                                        className="bg-slate-200 hover:bg-slate-300 text-slate-600 p-1.5 rounded text-[10px]"
                                        title="Editar Horário Temporário"
                                      >
                                        <Icons.Clock />
                                      </button>
                                      <button
                                        onClick={() =>
                                          openPriorityModal(vig.setor)
                                        }
                                        className="bg-slate-200 hover:bg-slate-300 text-slate-600 p-1.5 rounded text-[10px]"
                                        title="Configurar Prioridade"
                                      >
                                        <Icons.Edit />
                                      </button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        )}
      </main>

      {/* --- MODALS --- */}

      {/* New Vigilante Modal */}
      <Modal
        title="Novo Vigilante"
        isOpen={isNewVigModalOpen}
        onClose={() => setIsNewVigModalOpen(false)}
      >
        <div className="space-y-4">
          <Input
            placeholder="Nome Completo"
            value={newVigForm.nome}
            onChange={(e) =>
              setNewVigForm({ ...newVigForm, nome: e.target.value })
            }
            className="bg-slate-700 text-white border-slate-600"
          />
          <Input
            placeholder="Matrícula"
            value={newVigForm.mat}
            onChange={(e) =>
              setNewVigForm({ ...newVigForm, mat: e.target.value })
            }
            className="bg-slate-700 text-white border-slate-600"
          />
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">
              Equipe Inicial:
            </label>
            <div className="flex gap-2">
              {TEAM_OPTIONS.filter((t) => t !== "ADM").map((t) => (
                <button
                  key={t}
                  onClick={() => setNewVigForm({ ...newVigForm, eq: t })}
                  className={`flex-1 py-2 rounded border text-sm font-bold ${newVigForm.eq === t ? "bg-brand-600 text-white border-brand-700" : "bg-white text-slate-600 hover:bg-slate-50"}`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
          <Button onClick={handleCreateVigilante} className="w-full mt-4">
            CRIAR CADASTRO
          </Button>
        </div>
      </Modal>

      {/* Smart Conflict Resolution Modal */}
      <Modal
        title="Sugestões Inteligentes"
        isOpen={isConflictModalOpen}
        onClose={() => {
          setIsConflictModalOpen(false);
          setProposedData(null);
        }}
      >
        <div className="space-y-4">
          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <h4 className="font-bold text-green-800 mb-1">
              ✅ Sugestão Gerada
            </h4>
            <p className="text-sm text-green-700">
              O sistema calculou folgas automaticamente para a equipe visível.
              Se aceitar, as folgas serão aplicadas.
            </p>
          </div>

          {suggestionConflicts.length > 0 ? (
            <div className="bg-red-50 p-4 rounded-lg border border-red-200 max-h-60 overflow-y-auto">
              <h4 className="font-bold text-red-800 mb-2 flex items-center gap-2">
                ⚠️ Alertas de Efetivo Baixo na Sugestão
              </h4>
              <div className="space-y-2">
                {suggestionConflicts.map((c, i) => (
                  <div
                    key={i}
                    className="text-xs bg-white p-2 rounded border border-red-100 shadow-sm flex items-center justify-between"
                  >
                    <span className="font-bold text-red-700">
                      Dia {c.dia} • {c.campus} (Eq {c.equipe})
                    </span>
                    <span className="text-red-500">{c.msg}</span>
                  </div>
                ))}
              </div>
              <p className="text-xs text-red-600 mt-2 font-bold text-center">
                Deseja aplicar mesmo assim?
              </p>
            </div>
          ) : (
            <div className="bg-blue-50 p-3 rounded text-sm text-blue-700 text-center font-bold">
              Nenhum conflito crítico detectado na sugestão!
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <Button
              variant="secondary"
              onClick={() => {
                setIsConflictModalOpen(false);
                setProposedData(null);
              }}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button onClick={confirmSmartSuggestions} className="flex-1">
              APLICAR SUGESTÃO
            </Button>
          </div>
        </div>
      </Modal>

      {/* Import Modal */}
      <Modal
        title="Importar Dados"
        isOpen={isImportModalOpen}
        onClose={() => {
          setIsImportModalOpen(false);
          setImportedData(null);
        }}
      >
        <div className="space-y-4 text-center">
          <div className="text-4xl">📂</div>
          <p className="text-slate-600">
            Arquivo carregado com sucesso! Como deseja prosseguir?
          </p>
          <div className="grid grid-cols-1 gap-3">
            <Button
              onClick={() => confirmImport("replace")}
              className="w-full bg-red-600 hover:bg-red-700 text-white"
            >
              SUBSTITUIR TUDO (Restaurar Backup)
            </Button>
            <Button
              onClick={() => confirmImport("merge")}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            >
              MESCLAR (Atualizar existentes)
            </Button>
          </div>
        </div>
      </Modal>

      {/* Logs Modal */}
      <Modal
        title="Histórico de Ações"
        isOpen={isLogModalOpen}
        onClose={() => setIsLogModalOpen(false)}
      >
        <div className="space-y-3">
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              placeholder="Filtrar por nome..."
              className="flex-1 border rounded px-2 py-1 text-sm bg-slate-700 text-white border-slate-600"
              value={logFilterSearch}
              onChange={(e) => setLogFilterSearch(e.target.value)}
            />
            {/* Removed date filter for simplicity or fix typing issues if needed, kept text search */}
          </div>
          <div className="max-h-[60vh] overflow-y-auto space-y-2 pr-1">
            {logs
              .filter(
                (l) =>
                  l.details
                    .toLowerCase()
                    .includes(logFilterSearch.toLowerCase()) ||
                  l.user.toLowerCase().includes(logFilterSearch.toLowerCase()),
              )
              .map((log) => (
                <div
                  key={log.id}
                  className="text-xs p-3 rounded-lg border border-slate-100 bg-slate-50 hover:bg-white hover:shadow-sm transition-all"
                >
                  <div className="flex justify-between text-slate-400 mb-1">
                    <span>
                      {new Date(log.timestamp).toLocaleString("pt-BR", {
                        hour12: false,
                      })}
                    </span>
                    <span className="font-bold text-slate-600">{log.user}</span>
                  </div>
                  <div className="font-bold text-slate-800">{log.action}</div>
                  <div className="text-slate-600">
                    {log.details}{" "}
                    {log.targetName && (
                      <span className="font-bold text-blue-600">
                        ({log.targetName})
                      </span>
                    )}
                  </div>
                </div>
              ))}
            {logs.length === 0 && (
              <div className="text-center text-slate-400 py-4">
                Nenhum registro encontrado.
              </div>
            )}
          </div>
        </div>
      </Modal>

      {/* Coverage Modal (Generic) */}
      <Modal
        title={`Cobertura: ${coverageTarget?.campus}`}
        isOpen={isCoverageModalOpen}
        onClose={() => setIsCoverageModalOpen(false)}
      >
        <div className="space-y-4">
          <Input
            placeholder="Buscar vigilante..."
            value={coverageSearch}
            onChange={(e) => setCoverageSearch(e.target.value)}
            autoFocus
            className="bg-slate-700 text-white border-slate-600"
          />
          <div className="max-h-60 overflow-y-auto border rounded divide-y">
            {data
              .filter((v) => {
                const isCoringa = CORINGA_MATS.includes(v.mat);
                // 1. Não mostrar afastados
                if (v.campus === "AFASTADOS") return false;

                // 2. Não mostrar quem está de férias EXATAMENTE neste dia
                const targetDay = coverageTarget?.dia || -1;
                if (
                  v.vacation &&
                  targetDay >= v.vacation.start &&
                  targetDay <= v.vacation.end
                )
                  return false;

                // 3. FILTRO DE EQUIPE (Novo): Mostrar apenas vigilantes da MESMA EQUIPE do conflito
                // para permitir remanejamento interno, A MENOS que seja um CORINGA.
                if (
                  !isCoringa &&
                  coverageTarget?.equipe &&
                  cleanString(v.eq) !== cleanString(coverageTarget.equipe)
                )
                  return false;

                return true;
              })
              .filter((v) =>
                v.nome.toUpperCase().includes(coverageSearch.toUpperCase()),
              )
              .sort((a, b) => a.nome.localeCompare(b.nome))
              .map((v) => {
                const status = checkAvailability(v, coverageTarget?.dia || -1);

                // FIX: Não mostrar quem está de folga (EXTRA) porque o cliente não trabalha com horas extras.
                // Apenas mostrar quem está TRABALHANDO (REMANEJAMENTO) ou ACUMULO.
                if ((status.type as string) === "EXTRA") return null;

                return (
                  <div
                    key={v.mat}
                    className="p-2 flex justify-between items-center hover:bg-slate-50"
                  >
                    <div>
                      <div className="font-bold text-sm">{v.nome}</div>
                      <div className="text-[10px] text-slate-500">
                        {v.campus} • Eq {v.eq}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {status.available ? (
                        <div className="flex gap-1">
                          {/* Mostra botão apropriado com base no status real */}
                          {status.type === "REMANEJAMENTO" && (
                            <button
                              onClick={() => applyCoverage(v, "REMANEJAMENTO")}
                              className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded text-[10px] font-bold hover:bg-blue-200 uppercase tracking-wide"
                            >
                              REMANEJAR
                            </button>
                          )}
                          {/* Botão EXTRA removido/oculto logicamente pelo if acima, mas mantido caso a logica mude */}
                          {status.type === "EXTRA" && (
                            <button
                              onClick={() => applyCoverage(v, "EXTRA")}
                              className="px-3 py-1.5 bg-green-100 text-green-700 rounded text-[10px] font-bold hover:bg-green-200 uppercase tracking-wide"
                            >
                              EXTRA
                            </button>
                          )}
                          {status.type === "ACUMULO" && (
                            <div className="flex gap-1">
                              <button
                                onClick={() =>
                                  applyCoverage(v, "REMANEJAMENTO")
                                }
                                className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-[10px] font-bold hover:bg-purple-200"
                              >
                                REMANEJAR
                              </button>
                            </div>
                          )}
                        </div>
                      ) : (
                        <span
                          className={`text-[10px] px-2 py-1 rounded ${status.color}`}
                        >
                          {status.label}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      </Modal>

      {/* Interval Coverage Modal */}
      <Modal
        title={`Cobrir Intervalo: ${intervalEditVig?.nome}`}
        isOpen={intervalCoverageModalOpen}
        onClose={() => setIntervalCoverageModalOpen(false)}
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-500 mb-2">
            Selecione quem irá cobrir este intervalo. Apenas vigilantes
            disponíveis (sem intervalo neste horário) serão listados.
          </p>
          <Input
            placeholder="Buscar disponível..."
            value={intervalCoverageSearch}
            onChange={(e) => setIntervalCoverageSearch(e.target.value)}
            autoFocus
            className="bg-slate-700 text-white border-slate-600"
          />
          <div className="max-h-60 overflow-y-auto border rounded divide-y">
            {data
              .filter((v) => {
                // Basic checks
                if (v.mat === intervalEditVig?.mat) return false;
                if (v.campus === "AFASTADOS") return false;

                // Team Visibility Check
                if (user?.role === "FISCAL" && currentUserVig) {
                  const myEq = cleanString(currentUserVig.eq);
                  const visibleTeams = getVisibleTeams(myEq);
                  return visibleTeams.includes(cleanString(v.eq));
                }
                // Master sees all
                return true;
              })
              .filter((v) =>
                v.nome
                  .toUpperCase()
                  .includes(intervalCoverageSearch.toUpperCase()),
              )
              .map((v) => {
                const dayNum = filterDay
                  ? parseInt(filterDay)
                  : new Date().getDate();
                const status = getVigilanteStatus(v, dayNum, filterTime);
                // Só pode cobrir se estiver trabalhando (active) e NÃO estiver em intervalo
                if (!status.active || status.status === "INTERVALO")
                  return null;

                return (
                  <div
                    key={v.mat}
                    className="p-2 flex justify-between items-center hover:bg-slate-50"
                  >
                    <div>
                      <div className="font-bold text-sm">{v.nome}</div>
                      <div className="text-[10px] text-slate-500">
                        {v.setor}
                      </div>
                    </div>
                    <button
                      onClick={() => handleApplyIntervalCoverage(v)}
                      className="px-3 py-1 bg-emerald-500 hover:bg-emerald-600 text-white rounded text-xs font-bold"
                    >
                      SELECIONAR
                    </button>
                  </div>
                );
              })
              .filter(Boolean)}
            {data.filter(
              (v) =>
                v.mat !== intervalEditVig?.mat &&
                v.campus !== "AFASTADOS" &&
                getVigilanteStatus(
                  v,
                  filterDay ? parseInt(filterDay) : new Date().getDate(),
                  filterTime,
                ).active &&
                getVigilanteStatus(
                  v,
                  filterDay ? parseInt(filterDay) : new Date().getDate(),
                  filterTime,
                ).status !== "INTERVALO",
            ).length === 0 && (
              <div className="p-4 text-center text-slate-400 text-xs">
                Nenhum vigilante disponível encontrado.
              </div>
            )}
          </div>
        </div>
      </Modal>

      {/* Temp Editor Modal */}
      <Modal
        title="Horário Temporário (Hoje)"
        isOpen={isTempEditorOpen}
        onClose={() => setIsTempEditorOpen(false)}
      >
        <div className="space-y-4">
          <div className="bg-blue-50 p-3 rounded text-xs text-blue-800">
            Alterando horário de <b>{tempEditVig?.nome}</b> apenas para o dia{" "}
            <b>{filterDay}</b>.
          </div>
          <div>
            <label className="text-xs font-bold block mb-1">
              Novo Horário:{" "}
              <span className="text-slate-400">(Formato 24h)</span>
            </label>
            <div className="flex gap-2">
              <input
                type="time"
                className="border rounded p-2 w-full bg-slate-700 text-white border-slate-600"
                value={tempTimeInputs.hStart}
                onChange={(e) =>
                  setTempTimeInputs({
                    ...tempTimeInputs,
                    hStart: e.target.value,
                  })
                }
              />
              <input
                type="time"
                className="border rounded p-2 w-full bg-slate-700 text-white border-slate-600"
                value={tempTimeInputs.hEnd}
                onChange={(e) =>
                  setTempTimeInputs({ ...tempTimeInputs, hEnd: e.target.value })
                }
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-bold block mb-1">
              Novo Intervalo (Início):{" "}
              <span className="text-slate-400">(Formato 24h)</span>
            </label>
            <div className="flex gap-2">
              <input
                type="time"
                className="border rounded p-2 w-full bg-slate-700 text-white border-slate-600"
                value={tempTimeInputs.rStart}
                onChange={(e) =>
                  setTempTimeInputs({
                    ...tempTimeInputs,
                    rStart: e.target.value,
                  })
                }
              />
            </div>
          </div>
          <Button onClick={handleSaveTempSchedule} className="w-full mt-2">
            SALVAR ALTERAÇÃO TEMPORÁRIA
          </Button>
        </div>
      </Modal>

      {/* Priority Modal */}
      <Modal
        title="Prioridade de Setor"
        isOpen={isPriorityModalOpen}
        onClose={() => setIsPriorityModalOpen(false)}
      >
        <div className="space-y-4 text-center">
          <p className="text-sm font-bold text-slate-700">
            Defina a prioridade de cobertura para: <br />
            <span className="text-brand-600 text-lg">
              {targetSectorForPriority}
            </span>
          </p>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => savePriorityOverride("RED")}
              className="p-3 bg-red-100 text-red-800 rounded-lg font-bold hover:bg-red-200 border border-red-200"
            >
              🔴 CRÍTICA
            </button>
            <button
              onClick={() => savePriorityOverride("ORANGE")}
              className="p-3 bg-orange-100 text-orange-800 rounded-lg font-bold hover:bg-orange-200 border border-orange-200"
            >
              🟠 ALTA
            </button>
            <button
              onClick={() => savePriorityOverride("YELLOW")}
              className="p-3 bg-yellow-100 text-yellow-800 rounded-lg font-bold hover:bg-yellow-200 border border-yellow-200"
            >
              🟡 MÉDIA
            </button>
            <button
              onClick={() => savePriorityOverride("GREEN")}
              className="p-3 bg-green-100 text-green-800 rounded-lg font-bold hover:bg-green-200 border border-green-200"
            >
              🟢 BAIXA
            </button>
          </div>
        </div>
      </Modal>

      {/* Password Modal */}
      <Modal
        title="Alterar Senha"
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
      >
        <form onSubmit={handleChangeOwnPassword} className="space-y-4">
          <p className="text-sm text-slate-500">
            Digite sua nova senha abaixo.
          </p>
          <Input
            type="password"
            placeholder="Nova Senha"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            autoFocus
          />
          <Button type="submit" className="w-full">
            SALVAR NOVA SENHA
          </Button>
        </form>
      </Modal>

      {/* Help Modal */}
      <Modal
        title="Ajuda do Sistema"
        isOpen={isHelpModalOpen}
        onClose={() => setIsHelpModalOpen(false)}
      >
        <div className="space-y-4 max-h-[60vh] overflow-y-auto text-sm text-slate-300">
          <div className="border-b border-slate-700 pb-3">
            <h4 className="font-bold text-blue-400 flex items-center gap-2 mb-1">
              <span className="text-lg">👤</span> Guia do Vigilante
            </h4>
            <ul className="list-disc pl-5 space-y-1 text-xs text-slate-400">
              <li>
                <b>Minha Escala:</b> Na tela inicial, seus dias de serviço
                aparecem destacados. Dias com &quot;Folga Extra&quot; ou
                &quot;Férias&quot; também são indicados.
              </li>
              <li>
                <b>Solicitações:</b> Acesse a aba &quot;SOLICITAÇÕES&quot; para
                pedir até 2 dias de folga no mês (sujeito a aprovação).
              </li>
              <li>
                <b>Visualização:</b> Seus horários e postos estão sempre
                atualizados aqui.
              </li>
            </ul>
          </div>

          {isFiscal && (
            <div className="border-b border-slate-700 pb-3">
              <h4 className="font-bold text-emerald-400 flex items-center gap-2 mb-1">
                <span className="text-lg">🛡️</span> Guia do Fiscal
              </h4>
              <ul className="list-disc pl-5 space-y-1 text-xs text-slate-400">
                <li>
                  <b>Lançador (Edição):</b> Use para alterar horários, postos e
                  dias da equipe. Clique em um nome na lista para abrir o
                  editor.
                </li>
                <li>
                  <b>Gestão de Intervalos:</b> Acompanhe em tempo real quem está
                  em pausa. O sistema alerta (Laranja/Vermelho) se um setor
                  ficar descoberto.
                </li>
                <li>
                  <b>Simulação:</b> Crie rascunhos da escala futura ou teste
                  trocas sem afetar a escala oficial. Clique em
                  &quot;PUBLICAR&quot; para salvar.
                </li>
                <li>
                  <b>Solicitações:</b> Gerencie os pedidos de folga da equipe na
                  aba de solicitações.
                </li>
              </ul>
            </div>
          )}

          {isMaster && (
            <div className="border-b border-slate-700 pb-3">
              <h4 className="font-bold text-purple-400 flex items-center gap-2 mb-1">
                <span className="text-lg">👑</span> Guia Master
              </h4>
              <ul className="list-disc pl-5 space-y-1 text-xs text-slate-400">
                <li>
                  <b>Gestão de Usuários:</b> Crie contas, resete senhas e defina
                  permissões de acesso através do botão dourado
                  &quot;USUÁRIOS&quot;.
                </li>
                <li>
                  <b>Auditoria:</b> O botão &quot;LOGS&quot; mostra o histórico
                  de todas as ações realizadas no sistema.
                </li>
                <li>
                  <b>Backup:</b> Use &quot;BAIXAR&quot; para salvar uma cópia de
                  segurança dos dados e &quot;IMPORTAR&quot; para restaurar.
                </li>
              </ul>
            </div>
          )}

          {isFiscal && (
            <div className="bg-yellow-900/20 p-3 rounded-lg border border-yellow-800 text-xs text-yellow-200">
              <b>Dica Pro:</b> Sempre verifique se você está no modo{" "}
              <i>Simulação</i> (barra amarela) antes de fazer grandes alterações
              de planejamento.
            </div>
          )}

          <p className="text-xs text-slate-500 text-center mt-2">
            Versão 3.5.4 (Pro) - Unoeste Segurança
          </p>
        </div>
      </Modal>

      {/* User Management Modal */}
      <Modal
        title="Gestão de Usuários"
        isOpen={isUserMgmtModalOpen}
        onClose={() => setIsUserMgmtModalOpen(false)}
      >
        <div className="space-y-6">
          {/* Form Create/Edit */}
          <div className="bg-slate-800 p-4 rounded-lg border border-slate-700 space-y-3">
            <h4 className="font-bold text-sm text-slate-300 uppercase">
              {editingUser ? "Editar Usuário" : "Novo Usuário"}
            </h4>
            <div className="flex gap-2">
              <Input
                placeholder="Matrícula"
                value={formUserMat}
                onChange={(e) => setFormUserMat(e.target.value)}
                className="w-1/3 bg-slate-700 text-white border-slate-600"
              />
              <Input
                placeholder="Nome Completo"
                value={formUserNome}
                onChange={(e) => setFormUserNome(e.target.value)}
                className="flex-1 bg-slate-700 text-white border-slate-600"
              />
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs text-slate-300">
              <label className="flex items-center gap-2 cursor-pointer bg-slate-700 p-2 rounded border border-slate-600 hover:bg-slate-600">
                <input
                  type="checkbox"
                  checked={formPermissions.canManageIntervals}
                  onChange={() =>
                    setFormPermissions({
                      ...formPermissions,
                      canManageIntervals: !formPermissions.canManageIntervals,
                    })
                  }
                />
                Gerenciar Intervalos
              </label>
              <label className="flex items-center gap-2 cursor-pointer bg-slate-700 p-2 rounded border border-slate-600 hover:bg-slate-600">
                <input
                  type="checkbox"
                  checked={formPermissions.canViewLogs}
                  onChange={() =>
                    setFormPermissions({
                      ...formPermissions,
                      canViewLogs: !formPermissions.canViewLogs,
                    })
                  }
                />
                Ver Logs
              </label>
              <label className="flex items-center gap-2 cursor-pointer bg-slate-700 p-2 rounded border border-slate-600 hover:bg-slate-600">
                <input
                  type="checkbox"
                  checked={formPermissions.canPrint}
                  onChange={() =>
                    setFormPermissions({
                      ...formPermissions,
                      canPrint: !formPermissions.canPrint,
                    })
                  }
                />
                Imprimir
              </label>
              <label className="flex items-center gap-2 cursor-pointer bg-slate-700 p-2 rounded border border-slate-600 hover:bg-slate-600">
                <input
                  type="checkbox"
                  checked={formPermissions.canSimulate}
                  onChange={() =>
                    setFormPermissions({
                      ...formPermissions,
                      canSimulate: !formPermissions.canSimulate,
                    })
                  }
                />
                Simular Escala
              </label>
              <label className="flex items-center gap-2 cursor-pointer bg-slate-700 p-2 rounded border border-slate-600 hover:bg-slate-600">
                <input
                  type="checkbox"
                  checked={
                    (formPermissions as { canViewCFTV?: boolean }).canViewCFTV
                  }
                  onChange={() =>
                    setFormPermissions({
                      ...formPermissions,
                      canViewCFTV: !(
                        formPermissions as { canViewCFTV?: boolean }
                      ).canViewCFTV,
                    } as any)
                  }
                />
                Acesso CFTV (Monitoramento)
              </label>
            </div>

            <div className="flex gap-2">
              {editingUser && (
                <Button
                  variant="secondary"
                  onClick={cancelEditUser}
                  className="flex-1"
                >
                  Cancelar
                </Button>
              )}
              <Button
                onClick={editingUser ? handleSaveEditUser : handleCreateUser}
                className="flex-1"
              >
                {editingUser ? "SALVAR ALTERAÇÕES" : "CRIAR USUÁRIO"}
              </Button>
            </div>
          </div>

          {/* List */}
          <div className="space-y-2">
            <Input
              placeholder="Buscar usuário..."
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
              className="bg-slate-700 text-white border-slate-600"
            />
            <div className="max-h-60 overflow-y-auto border border-slate-700 rounded divide-y divide-slate-700 bg-slate-900">
              {allUsers
                .filter(
                  (u) =>
                    u.nome.includes(userSearch.toUpperCase()) ||
                    u.mat.includes(userSearch),
                )
                .map((u) => (
                  <div
                    key={u.mat}
                    className="p-3 flex justify-between items-center hover:bg-slate-800 transition-colors"
                  >
                    <div>
                      <div className="font-bold text-sm text-slate-200">
                        {u.nome}{" "}
                        {u.mat === user?.mat && (
                          <span className="text-[10px] text-blue-400">
                            (Você)
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {u.mat} • {u.role}
                      </div>
                      <div className="flex gap-1 mt-1">
                        {u.canManageIntervals && (
                          <span className="text-[9px] bg-blue-900/50 text-blue-300 px-1 rounded border border-blue-800">
                            Intervalos
                          </span>
                        )}
                        {u.canViewLogs && (
                          <span className="text-[9px] bg-slate-800 text-slate-400 px-1 rounded border border-slate-700">
                            Logs
                          </span>
                        )}
                        {(u as { canViewCFTV?: boolean }).canViewCFTV && (
                          <span className="text-[9px] bg-slate-700 text-white px-1 rounded border border-slate-600">
                            CFTV
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      {u.mat !== SUPER_ADMIN_MAT && (
                        <>
                          <button
                            onClick={() => handleToggleRole(u)}
                            className="p-1.5 text-[10px] font-bold border border-slate-600 rounded hover:bg-slate-700 text-slate-300"
                            title="Mudar Cargo"
                          >
                            👑
                          </button>
                          <button
                            onClick={() => handleResetPassword(u)}
                            className="p-1.5 text-[10px] font-bold border border-slate-600 rounded hover:bg-slate-700 text-slate-300"
                            title="Resetar Senha"
                          >
                            🔑
                          </button>
                          <button
                            onClick={() => startEditUser(u)}
                            className="p-1.5 text-[10px] font-bold border border-slate-600 rounded hover:bg-slate-700 text-slate-300"
                            title="Editar Permissões"
                          >
                            ✏️
                          </button>
                          <button
                            onClick={() => handleDeleteUser(u)}
                            className="p-1.5 text-[10px] font-bold border border-red-900 rounded hover:bg-red-900/50 text-red-400"
                            title="Remover"
                          >
                            🗑️
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </Modal>

      {/* Toast Container */}
      {toast && (
        <div
          className={`fixed bottom-4 right-4 z-50 px-6 py-3 rounded-lg shadow-2xl font-bold text-white flex items-center gap-3 animate-slide-up ${toast.type === "success" ? "bg-emerald-600" : toast.type === "error" ? "bg-red-600" : "bg-blue-600"}`}
        >
          <span>
            {toast.type === "success"
              ? "✅"
              : toast.type === "error"
                ? "❌"
                : "ℹ️"}
          </span>
          {toast.msg}
        </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AppContent />
    </ErrorBoundary>
  );
}
