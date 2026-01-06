import React from "react";
import { User, Conflict } from "../../types";
import { Button, Icons, UnoesteSecurityLogo } from "../ui";
import { TEAM_OPTIONS } from "../../constants";

interface AppHeaderProps {
  conflicts?: Conflict[];
  setIsPresetManagerOpen: (v: boolean) => void;
  user: User;
  month: number;
  setMonth: (m: number) => void;
  monthOptions: { value: number; label: string }[];
  isFutureMonth: boolean;
  viewingDraft: boolean;
  isSimulationMode: boolean;
  setIsSimulationMode: (v: boolean) => void;
  handleSaveDraft: () => void;
  commitSimulation: () => void;
  handleExitSimulation: () => void;
  handleLogout: () => void;
  setIsHelpModalOpen: (v: boolean) => void;
  setIsPasswordModalOpen: (v: boolean) => void;
  canEnterSimulation: boolean;
  canPrint: boolean;
  isMaster: boolean;
  canViewLogs: boolean;
  handleExport: () => void;
  setIsLogModalOpen: (v: boolean) => void;
  setIsUserMgmtModalOpen: (v: boolean) => void;
  fileInputRef: React.RefObject<HTMLInputElement>;
  teamsStatus: Record<
    string,
    { ready: boolean; percent: number; label: string }
  >;
  handleSendToSupervision: () => void;
  handleAddNextYear: () => void;
  isSilentUpdating: boolean;
}

const AppHeaderComponent: React.FC<AppHeaderProps> = (props) => {
  const {
    user,
    month,
    setMonth,
    monthOptions,
    handleAddNextYear,
    isFutureMonth,
    viewingDraft,
    isSimulationMode,
    setIsSimulationMode,
    handleSaveDraft,
    commitSimulation,
    handleExitSimulation,
    handleLogout,
    setIsHelpModalOpen,
    setIsPasswordModalOpen,
    canEnterSimulation,
    canPrint,
    isMaster,
    canViewLogs,
    handleExport,
    setIsLogModalOpen,
    setIsUserMgmtModalOpen,
    fileInputRef,
    teamsStatus,
    handleSendToSupervision,
    isSilentUpdating,
    setIsPresetManagerOpen,
    conflicts = [],
  } = props;

  return (
    <header
      className={`${isFutureMonth || viewingDraft ? "bg-red-900 border-b-4 border-red-700" : "bg-brand-800 border-b-4 border-gold-500"} text-white shadow-md z-20 print:hidden shrink-0 transition-colors duration-500`}
    >
      <div className="max-w-full mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <UnoesteSecurityLogo className="w-8 h-10 sm:w-10 sm:h-12" />
          <div className="leading-tight hidden sm:block">
            <div
              className={`text-[10px] font-bold tracking-wider uppercase ${isFutureMonth || viewingDraft ? "text-red-200" : "text-gold-400"}`}
            >
              VIGILÂNCIA UNIVERSITÁRIA
            </div>
          </div>
          <div className="leading-tight sm:hidden block">
            <h1 className="font-bold text-lg tracking-tight text-white">
              ESCALA PRO
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {isSilentUpdating && (
            <div className="text-xs font-bold text-cyan-300 animate-pulse flex items-center gap-1">
              <Icons.RefreshCw className="w-3 h-3 animate-spin-slow" />
              <span>Atualizando...</span>
            </div>
          )}
          {/* BARRA DE PROGRESSO (TERMÔMETRO) - Sempre visível para Master */}
          {isMaster && (
            <div className="hidden xl:flex items-center gap-2 bg-white/10 px-3 h-8 rounded-lg border border-white/30 mr-2 backdrop-blur-sm shadow-sm">
              <span
                className={`text-[10px] uppercase font-bold tracking-wider ${isFutureMonth || viewingDraft ? "text-red-200" : "text-gold-200"}`}
              >
                Prog:
              </span>
              {TEAM_OPTIONS.filter(
                (t) => t !== "ADM" && t !== "SUPERVISOR",
              ).map((t) => {
                const st = teamsStatus[t];
                if (!st) return null; // FIX: Não renderizar se o status da equipe não existir

                const colorClass = st.ready
                  ? "bg-green-500 text-white shadow-[0_0_10px_rgba(34,197,94,0.6)]"
                  : st.percent > 90
                    ? "bg-orange-500 text-white animate-pulse"
                    : st.percent > 40
                      ? "bg-yellow-500 text-black"
                      : "bg-white/10 text-slate-300";

                return (
                  <div
                    key={t}
                    className="flex flex-col items-center group cursor-help relative"
                  >
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded min-w-[35px] text-center transition-all ${colorClass}`}
                    >
                      {t}: {st.percent}%
                    </span>
                    <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-black text-white text-[9px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap pointer-events-none z-50">
                      {st.ready
                        ? "✅ Finalizado e Enviado"
                        : st.percent >= 99
                          ? "⚠️ Aguardando Envio do Fiscal"
                          : `Em andamento: ${st.label}`}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {isSimulationMode ? (
            <div className="flex items-center gap-2 bg-red-800 text-white px-3 py-1.5 rounded-lg shadow-lg border border-red-700">
              <span className="font-black text-xs uppercase hidden lg:inline mr-1 text-yellow-400 animate-pulse">
                {isFutureMonth ? "🚧 PLANEJAMENTO (RASCUNHO):" : "✏️ EDITANDO:"}
              </span>
              <Button
                className="!py-2 !px-3 text-[10px] font-bold uppercase tracking-wide border border-red-600 bg-red-700 hover:!bg-red-600 text-white"
                onClick={handleSaveDraft}
                title="Salvar sem publicar para o usuário"
              >
                <Icons.Cloud /> <span>SALVAR RASCUNHO</span>
              </Button>
              {user.role === "FISCAL" && (
                <Button
                  className="!py-2 !px-3 text-[10px] font-bold uppercase tracking-wide border-none flex items-center gap-2 shadow-xl transition-all active:scale-95 !bg-blue-600 hover:!bg-blue-700 text-white"
                  onClick={handleSendToSupervision}
                >
                  <span>📤 ENVIAR P/ SUPERVISÃO</span>
                </Button>
              )}
              {isMaster && (
                <Button
                  className="!py-2 !px-3 text-[10px] font-bold uppercase tracking-wide border-none flex items-center gap-2 shadow-xl transition-all active:scale-95 !bg-brand-600 hover:!bg-brand-700 text-white"
                  onClick={commitSimulation}
                >
                  <Icons.Check /> <span>PUBLICAR OFICIAL</span>
                </Button>
              )}
              <Button
                variant="danger"
                className="!py-2 !px-3 text-[10px] font-bold uppercase"
                onClick={handleExitSimulation}
                title="Sair"
              >
                <Icons.X />
              </Button>
            </div>
          ) : (
            <div className="flex gap-1 sm:gap-2">
              <Button
                className="!bg-white/10 !text-white border !border-white/30 hover:!bg-white/20 shadow-sm backdrop-blur-sm text-[10px] h-8 px-2 font-bold uppercase tracking-wide"
                onClick={() => setIsHelpModalOpen(true)}
                title="Ajuda"
              >
                <span className="hidden md:inline mr-1">Ajuda</span>
                <span>❓</span>
              </Button>
              {canEnterSimulation && (
                <Button
                  className="!bg-white/10 !text-white border !border-white/30 hover:!bg-white/20 shadow-sm backdrop-blur-sm text-[10px] h-8 px-2 font-bold uppercase tracking-wide"
                  onClick={() => setIsSimulationMode(true)}
                  title="Modo Edição"
                >
                  <Icons.Edit />{" "}
                  <span className="hidden md:inline ml-1">EDITAR</span>
                </Button>
              )}
              {canPrint && (
                <Button
                  className="!bg-white/10 !text-white border !border-white/30 hover:!bg-white/20 shadow-sm backdrop-blur-sm text-[10px] h-8 px-2 font-bold uppercase tracking-wide"
                  onClick={() => window.print()}
                  title="Imprimir"
                >
                  <Icons.Printer />{" "}
                  <span className="hidden md:inline ml-1">IMPRIMIR</span>
                </Button>
              )}
              {isMaster && (
                <>
                  <Button
                    className="!bg-white/10 !text-white border !border-white/30 hover:!bg-white/20 shadow-sm backdrop-blur-sm text-[10px] h-8 px-2 font-bold uppercase tracking-wide"
                    onClick={handleExport}
                    title="Baixar Backup"
                  >
                    <span className="hidden md:inline">BAIXAR</span>
                    <span className="md:hidden">
                      <Icons.Download />
                    </span>
                  </Button>
                  <Button
                    className="!bg-white/10 !text-white border !border-white/30 hover:!bg-white/20 shadow-sm backdrop-blur-sm text-[10px] h-8 px-2 font-bold uppercase tracking-wide"
                    onClick={() => fileInputRef.current?.click()}
                    title="Restaurar"
                  >
                    <span className="hidden md:inline">IMPORTAR</span>
                    <span className="md:hidden">
                      <Icons.Upload />
                    </span>
                  </Button>
                </>
              )}
              {canViewLogs && (
                <Button
                  className="!bg-white/10 !text-white border !border-white/30 hover:!bg-white/20 shadow-sm backdrop-blur-sm text-[10px] h-8 px-2 font-bold uppercase tracking-wide"
                  onClick={() => setIsLogModalOpen(true)}
                  title="Logs"
                >
                  <span className="hidden md:inline">LOGS</span>
                  <span className="md:hidden">
                    <Icons.History />
                  </span>
                </Button>
              )}
              {isMaster && (
                <>
                  <Button
                    className="!bg-white/10 !text-white border !border-white/30 hover:!bg-white/20 shadow-sm backdrop-blur-sm text-[10px] h-8 px-2 font-bold uppercase tracking-wide hidden sm:flex"
                    onClick={() => setIsUserMgmtModalOpen(true)}
                    title="Gestão de Usuários"
                  >
                    <span className="hidden md:inline">USUÁRIOS</span>
                    <span className="md:hidden">
                      <Icons.Users />
                    </span>
                  </Button>
                  <Button
                    className="!bg-white/10 !text-white border !border-white/30 hover:!bg-white/20 shadow-sm backdrop-blur-sm text-[10px] h-8 px-2 font-bold uppercase tracking-wide hidden sm:flex"
                    onClick={() => setIsPresetManagerOpen(true)}
                    title="Gerenciar Postos"
                  >
                    <span className="hidden md:inline">L. ESCALA</span>
                    <span className="md:hidden">
                      <Icons.Settings />
                    </span>
                  </Button>
                </>
              )}
            </div>
          )}
          <div className="h-8 w-px bg-white/20 mx-1 hidden sm:block"></div>
          <div className="flex flex-col items-end">
            <div className="flex items-center gap-1">
              {viewingDraft ? (
                <div className="text-[10px] font-bold px-2 py-0.5 rounded border inline-flex items-center gap-1 bg-slate-800 border-slate-500 text-slate-300 animate-pulse whitespace-nowrap">
                  <span>📝</span> RASCUNHO
                </div>
              ) : isFutureMonth ? (
                <div className="text-[10px] font-bold px-2 py-0.5 rounded border inline-flex items-center gap-1 bg-red-900/40 border-red-400 text-red-100 whitespace-nowrap">
                  <span>🚀</span> FUTURO
                </div>
              ) : (
                <div className="text-[10px] font-bold px-2 py-0.5 rounded border inline-flex items-center gap-1 bg-emerald-900/40 border-emerald-400 text-emerald-100 whitespace-nowrap">
                  <span>🛡️</span> VIGENTE
                </div>
              )}
              <div className="flex items-center bg-black/20 rounded-lg p-0.5">
                <select
                  value={month}
                  onChange={(e) => setMonth(Number(e.target.value))}
                  className="bg-transparent border-none text-white text-sm px-2 py-1 outline-none cursor-pointer font-bold appearance-none"
                >
                  {monthOptions.map((opt) => (
                    <option
                      key={opt.value}
                      value={opt.value}
                      className="text-black"
                    >
                      {opt.label}
                    </option>
                  ))}
                </select>
                {isMaster && (
                  <button
                    onClick={handleAddNextYear}
                    className="px-1 text-white/50 hover:text-white text-[10px] font-bold"
                    title="Adicionar Próximo Ano"
                  >
                    + ANO
                  </button>
                )}
              </div>
            </div>
          </div>
          <div
            className="hidden lg:flex flex-col items-end text-right mr-1 cursor-pointer hover:opacity-80 transition-opacity"
            onClick={() => setIsPasswordModalOpen(true)}
            title="Alterar Senha"
          >
            <span className="text-xs font-bold text-white leading-tight">
              {user.nome.split(" ")[0]}
            </span>
            <span className="bg-black/30 px-1 rounded text-[9px] uppercase mt-0.5">
              {user.role}
            </span>
          </div>
          <button
            onClick={handleLogout}
            className="bg-black/20 hover:bg-red-600 text-white p-2 rounded-lg border border-white/10 ml-1 transition-colors"
            title="Sair"
          >
            <Icons.LogOut />
          </button>
        </div>
      </div>
      {viewingDraft && (
        <div className="bg-red-800 text-red-100 text-center text-xs font-bold py-1 uppercase tracking-widest shadow-inner border-t border-red-700 flex items-center justify-center gap-2">
          <span>
            📝 Você está visualizando/editando um RASCUNHO (Não visível para
            usuários)
          </span>
        </div>
      )}
    </header>
  );
};

AppHeaderComponent.displayName = "AppHeader";

export const AppHeader = React.memo(AppHeaderComponent);
