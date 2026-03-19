'use client'

import dynamic from 'next/dynamic'
import { useState } from 'react'

const Editor = dynamic(() => import('@monaco-editor/react'), {
  ssr: false,
  loading: () => (
    <div className="flex-1 flex items-center justify-center bg-[#1e1e1e]">
      <span className="text-white/20 text-sm animate-pulse">Загружаю редактор...</span>
    </div>
  ),
})

interface MonacoEditorProps {
  value: string
  language?: string
  onChange?: (value: string) => void
  readOnly?: boolean
}

function detectLanguage(path: string): string {
  if (path.endsWith('.html')) return 'html'
  if (path.endsWith('.css'))  return 'css'
  if (path.endsWith('.ts') || path.endsWith('.tsx')) return 'typescript'
  if (path.endsWith('.json')) return 'json'
  return 'javascript'
}

export function MonacoCodeView({
  filePath,
  value,
  onChange,
}: {
  filePath: string
  value: string
  onChange?: (v: string) => void
}) {
  const [copied, setCopied] = useState(false)

  const copy = () => {
    navigator.clipboard.writeText(value).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden relative">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-3 h-8 bg-[#1e1e1e] border-b border-white/[0.06] flex-shrink-0">
        <span className="text-[11px] text-white/25 font-mono">{filePath}</span>
        <button
          onClick={copy}
          className="flex items-center gap-1.5 px-2.5 h-6 rounded text-[11px] bg-white/[0.06] border border-white/[0.08] text-white/40 hover:text-white hover:bg-white/10 transition-all"
        >
          {copied ? '✓ Скопировано' : '⎘ Копировать'}
        </button>
      </div>

      {/* Editor */}
      <div className="flex-1 overflow-hidden">
        <Editor
          height="100%"
          language={detectLanguage(filePath)}
          value={value}
          onChange={v => onChange?.(v ?? '')}
          theme="vs-dark"
          options={{
            fontSize:           13,
            fontFamily:         '"Geist Mono", "Fira Code", monospace',
            fontLigatures:      true,
            lineHeight:         20,
            minimap:            { enabled: false },
            scrollBeyondLastLine: false,
            wordWrap:           'on',
            readOnly:           !onChange,
            automaticLayout:    true,
            tabSize:            2,
            renderLineHighlight:'line',
            smoothScrolling:    true,
            cursorSmoothCaretAnimation: 'on',
            padding:            { top: 12, bottom: 12 },
            scrollbar:          { verticalScrollbarSize: 6, horizontalScrollbarSize: 6 },
          }}
        />
      </div>
    </div>
  )
}
