import React, { useState, useRef, useEffect } from "react";
import { Icons } from "../ui";

interface Option {
  value: string;
  label: string;
  subLabel?: string;
}

interface SearchableSelectProps {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export const SearchableSelect: React.FC<SearchableSelectProps> = ({
  options,
  value,
  onChange,
  placeholder = "Selecione...",
  className = "",
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Filter options
  const filteredOptions = options.filter((opt) => {
    const normalize = (s: string) => s.toLowerCase().replace(/\s+/g, "");
    const searchNorm = normalize(search);
    const match =
      normalize(opt.label).includes(searchNorm) ||
      (opt.subLabel && normalize(opt.subLabel).includes(searchNorm));

    return match;
  });

  const selectedOption = options.find((opt) => opt.value === value);

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => {
          if (!disabled) {
            setIsOpen(!isOpen);
            if (!isOpen) {
              setTimeout(() => inputRef.current?.focus(), 100);
              setSearch("");
            }
          }
        }}
        disabled={disabled}
        className={`w-full flex items-center justify-between bg-slate-800 border border-slate-700 hover:border-slate-500 rounded px-3 py-2 text-xs text-slate-200 transition-colors ${
          disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
        }`}
      >
        <span className="truncate">
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <Icons.ChevronDown
          className={`w-4 h-4 text-slate-500 transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute z-50 mt-1 w-[300px] right-0 bg-slate-900 border border-slate-700 rounded-lg shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-100 origin-top-right">
          {/* Search Input */}
          <div className="p-2 border-b border-slate-800 bg-slate-950/50 sticky top-0">
            <div className="relative">
              <Icons.Search className="absolute left-2 top-1.5 w-4 h-4 text-slate-500" />
              <input
                ref={inputRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar..."
                className="w-full bg-slate-800 border border-slate-700 rounded pl-8 pr-2 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Options List */}
          <div className="max-h-[200px] overflow-y-auto p-1">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => {
                    onChange(opt.value);
                    setIsOpen(false);
                    setSearch("");
                  }}
                  className={`w-full text-left px-3 py-2 text-xs rounded hover:bg-slate-800 transition-colors flex items-center justify-between ${
                    value === opt.value
                      ? "bg-slate-800/50 text-blue-400 font-bold"
                      : "text-slate-300"
                  }`}
                >
                  <span className="block truncate">{opt.label}</span>
                  {opt.subLabel && (
                    <span className="text-[10px] text-slate-500 ml-2 whitespace-nowrap bg-slate-950/50 px-1.5 py-0.5 rounded border border-slate-800">
                      {opt.subLabel}
                    </span>
                  )}
                </button>
              ))
            ) : (
              <div className="p-3 text-center text-xs text-slate-500 italic">
                Nenhum resultado encontrado.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
