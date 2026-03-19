'use client';

interface Props {
  value: string;
  onChange: (v: string) => void;
  onGenerate: () => void;
  isGenerating: boolean;
}

const PLACEHOLDERS = [
  'A landing page for a SaaS tool that tracks sleep quality...',
  'A dashboard app for managing personal finances...',
  'A retro arcade shooter where you fight neon enemies...',
  'A portfolio site for a freelance photographer...',
];

export default function IdeaInput({ value, onChange, onGenerate, isGenerating }: Props) {
  const placeholder = PLACEHOLDERS[0];

  const handleKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      onGenerate();
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <div>
        <p className="text-xs font-medium text-neutral-500 uppercase tracking-widest mb-2">
          Your idea
        </p>
        <div className="relative">
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKey}
            placeholder={placeholder}
            rows={5}
            disabled={isGenerating}
            className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-4 py-3
                       text-sm text-neutral-100 placeholder:text-neutral-600
                       resize-none outline-none
                       focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30
                       transition-all disabled:opacity-50"
          />
          <span className="absolute bottom-2.5 right-3 text-xs text-neutral-700 pointer-events-none">
            ⌘↵
          </span>
        </div>
      </div>

      <button
        onClick={onGenerate}
        disabled={isGenerating || value.trim().length < 5}
        className="w-full py-2.5 px-4 rounded-lg text-sm font-semibold
                   bg-indigo-600 hover:bg-indigo-500 text-white
                   disabled:opacity-40 disabled:cursor-not-allowed
                   transition-all active:scale-[0.98]"
      >
        {isGenerating ? (
          <span className="flex items-center justify-center gap-2">
            <Spinner />
            Generating...
          </span>
        ) : (
          'Generate →'
        )}
      </button>
    </div>
  );
}

function Spinner() {
  return (
    <svg className="animate-spin h-3.5 w-3.5 text-white" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}
