import React, { useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

interface TimeSelectProps {
    value: string; // HH:MM
    onChange: (value: string) => void;
    className?: string;
    disabled?: boolean;
}

export const TimeSelect: React.FC<TimeSelectProps> = ({ value, onChange, className, disabled }) => {
    // Parse initial value
    const [hour, setHour] = React.useState('00');
    const [minute, setMinute] = React.useState('00');

    useEffect(() => {
        if (value && value.includes(':')) {
            const [h, m] = value.split(':');
            setHour(h);
            setMinute(m);
        }
    }, [value]);

    const hours = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'));
    const minutes = Array.from({ length: 12 }, (_, i) => (i * 5).toString().padStart(2, '0')); // 00, 05, 10...

    const handleHourChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newHour = e.target.value;
        setHour(newHour);
        onChange(`${newHour}:${minute}`);
    };

    const handleMinuteChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newMinute = e.target.value;
        setMinute(newMinute);
        onChange(`${hour}:${newMinute}`);
    };

    const selectClass = `
        bg-slate-900 border border-slate-700 
        text-amber-500 font-bold text-sm 
        rounded px-2 py-1.5 
        appearance-none outline-none 
        focus:border-blue-500 focus:ring-1 focus:ring-blue-500 
        cursor-pointer w-[60px] text-center
    `;

    return (
        <div className={`flex items-center gap-2 flex-nowrap whitespace-nowrap ${className}`}>
            <div className="relative">
                <select
                    value={hour}
                    onChange={handleHourChange}
                    disabled={disabled}
                    className={selectClass}
                >
                    {hours.map(h => (
                        <option key={h} value={h} className="bg-slate-800 text-white">{h}</option>
                    ))}
                </select>
                <div className="absolute right-1 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
                    <ChevronDown size={12} />
                </div>
            </div>

            <span className="text-slate-400 font-bold">:</span>

            <div className="relative">
                <select
                    value={minute}
                    onChange={handleMinuteChange}
                    disabled={disabled}
                    className={selectClass}
                >
                    {minutes.map(m => (
                        <option key={m} value={m} className="bg-slate-800 text-white">{m}</option>
                    ))}
                </select>
                <div className="absolute right-1 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
                    <ChevronDown size={12} />
                </div>
            </div>
        </div>
    );
};
