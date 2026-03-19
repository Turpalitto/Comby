'use client'

import type { AgentFile } from '@/core/agentTypes'

function fileIcon(path: string): string {
  if (path.endsWith('.html')) return '🌐'
  if (path.endsWith('.css'))  return '🎨'
  if (path.endsWith('.tsx') || path.endsWith('.ts')) return '⚡'
  if (path.endsWith('.js'))   return '📜'
  if (path.endsWith('.json')) return '📋'
  return '📄'
}

interface Props {
  files: AgentFile[]
  activeFile: string | null
  onSelect: (path: string) => void
}

export default function FileTree({ files, activeFile, onSelect }: Props) {
  if (files.length === 0) return null

  return (
    <div className="py-2">
      <p className="text-[10px] text-neutral-600 px-3 py-1 uppercase tracking-widest mb-1">
        Files
      </p>
      {files.map(f => (
        <button
          key={f.path}
          onClick={() => onSelect(f.path)}
          className={`w-full flex items-center gap-2 px-3 py-1.5 text-left text-xs transition ${
            activeFile === f.path
              ? 'bg-white/8 text-white'
              : 'text-neutral-500 hover:text-neutral-300 hover:bg-white/4'
          }`}
        >
          <span>{fileIcon(f.path)}</span>
          <span className="font-mono truncate flex-1">{f.path}</span>
          <span className="text-[10px] text-neutral-700 flex-shrink-0">
            {(f.content.length / 1024).toFixed(1)}k
          </span>
        </button>
      ))}
    </div>
  )
}
