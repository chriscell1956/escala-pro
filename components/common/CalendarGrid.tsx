import React from "react";
import { Vigilante } from "../../types";
import { getDaysInMonth } from "../../utils";

interface CalendarGridProps {
  vig: Vigilante;
  month: number;
  editorMode: "days" | "vacation" | "falta" | "partial";
  onToggleDay: (vig: Vigilante, day: number) => void;
  onToggleVacation: (vig: Vigilante, day: number) => void;
  onToggleFalta: (vig: Vigilante, day: number) => void;
  onTogglePartial: (vig: Vigilante, day: number) => void;
}

const CalendarGridComponent = ({
  vig,
  month,
  editorMode,
  onToggleDay,
  onToggleVacation,
  onToggleFalta,
  onTogglePartial,
}: CalendarGridProps) => {
  const daysInM = getDaysInMonth(month);
  const gridDays: number[] = Array.from({ length: daysInM }, (_, i) => i + 1);

  return (
    <div className="grid grid-cols-7 gap-1 select-none mt-2">
      {["D", "S", "T", "Q", "Q", "S", "S"].map((d, i) => (
        <div
          key={i}
          className="text-center text-[9px] font-bold text-slate-400 uppercase"
        >
          {d}
        </div>
      ))}
      {(() => {
        const year = Math.floor(month / 100);
        const mon = (month % 100) - 1;
        const firstDayIndex = new Date(year, mon, 1).getDay(); // 0 = Sun
        const padding: number[] = Array.from(
          { length: firstDayIndex },
          (_, i) => i,
        );

        return (
          <>
            {padding.map((pad) => (
              <div key={`pad-${pad}`}></div>
            ))}
            {gridDays.map((d) => {
              const dias = vig.dias || [];
              const isWork = dias.includes(d);
              const isVacation =
                vig.vacation &&
                d >= vig.vacation.start &&
                d <= vig.vacation.end;
              const isFalta = (vig.faltas || []).includes(d);
              const isPartial = (vig.saidasAntecipadas || []).includes(d);

              let bg = "bg-slate-800 text-slate-600 border-slate-700"; // Default dark/empty
              let cursor = "cursor-pointer";

              if (editorMode === "days") {
                if (isWork)
                  bg = "bg-blue-600 text-white border-blue-700 shadow-sm";
                else if (isFalta)
                  bg = "bg-red-900/50 text-red-500 border-red-900";
                else if (isPartial)
                  bg = "bg-orange-900/50 text-orange-500 border-orange-900";
                else
                  bg =
                    "bg-slate-700 text-slate-400 hover:bg-slate-600 border-slate-600";
              } else if (editorMode === "vacation") {
                if (isVacation)
                  bg =
                    "bg-amber-400 text-white border-amber-500 shadow-sm hover:bg-amber-500";
                else
                  bg =
                    "bg-slate-800 text-slate-500 border-slate-700 hover:bg-amber-900/30 hover:border-amber-700";
              } else if (editorMode === "falta") {
                if (isFalta)
                  bg = "bg-red-600 text-white border-red-700 shadow-sm";
                else if (isWork)
                  bg =
                    "bg-blue-900/30 text-blue-500 border-blue-800 hover:bg-red-900/30"; // Pode marcar falta em dia de trabalho (remove o trabalho)
                else if (isVacation) {
                  bg =
                    "bg-amber-900/30 text-amber-600 border-amber-800 opacity-50";
                  cursor = "cursor-not-allowed";
                } else
                  bg =
                    "bg-slate-800 text-slate-500 border-slate-700 hover:bg-red-900/30 hover:border-red-800";
              } else if (editorMode === "partial") {
                if (isPartial)
                  bg = "bg-orange-500 text-white border-orange-600 shadow-sm";
                else if (isWork)
                  bg =
                    "bg-blue-900/30 text-blue-500 border-blue-800 hover:bg-orange-900/30";
                else if (isVacation) {
                  bg =
                    "bg-amber-900/30 text-amber-600 border-amber-800 opacity-50";
                  cursor = "cursor-not-allowed";
                } else
                  bg =
                    "bg-slate-800 text-slate-500 border-slate-700 hover:bg-orange-900/30 hover:border-orange-800";
              }

              return (
                <div
                  key={d}
                  onClick={() => {
                    if (editorMode === "days") onToggleDay(vig, d);
                    else if (editorMode === "vacation")
                      onToggleVacation(vig, d);
                    else if (editorMode === "falta" && !isVacation)
                      onToggleFalta(vig, d);
                    else if (editorMode === "partial" && !isVacation)
                      onTogglePartial(vig, d);
                  }}
                  className={`text-[10px] font-bold h-7 flex items-center justify-center rounded border transition-all active:scale-95 ${bg} ${cursor}`}
                >
                  {d}
                </div>
              );
            })}
          </>
        );
      })()}
    </div>
  );
};

CalendarGridComponent.displayName = "CalendarGrid";

export const CalendarGrid = React.memo(CalendarGridComponent);
