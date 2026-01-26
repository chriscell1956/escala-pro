/* eslint-disable react/prop-types */
import React from "react";

// --- Icons ---
import { Icons } from "./ui/Icons";
export { Icons };

// --- Unoeste Security Shield Logo (Image File) ---
export const UnoesteSecurityLogo: React.FC<{ className?: string }> = ({
  className = "w-12 h-12",
}) => (
  <img
    src="/logo.png"
    alt="Brasão Segurança Unoeste"
    className={`object-contain ${className}`}
    onError={(e) => {
      e.currentTarget.style.display = "none";
    }}
  />
);

export const Button: React.FC<
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: "primary" | "secondary" | "danger" | "ghost" | "success";
  }
> = ({ variant = "primary", className = "", children, ...props }) => {
  const base =
    "inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium transition-all text-sm focus:outline-none focus:ring-2 focus:ring-offset-1 active:scale-95";
  const variants = {
    primary:
      "bg-brand-700 hover:bg-brand-800 text-white shadow-sm ring-brand-500", // Unoeste Green
    secondary:
      "bg-white hover:bg-gray-50 text-slate-700 border border-slate-200 shadow-sm ring-slate-200 hover:border-slate-300",
    danger:
      "bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 ring-red-200",
    success:
      "bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm ring-emerald-500",
    ghost: "bg-transparent hover:bg-gray-100 text-gray-600",
  };

  return (
    <button className={`${base} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
};

export const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = ({
  className = "",
  ...props
}) => {
  return (
    <input
      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent text-sm shadow-sm bg-slate-700 text-white border-slate-600 placeholder-slate-400 ${className}`}
      {...props}
    />
  );
};

export const Select: React.FC<
  React.SelectHTMLAttributes<HTMLSelectElement>
> = ({ className = "", children, ...props }) => {
  return (
    <select
      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent text-sm shadow-sm bg-slate-700 text-white border-slate-600 ${className}`}
      {...props}
    >
      {children}
    </select>
  );
};

export const Badge: React.FC<{
  team?: string;
  variant?: "default" | "outline" | "destructive";
  className?: string;
  children?: React.ReactNode;
}> = ({ team, variant = "default", className = "", children }) => {
  // Mode 1: Team Badge (Legacy/Specific)
  if (team) {
    let color = "bg-gray-100 text-gray-800";
    if (team === "A") color = "bg-red-100 text-red-800 border-red-200";
    if (team === "B") color = "bg-blue-100 text-blue-800 border-blue-200";
    if (team === "C") color = "bg-amber-100 text-amber-800 border-amber-200";
    if (team === "D")
      color = "bg-emerald-100 text-emerald-800 border-emerald-200"; // Green
    if (team === "E1" || team === "E2")
      color = "bg-purple-100 text-purple-800 border-purple-200";

    return (
      <span
        className={`inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border ${color} min-w-[28px] tracking-wide shadow-sm ${className}`}
      >
        {team}
      </span>
    );
  }

  // Mode 2: Generic Badge
  let variantStyles = "bg-slate-100 text-slate-800";
  if (variant === "outline")
    variantStyles = "bg-transparent border border-slate-600 text-slate-300";
  if (variant === "destructive")
    variantStyles = "bg-red-100 text-red-800 border border-red-200";

  return (
    <span
      className={`inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-[10px] font-bold ${variantStyles} ${className}`}
    >
      {children}
    </span>
  );
};

export const Card: React.FC<{
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}> = ({ children, className = "", onClick }) => (
  <div
    onClick={onClick}
    className={`bg-slate-800 rounded-xl shadow-sm border border-slate-700 overflow-hidden ${onClick ? "cursor-pointer hover:shadow-md transition-shadow" : ""} ${className}`}
  >
    {children}
  </div>
);

export const Modal: React.FC<{
  title: string;
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  className?: string; // Added prop
}> = ({ title, isOpen, onClose, children, className = "" }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm transition-all">
      <div
        className={`bg-slate-800 rounded-xl shadow-2xl w-full md:max-w-2xl max-h-[90vh] overflow-y-auto animate-fade-in border border-slate-700 ${className}`}
      >
        <div className="flex items-center justify-between p-4 border-b border-slate-700 bg-slate-900/50 rounded-t-xl">
          <h3 className="text-lg font-bold text-slate-200 tracking-tight">
            {title}
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-slate-700 rounded-full text-slate-400 transition-colors"
          >
            {/* Using inline SVG logic or import usage, wait, we are importing Icons now! */}
            {/* BUT wait, I need to make sure Icons.X works. Icons is exported from ./ui/Icons */}
            {/* The previous code used <Icons.X />. Since we import { Icons } from "./ui/Icons", it should work if Icons object has X */}
            <Icons.X />
          </button>
        </div>
        <div className="p-5 bg-slate-800 text-slate-300">{children}</div>
      </div>
    </div>
  );
};

export * from "./ui/SearchableSelect";
