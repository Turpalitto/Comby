'use client'

import type { Version } from '@/lib/useVersionHistory'

interface VersionPanelProps {
  versions:  Version[]
  cursor:    number
  onRestore: (id: string) => void
  onClose:   () => void
}

function timeLabel(ts: number): string {
  return new Date(ts).toLocaleTimeString('ru', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

export function VersionPanel({ versions, cursor, onRestore, onClose }: VersionPanelProps) {
  return (
    <div className="absolute right-0 top-10 w-72 bg-[#181818] border border-white/[0.1] rounded-2xl shadow-2xl z-50 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
        <span className="text-[12px] font-medium text-white/70">История версий</span>
        <button onClick={onClose} className="text-white/30 hover:text-white/70 text-sm transition-colors">✕</button>
      </div>

      <div className="max-h-80 overflow-y-auto">
        {versions.length === 0 ? (
          <p className="text-[11px] text-white/25 px-4 py-3">Нет сохранённых версий</p>
        ) : (
          versions.map((v, i) => {
            const isActive = i === cursor || (cursor === -1 && i === 0)
            return (
              <button
                key={v.id}
                onClick={() => onRestore(v.id)}
                className={`w-full flex items-start gap-3 px-4 py-2.5 text-left hover:bg-white/[0.04] transition-colors ${isActive ? 'bg-white/[0.05]' : ''}`}
              >
                <div className="flex flex-col items-center gap-1 flex-shrink-0 mt-1">
                  <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-white' : 'bg-white/20'}`} />
                  {i < versions.length - 1 && <div className="w-px h-full min-h-[16px] bg-white/10" />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] text-white/60 leading-snug truncate">
                    {v.label || 'Версия'}
                  </p>
                  <p className="text-[10px] text-white/25 mt-0.5">{timeLabel(v.createdAt)}</p>
                </div>
                {isActive && (
                  <span className="text-[9px] text-white/30 flex-shrink-0 mt-1 border border-white/10 px-1.5 py-0.5 rounded">
                    текущая
                  </span>
                )}
              </button>
            )
          })
        )}
      </div>
    </div>
  )
}
