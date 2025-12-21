import React from "react";
import { Vigilante, User, Conflict } from "../../types";
import { Button, Icons, Badge } from "../ui";

interface EscalaViewProps {
  groupedData: Record<string, Vigilante[]>;
  conflicts: Conflict[];
  user: User | null;
  isUser: boolean;
  isFiscal: boolean;
  isMaster: boolean;
  currentUserVig?: Vigilante;
  currentLabel: string;
  searchTerm: string;
  setSearchTerm: (v: string) => void;
  filterEq: string;
  setFilterEq: (v: string) => void;
  filterDay: string;
  handleOpenCoverage: (dia: number, campus: string, equipe: string) => void;
  handleReturnFromAway: (vig: Vigilante) => void;
  handleRemoveCoverage: (vig: Vigilante, dia: number) => void;
  visibleTeams: string[];
  collapsedSectors: Set<string>;
  toggleSectorCollapse: (sector: string) => void;
}

const EscalaViewComponent: React.FC<EscalaViewProps> = (props) => {
  const {
    groupedData,
    conflicts,
    user,
    isUser,
    isFiscal,
    isMaster,
    currentUserVig,
    currentLabel,
    searchTerm,
    setSearchTerm,
    filterEq,
    setFilterEq,
    filterDay,
    handleOpenCoverage,
    handleReturnFromAway,
    handleRemoveCoverage,
    visibleTeams,
    collapsedSectors,
    toggleSectorCollapse,
  } = props;

  return (
    <div className="h-full flex flex-col">
      {!isUser && (
        <div className="p-2 bg-slate-900 border-b border-slate-700 flex gap-2 print:hidden items-center">
          <div className="flex items-center bg-slate-800 rounded-lg border border-slate-700 px-3 py-1.5 w-fit shadow-sm focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 transition-all">
            <div className="text-slate-400 mr-2">
              <Icons.Search />
            </div>
            <input
              type="text"
              placeholder="Pesquisar..."
              className="bg-slate-800 border-none text-sm w-32 md:w-48 focus:outline-none placeholder:text-slate-500 font-bold text-slate-200"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />

            <div className="w-px h-5 bg-slate-600 mx-2"></div>
            <select
              value={filterEq}
              onChange={(e) => setFilterEq(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded-lg text-sm font-bold text-slate-300 focus:outline-none cursor-pointer hover:text-white"
            >
              <option value="TODAS">Todas Equipes</option>
              {visibleTeams.map((t) => (
                <option key={t} value={t}>
                  Equipe {t}
                </option>
              ))}
              <option value="AFASTADOS">✈️ Afastados</option>
            </select>
          </div>
        </div>
      )}
      <div className="flex-1 overflow-y-auto p-4 print:overflow-visible print:h-auto">
        {isUser && (
          <div className="mb-6 bg-slate-800 border-l-4 border-blue-500 shadow-sm rounded-r-xl p-4">
            <h2 className="text-lg font-bold text-white">
              Olá, {user?.nome.split(" ")[0]}
            </h2>
            <p className="text-sm text-slate-400 mb-3">
              Aqui está o resumo da sua escala para {currentLabel}.
            </p>
            {currentUserVig?.folgasGeradas?.length ? (
              <div className="bg-red-50 border border-red-100 rounded-lg p-3 inline-block">
                <div className="text-xs font-bold text-red-800 uppercase tracking-wide mb-1">
                  📅 SUAS FOLGAS EXTRAS NESTE MÊS
                </div>
                <div className="text-lg font-black text-red-600">
                  Dias: {currentUserVig.folgasGeradas.join(", ")}
                </div>
              </div>
            ) : (
              <div className="text-sm text-gray-400 italic">
                Nenhuma folga extra definida para este mês.
              </div>
            )}
            {currentUserVig?.status === "RECUPERADO" && (
              <div className="mt-2 bg-blue-50 text-blue-800 text-xs p-2 rounded border border-blue-200">
                ℹ️ <b>Nota:</b> Exibindo escala base (Offline/Backup).
                Conecte-se para ver atualizações recentes.
              </div>
            )}
          </div>
        )}

        {Object.keys(groupedData).length === 0 && isUser && !currentUserVig && (
          <div className="p-8 text-center text-slate-500 bg-slate-800 rounded-lg border border-dashed border-slate-600">
            <p>
              Sua escala para este mês ainda não foi encontrada ou publicada.
            </p>
          </div>
        )}
        {Object.keys(groupedData)
          .sort()
          .map((campus) => {
            const isCollapsed = collapsedSectors.has(campus);
            let currentConflictsForCampus = conflicts.filter(
              (c) => c.campus === campus,
            );
            if (user?.role === "FISCAL" && currentUserVig) {
              currentConflictsForCampus = currentConflictsForCampus.filter(
                (c) => c.equipe === currentUserVig.eq,
              );
            }
            return (
              <div
                key={campus}
                className="mb-6 bg-slate-800 rounded-xl shadow-sm border border-slate-700 overflow-hidden break-inside-avoid print:shadow-none print:border-none print:mb-4"
              >
                <button
                  onClick={() => toggleSectorCollapse(campus)}
                  className="w-full bg-slate-950 px-4 py-2 border-b border-slate-700 font-bold text-sm text-white flex items-center gap-2 print:bg-gray-100 print:border-gray-300 print:text-black hover:bg-slate-900 transition-colors"
                >
                  <div className="w-1.5 h-4 bg-blue-500 rounded-full print:bg-black"></div>{" "}
                  {campus}
                  <div
                    className={`ml-auto transform transition-transform duration-200 ${
                      isCollapsed ? "rotate-0" : "rotate-180"
                    }`}
                  >
                    {/* SUBSTITUÍDO O ÍCONE POR TEXTO PARA TESTE */}
                    <span className="text-lg">▼</span>
                  </div>
                </button>
                {!isCollapsed && (
                  <>
                    {currentConflictsForCampus.length > 0 &&
                      (isFiscal || isMaster) && (
                        <div className="bg-red-50 border-b border-red-200 p-3 print:hidden animate-fade-in">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-2xl">⚠️</span>
                            <span className="font-bold text-xs text-red-800 uppercase tracking-wider">
                              Alerta de Efetivo Baixo (Regra 50%)
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {currentConflictsForCampus.map((c, idx) => (
                              <div
                                key={idx}
                                className="bg-white border border-red-200 rounded-lg p-2 flex items-center gap-3 shadow-sm"
                              >
                                <div className="flex flex-col items-center leading-none border-r border-red-100 pr-3">
                                  <span className="text-[10px] text-red-400 font-bold uppercase">
                                    Dia
                                  </span>
                                  <span className="text-lg font-black text-red-700">
                                    {c.dia}
                                  </span>
                                </div>
                                <div className="flex flex-col">
                                  <div className="flex items-center gap-1">
                                    <span className="text-xs text-red-800 font-bold">
                                      Equipe
                                    </span>
                                    <Badge team={c.equipe} />
                                  </div>
                                  <span className="text-[9px] text-red-500">
                                    {c.msg}
                                  </span>
                                </div>
                                <button
                                  onClick={() =>
                                    handleOpenCoverage(
                                      c.dia,
                                      c.campus,
                                      c.equipe,
                                    )
                                  }
                                  className="ml-1 bg-red-600 hover:bg-red-700 text-white text-[10px] font-bold px-3 py-1.5 rounded shadow-sm transition-all active:scale-95"
                                >
                                  RESOLVER
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    <div className="overflow-x-auto print:block print:overflow-visible">
                      <table className="w-full text-left text-sm min-w-[600px] md:min-w-0">
                        <thead className="bg-slate-950 text-slate-400 border-b border-slate-700 font-medium print:bg-gray-200 print:text-black">
                          <tr>
                            <th className="px-4 py-3">NOME</th>
                            <th className="px-4 py-3 w-10 text-center">EQ</th>
                            <th className="px-4 py-3 w-16">MAT</th>
                            <th className="px-4 py-3">STATUS / ESCALA</th>
                            <th className="px-4 py-3 w-24">HORÁRIO</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-700">
                          {(
                            groupedData[campus] as (Vigilante & {
                              displayStatus?: {
                                active: boolean;
                                status: string;
                                variant: string;
                              };
                            })[]
                          ).map((vig) => {
                            const isAfastado = vig.campus === "AFASTADOS";
                            return (
                              <tr
                                key={vig.mat}
                                className={`${isAfastado ? "bg-amber-900/20 border-l-4 border-amber-500" : "even:bg-slate-800 odd:bg-slate-700/50 hover:bg-slate-600"} border-b border-slate-700 text-sm print:bg-white print:border-black transition-colors`}
                              >
                                <td className="px-4 py-4">
                                  <div className="font-bold text-slate-200 text-base">
                                    {vig.nome}
                                  </div>
                                  <div className="text-xs text-slate-400">
                                    {vig.setor}
                                  </div>
                                </td>
                                <td className="px-4 py-4 text-center">
                                  <Badge team={vig.eq} />
                                </td>
                                <td className="px-4 py-4 font-mono text-slate-400 font-medium">
                                  {vig.mat}
                                </td>
                                <td className="px-4 py-4">
                                  {isAfastado ? (
                                    <div className="flex justify-between items-center">
                                      <span className="font-bold text-amber-500">
                                        {vig.status}: {vig.obs}
                                      </span>
                                      {isFiscal && (
                                        <Button
                                          variant="secondary"
                                          className="px-2 py-0.5 text-[10px] h-6 bg-slate-700 border border-slate-600 text-white hover:bg-slate-600 print:hidden"
                                          onClick={() =>
                                            handleReturnFromAway(vig)
                                          }
                                        >
                                          Retornar
                                        </Button>
                                      )}
                                    </div>
                                  ) : (
                                    <div className="flex flex-col gap-1">
                                      {filterDay &&
                                        vig.displayStatus &&
                                        vig.displayStatus.active && (
                                          <div className="mb-1">
                                            <span
                                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold border shadow-sm ${vig.displayStatus.variant === "success" ? "bg-green-900/50 text-green-300 border-green-700" : vig.displayStatus.variant === "warning" ? "bg-orange-900/50 text-orange-300 border-orange-700" : "bg-slate-700 text-slate-400"}`}
                                            >
                                              {vig.displayStatus.status}
                                            </span>
                                          </div>
                                        )}
                                      <div className="flex flex-wrap items-center gap-2 text-xs leading-tight">
                                        <span className="text-slate-300 font-semibold tracking-tight whitespace-nowrap">
                                          <span className="text-[10px] text-slate-500 font-normal mr-1">
                                            DIAS:
                                          </span>
                                          {vig.dias?.join(", ")}
                                        </span>
                                        {vig.folgasGeradas?.length > 0 && (
                                          <span className="text-[10px] font-black bg-red-900/50 text-red-300 px-1.5 py-0.5 rounded border border-red-800 tracking-wide whitespace-nowrap">
                                            FOLGAS:{" "}
                                            {vig.folgasGeradas.join(", ")}
                                          </span>
                                        )}
                                        {vig.vacation && (
                                          <span className="text-[10px] bg-yellow-900/50 text-yellow-300 px-1.5 py-0.5 rounded border border-yellow-700 font-bold whitespace-nowrap">
                                            FÉRIAS: {vig.vacation.start} a{" "}
                                            {vig.vacation.end}
                                          </span>
                                        )}
                                        {vig.coberturas?.map((c, idx) => {
                                          const isInterval =
                                            c.tipo === "INTERVALO";
                                          return (
                                            <div
                                              key={idx}
                                              className={`text-[10px] px-2 py-0.5 rounded border font-bold flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity whitespace-nowrap ${isInterval ? "bg-orange-900/50 text-orange-300 border-orange-700" : "bg-blue-900/50 text-blue-300 border-blue-700"}`}
                                              onClick={() =>
                                                handleRemoveCoverage(vig, c.dia)
                                              }
                                            >
                                              <span className="uppercase text-[9px] opacity-75 mr-1">
                                                {isInterval ? "COB." : c.tipo}
                                              </span>
                                              <span>
                                                {c.dia}➜{c.local}
                                              </span>
                                              <div className="bg-white/20 rounded-full p-0.5 hover:bg-red-500 hover:text-white transition-colors w-3 h-3 flex items-center justify-center">
                                                <Icons.X />
                                              </div>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    </div>
                                  )}
                                </td>
                                <td className="px-4 py-4 text-xs text-slate-400">
                                  <div className="font-bold text-sm text-slate-300">
                                    {vig.horario}
                                  </div>
                                  <div>Ref: {vig.refeicao}</div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}
              </div>
            );
          })}
      </div>
    </div>
  );
};

EscalaViewComponent.displayName = "EscalaView";

export const EscalaView = React.memo(EscalaViewComponent);
