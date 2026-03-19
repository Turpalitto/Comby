'use client';

import type { ProjectMode } from '@/core/types';

interface Props {
  value: ProjectMode;
  onChange: (mode: ProjectMode) => void;
}

const MODES: { id: ProjectMode; label: string; icon: string }[] = [
  { id: 'auto',    label: 'Auto',    icon: '✦' },
  { id: 'website', label: 'Website', icon: '◻' },
  { id: 'app',     label: 'App',     icon: '⊞' },
  { id: 'game',    label: 'Game',    icon: '◈' },
];

export default function ModeSelector({ value, onChange }: Props) {
  return (
    <div>
      <p className="text-xs font-medium text-neutral-500 uppercase tracking-widest mb-2">
        Project type
      </p>
      <div className="flex gap-1 bg-neutral-900 p-1 rounded-lg border border-neutral-800">
        {MODES.map((m) => (
          <button
            key={m.id}
            onClick={() => onChange(m.id)}
            className={[
              'flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-md text-sm font-medium transition-all',
              value === m.id
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800',
            ].join(' ')}
          >
            <span className="text-xs">{m.icon}</span>
            {m.label}
          </button>
        ))}
      </div>
    </div>
  );
}
