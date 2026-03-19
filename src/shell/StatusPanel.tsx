'use client';

import type { PipelineState, ProjectType } from '@/core/types';
import type { DetectionResult } from '@/modes/detector';
import { BUILD_STATUS_LABELS } from '@/core/constants';

interface Props {
  state:    PipelineState;
  detection?: DetectionResult;
}

const TYPE_BADGE: Record<ProjectType, { label: string; color: string }> = {
  website: { label: 'Website',      color: 'bg-sky-500/15 text-sky-400 border-sky-500/30'       },
  app:     { label: 'Web App',      color: 'bg-violet-500/15 text-violet-400 border-violet-500/30' },
  game:    { label: 'Browser Game', color: 'bg-amber-500/15 text-amber-400 border-amber-500/30'  },
};

export default function StatusPanel({ state, detection }: Props) {
  const { status, progress, detectedType, currentStep, error } = state;

  if (status === 'idle') {
    return (
      <div className="rounded-lg border border-neutral-800 bg-neutral-900/50 px-4 py-3">
        <p className="text-xs text-neutral-600">No project yet. Enter an idea and hit Generate.</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-neutral-800 bg-neutral-900/50 px-4 py-3
                    flex flex-col gap-3">

      {/* Status row */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <StatusDot status={status} />
          <span className="text-xs font-medium text-neutral-300 truncate">
            {error ?? currentStep ?? BUILD_STATUS_LABELS[status]}
          </span>
        </div>

        {detectedType && (
          <span className={[
            'text-xs font-medium px-2 py-0.5 rounded-full border flex-shrink-0',
            TYPE_BADGE[detectedType].color,
          ].join(' ')}>
            {TYPE_BADGE[detectedType].label}
          </span>
        )}
      </div>

      {/* Progress bar */}
      {status !== 'error' && (
        <div className="w-full bg-neutral-800 rounded-full h-1 overflow-hidden">
          <div
            className="h-1 bg-indigo-500 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      {/* Detection details — shown after detection step */}
      {detection && status !== 'error' && (
        <DetectionCard detection={detection} />
      )}

      {/* Error detail */}
      {status === 'error' && error && (
        <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20
                      rounded px-3 py-2">
          {error}
        </p>
      )}
    </div>
  );
}

// ─── Detection card ───────────────────────────────────────────

function DetectionCard({ detection }: { detection: DetectionResult }) {
  const { type, confidence, scores, signals } = detection;
  const pct = Math.round(confidence * 100);

  const barColor: Record<ProjectType, string> = {
    website: 'bg-sky-500',
    app:     'bg-violet-500',
    game:    'bg-amber-500',
  };

  const total = Math.max(1, scores.website + scores.app + scores.game);

  return (
    <div className="border-t border-neutral-800 pt-3 flex flex-col gap-2.5">
      <div className="flex items-center justify-between">
        <span className="text-xs text-neutral-600 font-medium uppercase tracking-wider">
          Detection
        </span>
        <ConfidenceBadge pct={pct} />
      </div>

      {/* Score bars */}
      <div className="flex flex-col gap-1.5">
        {(Object.entries(scores) as [ProjectType, number][]).map(([t, s]) => (
          <div key={t} className="flex items-center gap-2">
            <span className={[
              'text-xs w-16 flex-shrink-0',
              t === type ? 'text-neutral-200 font-medium' : 'text-neutral-600',
            ].join(' ')}>
              {t}
            </span>
            <div className="flex-1 h-1.5 bg-neutral-800 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-700 ${
                  t === type ? barColor[t] : 'bg-neutral-700'
                }`}
                style={{ width: `${total > 0 ? (s / total) * 100 : 0}%` }}
              />
            </div>
            <span className="text-xs text-neutral-700 w-5 text-right">{s}</span>
          </div>
        ))}
      </div>

      {/* Signals */}
      {signals.length > 0 && (
        <div className="flex flex-wrap gap-1 pt-0.5">
          {signals.slice(0, 5).map(sig => (
            <span key={sig}
              className="text-xs px-1.5 py-0.5 rounded bg-neutral-800
                         text-neutral-500 border border-neutral-700">
              {sig}
            </span>
          ))}
          {signals.length > 5 && (
            <span className="text-xs text-neutral-700">+{signals.length - 5}</span>
          )}
        </div>
      )}
    </div>
  );
}

function ConfidenceBadge({ pct }: { pct: number }) {
  const color =
    pct >= 80 ? 'text-emerald-400' :
    pct >= 55 ? 'text-amber-400'   :
                'text-neutral-500';
  return (
    <span className={`text-xs font-medium tabular-nums ${color}`}>
      {pct}% confidence
    </span>
  );
}

// ─── Status dot ───────────────────────────────────────────────

function StatusDot({ status }: { status: PipelineState['status'] }) {
  const base = 'w-2 h-2 rounded-full flex-shrink-0';
  if (status === 'ready') return <span className={`${base} bg-emerald-400`} />;
  if (status === 'error') return <span className={`${base} bg-red-400`} />;
  if (status === 'idle')  return <span className={`${base} bg-neutral-600`} />;
  return <span className={`${base} bg-indigo-400 animate-pulse`} />;
}
