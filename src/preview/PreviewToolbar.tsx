'use client';

import type { ProjectType } from '@/core/types';

type Size = 'mobile' | 'tablet' | 'desktop';

interface Props {
  projectType?: ProjectType;
  size: Size;
  onSizeChange: (s: Size) => void;
  onRefresh: () => void;
  onOpenTab: () => void;
  onDownload: () => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  hasProject: boolean;
}

const SIZES: { id: Size; label: string; width: string }[] = [
  { id: 'mobile',  label: 'Mobile',  width: '390px' },
  { id: 'tablet',  label: 'Tablet',  width: '768px' },
  { id: 'desktop', label: 'Desktop', width: '100%'  },
];

const TYPE_ICON: Record<ProjectType, string> = {
  website: '◻',
  app:     '⊞',
  game:    '◈',
};

export default function PreviewToolbar({
  projectType,
  size,
  onSizeChange,
  onRefresh,
  onOpenTab,
  onDownload,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  hasProject,
}: Props) {
  return (
    <div className="h-10 flex items-center px-4 gap-2 border-b border-neutral-800
                    bg-neutral-950/90 backdrop-blur flex-shrink-0">

      {/* Window dots */}
      <div className="flex gap-1.5 mr-1">
        <span className="w-3 h-3 rounded-full bg-red-500/50" />
        <span className="w-3 h-3 rounded-full bg-yellow-500/50" />
        <span className="w-3 h-3 rounded-full bg-green-500/50" />
      </div>

      {/* Type badge */}
      {projectType && (
        <span className="text-xs text-neutral-600 font-mono">
          {TYPE_ICON[projectType]} {projectType}
        </span>
      )}

      {/* Undo / Redo */}
      {hasProject && (
        <>
          <div className="w-px h-4 bg-neutral-800 mx-0.5" />
          <div className="flex gap-0.5">
            <button
              title="Undo (Ctrl+Z)"
              onClick={onUndo}
              disabled={!canUndo}
              className={[
                'px-2 py-0.5 rounded text-xs transition-all',
                canUndo
                  ? 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 cursor-pointer'
                  : 'text-neutral-700 cursor-not-allowed',
              ].join(' ')}
            >
              ←
            </button>
            <button
              title="Redo (Ctrl+Y)"
              onClick={onRedo}
              disabled={!canRedo}
              className={[
                'px-2 py-0.5 rounded text-xs transition-all',
                canRedo
                  ? 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 cursor-pointer'
                  : 'text-neutral-700 cursor-not-allowed',
              ].join(' ')}
            >
              →
            </button>
          </div>
        </>
      )}

      {/* Spacer */}
      <div className="flex-1" />

      {/* Size controls */}
      {hasProject && (
        <div className="flex gap-0.5 bg-neutral-900 rounded-md p-0.5 border border-neutral-800">
          {SIZES.map(s => (
            <button
              key={s.id}
              title={s.label}
              onClick={() => onSizeChange(s.id)}
              className={[
                'px-2 py-0.5 rounded text-xs font-medium transition-all',
                size === s.id
                  ? 'bg-neutral-700 text-neutral-200'
                  : 'text-neutral-600 hover:text-neutral-400',
              ].join(' ')}
            >
              {s.label[0]}
            </button>
          ))}
        </div>
      )}

      {/* Actions */}
      {hasProject && (
        <>
          <div className="w-px h-4 bg-neutral-800 mx-0.5" />

          <button
            title="Refresh preview"
            onClick={onRefresh}
            className="text-xs px-2 py-0.5 rounded text-neutral-600
                       hover:text-neutral-300 hover:bg-neutral-800 transition-all"
          >
            ↺
          </button>

          <button
            title="Open in new tab"
            onClick={onOpenTab}
            className="text-xs px-2 py-0.5 rounded text-neutral-600
                       hover:text-neutral-300 hover:bg-neutral-800 transition-all"
          >
            ↗
          </button>

          <button
            title="Download HTML"
            onClick={onDownload}
            className="text-xs px-2 py-1 rounded font-medium text-neutral-300
                       bg-neutral-800 hover:bg-neutral-700 border border-neutral-700
                       hover:border-neutral-600 transition-all"
          >
            ↓ Download
          </button>
        </>
      )}
    </div>
  );
}

export { SIZES };
export type { Size };
