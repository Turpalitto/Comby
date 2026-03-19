'use client';

import { useState, useCallback } from 'react';
import type { PipelineState, ProjectType } from '@/core/types';
import IframePreview from '@/preview/IframePreview';
import PreviewToolbar, { SIZES, type Size } from '@/preview/PreviewToolbar';

interface Props {
  state: PipelineState;
  previewUrl: string;
  onRefresh: () => void;
  onDownload: () => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

export default function PreviewPanel({
  state,
  previewUrl,
  onRefresh,
  onDownload,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
}: Props) {
  const [size, setSize]       = useState<Size>('desktop');
  const [refresh, setRefresh] = useState(0);

  const { status, detectedType } = state;
  const hasProject = status === 'ready' && !!previewUrl;

  const handleRefresh = useCallback(() => {
    setRefresh(n => n + 1);
    onRefresh();
  }, [onRefresh]);

  const handleOpenTab = useCallback(() => {
    if (previewUrl) window.open(previewUrl, '_blank');
  }, [previewUrl]);

  const frameWidth = SIZES.find(s => s.id === size)?.width ?? '100%';

  return (
    <div className="h-full flex flex-col bg-neutral-900">
      <PreviewToolbar
        projectType={detectedType}
        size={size}
        onSizeChange={setSize}
        onRefresh={handleRefresh}
        onOpenTab={handleOpenTab}
        onDownload={onDownload}
        onUndo={onUndo}
        onRedo={onRedo}
        canUndo={canUndo}
        canRedo={canRedo}
        hasProject={hasProject}
      />

      {/* Preview area */}
      <div className="flex-1 overflow-hidden flex items-start justify-center relative">

        {/* ── Idle ──────────────────────────────────────────── */}
        {status === 'idle' && <EmptyState />}

        {/* ── Generating ────────────────────────────────────── */}
        {['detecting', 'speccing', 'planning', 'generating'].includes(status) && (
          <GeneratingState step={state.currentStep} progress={state.progress} />
        )}

        {/* ── Error ─────────────────────────────────────────── */}
        {status === 'error' && <ErrorState message={state.error} />}

        {/* ── Ready ─────────────────────────────────────────── */}
        {hasProject && (
          <div
            className="h-full transition-all duration-300 bg-white overflow-hidden shadow-2xl"
            style={{ width: frameWidth, maxWidth: '100%' }}
          >
            <IframePreview
              key={`${previewUrl}-${refresh}`}
              url={previewUrl}
              title={detectedType ?? 'preview'}
            />
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Sub-states ───────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-5 p-10 text-center self-center">
      <div className="w-16 h-16 rounded-2xl bg-neutral-800/80 border border-neutral-700
                      flex items-center justify-center text-2xl">
        ✦
      </div>
      <div>
        <p className="text-neutral-200 font-medium mb-1">Your project appears here</p>
        <p className="text-neutral-600 text-sm">Describe an idea and click Generate</p>
      </div>
      <div className="flex gap-2 flex-wrap justify-center">
        {[
          { icon: '◻', label: 'Website' },
          { icon: '⊞', label: 'Web App' },
          { icon: '◈', label: 'Game'    },
        ].map(t => (
          <span key={t.label}
            className="text-xs px-3 py-1 rounded-full border border-neutral-800 text-neutral-600
                       flex items-center gap-1.5">
            <span>{t.icon}</span>{t.label}
          </span>
        ))}
      </div>
    </div>
  );
}

function GeneratingState({ step, progress }: { step?: string; progress: number }) {
  const isAI = step?.toLowerCase().includes('ai');

  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-6 p-10 self-center">
      <div className="flex flex-col gap-2.5 w-full max-w-xs">
        <Shimmer width="55%" />
        <Shimmer width="100%" height="h-24" />
        <Shimmer width="75%" />
        <Shimmer width="90%" />
        <Shimmer width="45%" />
      </div>

      {isAI && (
        <div className="text-xs text-indigo-400 flex items-center gap-2 animate-pulse">
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-ping" />
          Claude is writing your website…
        </div>
      )}

      <div className="w-full max-w-xs">
        <div className="flex justify-between text-xs text-neutral-600 mb-1.5">
          <span className={isAI ? 'text-indigo-400' : 'animate-pulse'}>
            {step ?? 'Building…'}
          </span>
          <span>{progress}%</span>
        </div>
        <div className="h-1 bg-neutral-800 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${isAI ? 'bg-indigo-400' : 'bg-indigo-500'}`}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
}

function ErrorState({ message }: { message?: string }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-3 p-10 self-center">
      <div className="w-12 h-12 rounded-xl bg-red-500/10 border border-red-500/30
                      flex items-center justify-center text-red-400 text-xl">
        ✕
      </div>
      <p className="text-neutral-300 font-medium">Generation failed</p>
      {message && (
        <p className="text-red-400 text-xs bg-red-500/10 border border-red-500/20
                      rounded px-4 py-2 max-w-sm text-center">
          {message}
        </p>
      )}
    </div>
  );
}

function Shimmer({ width, height = 'h-3' }: { width: string; height?: string }) {
  return (
    <div className={`${height} rounded bg-neutral-800 animate-pulse`} style={{ width }} />
  );
}
