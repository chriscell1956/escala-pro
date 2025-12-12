import React from 'react';
import { Vigilante } from '../../types';
import { getDaysInMonth } from '../../utils';

interface CalendarGridProps {
    vig: Vigilante;
    month: number;
    editorMode: 'days' | 'vacation';
    onToggleDay: (vig: Vigilante, day: number) => void;
    onToggleVacation: (vig: Vigilante, day: number) => void;
}

export const CalendarGrid = React.memo(({ vig, month, editorMode, onToggleDay, onToggleVacation }: CalendarGridProps) => {
    const daysInM = getDaysInMonth(month);
    const gridDays: number[] = Array.from({ length: daysInM }, (_, i) => i + 1);
    
    return (
        <div className="grid grid-cols-7 gap-1 select-none mt-2">
            {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((d, i) => (
                <div key={i} className="text-center text-[9px] font-bold text-slate-400 uppercase">{d}</div>
            ))}
            {(() => {
                const year = Math.floor(month / 100);
                const mon = (month % 100) - 1;
                const firstDayIndex = new Date(year, mon, 1).getDay(); // 0 = Sun
                const padding: number[] = Array.from({ length: firstDayIndex }, (_, i) => i);
                
                return (
                    <>
                        {padding.map(pad => <div key={`pad-${pad}`}></div>)}
                        {gridDays.map(d => {
                            const dias = vig.dias || [];
                            const isWork = dias.includes(d);
                            const isVacation = vig.vacation && d >= vig.vacation.start && d <= vig.vacation.end;
                            
                            let bg = 'bg-white text-slate-300 border-slate-100';
                            
                            if (editorMode === 'days') {
                                if (isWork) bg = 'bg-blue-600 text-white border-blue-700 shadow-sm';
                                else bg = 'bg-white text-slate-500 hover:bg-slate-50 border-slate-200';
                            } else if (editorMode === 'vacation') {
                                if (isVacation) bg = 'bg-amber-400 text-white border-amber-500 shadow-sm cursor-pointer hover:bg-amber-500';
                                else if (isWork) bg = 'bg-blue-100 text-blue-300 border-blue-200 opacity-50 cursor-not-allowed';
                                else bg = 'bg-white text-slate-300 border-slate-100 cursor-pointer hover:bg-amber-50 hover:border-amber-200';
                            }

                            return (
                                <div 
                                    key={d} 
                                    onClick={() => {
                                        if (editorMode === 'days') onToggleDay(vig, d);
                                        if (editorMode === 'vacation') onToggleVacation(vig, d);
                                    }}
                                    className={`text-[10px] font-bold h-7 flex items-center justify-center rounded border transition-all active:scale-95 ${bg}`}
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
});