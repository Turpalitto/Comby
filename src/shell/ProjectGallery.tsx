'use client'

import type { ProjectMeta } from '@/lib/useProjects'

interface ProjectGalleryProps {
  projects:      ProjectMeta[]
  onOpen:        (project: ProjectMeta) => void
  onDelete:      (id: string) => void
  onNew:         () => void
  onChat:        () => void
}

function timeAgo(ts: number): string {
  const diff = Date.now() - ts
  const m = Math.floor(diff / 60000)
  if (m < 1)  return 'только что'
  if (m < 60) return `${m} мин. назад`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h} ч. назад`
  const d = Math.floor(h / 24)
  return `${d} дн. назад`
}

// Mini HTML thumbnail rendered in iframe
function PreviewThumb({ html }: { html: string }) {
  if (!html) return (
    <div className="w-full h-full flex items-center justify-center bg-[#111] text-white/10 text-2xl">✦</div>
  )
  const blob = new Blob([html], { type: 'text/html' })
  const url  = URL.createObjectURL(blob)
  return (
    <iframe
      src={url}
      sandbox="allow-scripts"
      className="w-full h-full border-0 pointer-events-none"
      style={{ transform: 'scale(0.25)', transformOrigin: 'top left', width: '400%', height: '400%' }}
      title="preview"
    />
  )
}

export function ProjectGallery({ projects, onOpen, onDelete, onNew, onChat }: ProjectGalleryProps) {
  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <header className="flex items-center justify-between px-6 h-14 border-b border-white/[0.06] flex-shrink-0">
        <span className="text-sm font-semibold tracking-tight text-white flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-white inline-block" />
          COMBI
        </span>
        <div className="flex items-center gap-2">
          <button
            onClick={onChat}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border border-white/[0.08] text-white/50 hover:text-white hover:border-white/20 transition-all"
          >
            ✦ Чат с ИИ
          </button>
          <button
            onClick={onNew}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-white text-black hover:bg-white/90 transition-all"
          >
            + Новый проект
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-6 py-8">
        {projects.length === 0 ? (
          /* Empty state */
          <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
            <div className="w-16 h-16 rounded-2xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-2xl">✦</div>
            <div>
              <p className="text-white/60 text-sm font-medium">Проектов пока нет</p>
              <p className="text-white/25 text-xs mt-1">Создай первый проект</p>
            </div>
            <button
              onClick={onNew}
              className="px-6 py-2.5 rounded-xl bg-white text-black text-sm font-medium hover:bg-white/90 transition-all mt-2"
            >
              Начать →
            </button>
          </div>
        ) : (
          <>
            <h2 className="text-[13px] font-medium text-white/40 mb-4 uppercase tracking-wider">
              Мои проекты — {projects.length}
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {/* New project card */}
              <button
                onClick={onNew}
                className="aspect-video rounded-2xl border border-dashed border-white/[0.12] hover:border-white/25 flex flex-col items-center justify-center gap-2 text-white/25 hover:text-white/50 transition-all group"
              >
                <span className="text-2xl group-hover:scale-110 transition-transform">+</span>
                <span className="text-[11px]">Новый</span>
              </button>

              {projects.map(p => (
                <div key={p.id} className="group relative">
                  <button
                    onClick={() => onOpen(p)}
                    className="w-full aspect-video rounded-2xl overflow-hidden border border-white/[0.08] hover:border-white/20 transition-all relative bg-[#111]"
                  >
                    <PreviewThumb html={(p as unknown as { previewHtml?: string }).previewHtml ?? ''} />
                    {/* Overlay on hover */}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <span className="text-white text-xs font-medium px-3 py-1.5 rounded-full bg-white/20 backdrop-blur-sm">
                        Открыть
                      </span>
                    </div>
                  </button>

                  {/* Project info */}
                  <div className="mt-2 px-1 flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-[12px] text-white/70 font-medium truncate">{p.name}</p>
                      <p className="text-[10px] text-white/25 mt-0.5">{timeAgo(p.updatedAt)}</p>
                    </div>
                    <button
                      onClick={e => { e.stopPropagation(); onDelete(p.id) }}
                      className="opacity-0 group-hover:opacity-100 transition-opacity text-white/20 hover:text-red-400 text-sm flex-shrink-0 mt-0.5"
                      title="Удалить"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
