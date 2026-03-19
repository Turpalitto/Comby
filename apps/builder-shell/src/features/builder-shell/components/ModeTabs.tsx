"use client";

import { modeOptions } from "../data/mode-options";
import type { BuilderShellMode } from "../state/createBuilderShellState";

interface ModeTabsProps {
  value: BuilderShellMode;
  onChange: (value: BuilderShellMode) => void;
}

export function ModeTabs({ value, onChange }: ModeTabsProps) {
  return (
    <nav
      aria-label="Project mode"
      className="flex flex-wrap gap-2 rounded-2xl border border-white/60 bg-white/70 p-1.5 shadow-sm backdrop-blur-md"
    >
      {modeOptions.map((option) => {
        const isActive = option.id === value;

        return (
          <button
            key={option.id}
            type="button"
            aria-pressed={isActive}
            onClick={() => onChange(option.id)}
            className={[
              "group flex min-w-[120px] items-center gap-2.5 rounded-xl px-4 py-2.5 text-left transition-all duration-200",
              isActive
                ? "bg-accent text-white shadow-md shadow-teal-900/20"
                : "text-slate-600 hover:bg-slate-100/80 hover:text-slate-900"
            ].join(" ")}
          >
            <span className="text-base leading-none">{option.icon}</span>
            <span>
              <span className="block text-sm font-semibold leading-tight">
                {option.label}
              </span>
              <span
                className={[
                  "block text-xs leading-tight mt-0.5 transition-colors",
                  isActive ? "text-teal-100" : "text-slate-400 group-hover:text-slate-500"
                ].join(" ")}
              >
                {option.caption}
              </span>
            </span>
          </button>
        );
      })}
    </nav>
  );
}
