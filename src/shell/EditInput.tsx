'use client';

import { useState, useRef } from 'react';

interface EditEntry {
  text:    string;
  summary: string;
  ok:      boolean;
}

interface Props {
  onEdit:      (text: string) => Promise<{ summary: string; ok: boolean }>;
  isApplying:  boolean;
}

const EXAMPLES = [
  'add pricing',
  'make it darker',
  'add settings page',
  'increase enemy speed',
  'make it minimal',
  'change to shooter',
  'add chart',
  'use purple',
];

export default function EditInput({ onEdit, isApplying }: Props) {
  const [text,    setText]    = useState('');
  const [history, setHistory] = useState<EditEntry[]>([]);
  const [hint,    setHint]    = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async () => {
    const trimmed = text.trim();
    if (!trimmed || isApplying) return;

    setText('');
    const result = await onEdit(trimmed);
    setHistory(h => [{ text: trimmed, ...result }, ...h].slice(0, 8));
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSubmit();
  };

  return (
    <div className="flex flex-col gap-3">
      <div>
        <p className="text-xs font-medium text-neutral-500 uppercase tracking-widest mb-2">
          Edit project
        </p>

        <div className="flex gap-2">
          <input
            ref={inputRef}
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={handleKey}
            placeholder='e.g. "add pricing" or "make it darker"'
            disabled={isApplying}
            className="flex-1 bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-2
                       text-sm text-neutral-100 placeholder:text-neutral-600
                       outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30
                       transition-all disabled:opacity-50"
          />
          <button
            onClick={handleSubmit}
            disabled={isApplying || !text.trim()}
            className="px-3 py-2 rounded-lg text-sm font-medium bg-neutral-800
                       text-neutral-300 hover:bg-neutral-700 hover:text-white
                       disabled:opacity-40 disabled:cursor-not-allowed transition-all
                       flex-shrink-0"
          >
            {isApplying ? <Spinner /> : 'Apply'}
          </button>
        </div>
      </div>

      {/* Example chips */}
      <div className="flex flex-wrap gap-1.5">
        {EXAMPLES.slice(0, 4).map(ex => (
          <button
            key={ex}
            onClick={() => { setText(ex); inputRef.current?.focus(); }}
            className="text-xs px-2 py-1 rounded-md bg-neutral-900 border border-neutral-800
                       text-neutral-600 hover:text-neutral-300 hover:border-neutral-600
                       transition-all"
          >
            {ex}
          </button>
        ))}
      </div>

      {/* Edit history */}
      {history.length > 0 && (
        <div className="flex flex-col gap-1">
          {history.map((entry, i) => (
            <div key={i}
              className="flex items-start gap-2 text-xs px-3 py-2 rounded-lg
                         bg-neutral-900/60 border border-neutral-800/60">
              <span className={entry.ok ? 'text-emerald-400 mt-0.5' : 'text-red-400 mt-0.5'}>
                {entry.ok ? '✓' : '?'}
              </span>
              <div className="min-w-0">
                <span className="text-neutral-300 font-medium">{entry.text}</span>
                <span className="text-neutral-600 ml-2">→ {entry.summary}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Spinner() {
  return (
    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}
