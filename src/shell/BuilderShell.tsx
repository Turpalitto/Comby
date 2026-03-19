'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { previewManager } from '@/preview/PreviewManager'
import type { ChatMessage, AgentFile } from '@/core/agentTypes'
import { MonacoCodeView } from './MonacoEditor'
import { ProjectGallery } from './ProjectGallery'
import { ChatScreen } from './ChatScreen'
import { useProjects } from '@/lib/useProjects'
import { ErrorConsole, injectErrorListener, type ConsoleError } from './ErrorConsole'
import { VersionPanel } from './VersionPanel'
import { useVersionHistory } from '@/lib/useVersionHistory'
import { ErrorBoundary } from './ErrorBoundary'
import { ModelPicker, getModelLabel } from './ModelPicker'

// ─── Types ─────────────────────────────────────────────────────
type PreviewTab  = 'preview' | 'code'
type PreviewSize = 'M' | 'T' | 'D'

interface StreamEvent {
  type:   'status' | 'chunk' | 'result' | 'error' | 'model'
  text?:  string
  data?:  AgentResult
  model?: string
}

interface AgentResult {
  stage:      string
  summary:    string
  entryPoint?: string
  files:      AgentFile[]
  _model?:    string
}

// ─── Constants ─────────────────────────────────────────────────
const PREVIEW_WIDTH: Record<PreviewSize, string> = { M: '390px', T: '768px', D: '100%' }

// MODEL_OPTIONS и BADGE_COLORS теперь в ModelPicker.tsx (единый реестр из providers.ts)

const EXAMPLES = [
  'Игра Snake на Canvas',
  'Калькулятор процентов с историей',
  'Менеджер задач с drag & drop',
  'Таймер Помодоро',
  'Конвертер валют',
  'Лендинг для SaaS продукта',
]

// Suggested actions shown after generation
const SUGGESTIONS: Record<string, string[]> = {
  default: [
    'Добавь тёмную/светлую тему',
    'Сделай более красивый дизайн',
    'Добавь анимации и переходы',
    'Оптимизируй для мобильных',
  ],
  game: [
    'Добавь таблицу рекордов',
    'Добавь звуковые эффекты',
    'Увеличь сложность игры',
    'Добавь новый уровень',
  ],
  calculator: [
    'Добавь историю вычислений',
    'Добавь научные функции',
    'Сделай красивее',
    'Добавь конвертер валют',
  ],
}

function getSuggestions(prompt: string): string[] {
  const lower = prompt.toLowerCase()
  if (/игр|game|canvas|snake|tetris/i.test(lower)) return SUGGESTIONS.game
  if (/калькулятор|calculator/i.test(lower)) return SUGGESTIONS.calculator
  return SUGGESTIONS.default
}

// ─── Logo ──────────────────────────────────────────────────────
function Logo() {
  return (
    <span className="text-sm font-semibold tracking-tight text-white flex items-center gap-1.5">
      <span className="w-3 h-3 rounded-full bg-white inline-block flex-shrink-0" />
      COMBI
    </span>
  )
}


// ─── Message renderer ──────────────────────────────────────────
function renderContent(text: string) {
  const lines = text.split('\n')
  const elements: React.ReactNode[] = []
  let bullets: string[] = []

  const flushBullets = () => {
    if (bullets.length) {
      elements.push(
        <ul key={`ul-${elements.length}`} className="mt-1.5 space-y-1">
          {bullets.map((b, i) => (
            <li key={i} className="flex gap-2 text-[12px] text-white/55 leading-snug">
              <span className="text-white/20 flex-shrink-0 mt-0.5">▸</span>
              <span>{b}</span>
            </li>
          ))}
        </ul>
      )
      bullets = []
    }
  }

  lines.forEach((line, i) => {
    const trimmed = line.trim()
    if (trimmed.startsWith('- ') || trimmed.startsWith('• ')) {
      bullets.push(trimmed.slice(2))
    } else {
      flushBullets()
      if (trimmed) elements.push(
        <p key={i} className="text-[13px] leading-relaxed">{trimmed}</p>
      )
    }
  })
  flushBullets()
  return <div className="space-y-1">{elements}</div>
}

// ─── Status indicator ──────────────────────────────────────────
function StatusDots({ text }: { text: string }) {
  return (
    <div className="flex gap-2.5 items-start">
      <div className="w-5 h-5 rounded-full bg-white/10 flex-shrink-0 flex items-center justify-center text-[9px] mt-0.5 border border-white/10">
        ✦
      </div>
      <div className="flex items-center gap-2 pt-1">
        <div className="flex items-center gap-1">
          {[0, 100, 200].map(d => (
            <span key={d} className="w-1.5 h-1.5 bg-white/30 rounded-full animate-bounce"
              style={{ animationDelay: `${d}ms` }} />
          ))}
        </div>
        <span className="text-[12px] text-white/30 animate-pulse">{text}</span>
      </div>
    </div>
  )
}

// ─── Chat message ──────────────────────────────────────────────
function ChatMsg({ msg, onSuggestion }: {
  msg: ChatMessage
  onSuggestion?: (text: string) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const isUser = msg.role === 'user'

  if (isUser) return (
    <div className="flex justify-end">
      <div className="max-w-[88%] px-4 py-2.5 rounded-2xl rounded-tr-sm bg-white/[0.08] border border-white/[0.07] text-[13px] text-white leading-relaxed">
        {msg.content}
      </div>
    </div>
  )

  const hasFiles = msg.files && msg.files.length > 0

  return (
    <div className="space-y-2">
      <div className="flex gap-2.5">
        <div className="w-5 h-5 rounded-full bg-white/10 flex-shrink-0 flex items-center justify-center text-[9px] mt-0.5 border border-white/10">
          ✦
        </div>
        <div className="flex-1 min-w-0">
          <div className={`text-[13px] leading-relaxed ${msg.stage === 'error' ? 'text-red-400' : 'text-white/80'}`}>
            {renderContent(msg.content)}
          </div>

          {hasFiles && (
            <button
              onClick={() => setExpanded(v => !v)}
              className="mt-2 flex items-center gap-1.5 text-[11px] text-white/30 hover:text-white/55 transition-colors"
            >
              <span className={`transition-transform duration-200 ${expanded ? 'rotate-90' : ''}`}>›</span>
              {msg.files?.length} файл{(msg.files?.length ?? 0) !== 1 ? 'а' : ''}
            </button>
          )}

          {hasFiles && expanded && (
            <div className="mt-2 space-y-1 pl-3 border-l border-white/[0.08]">
              {msg.files?.map(f => (
                <div key={f.path} className="flex items-center gap-2 text-[11px] text-white/30 font-mono">
                  <span>📄</span><span>{f.path}</span>
                  <span className="text-white/15">{(f.content.length / 1024).toFixed(1)}k</span>
                </div>
              ))}
            </div>
          )}

          {msg.model && (
            <div className="mt-1.5 text-[10px] text-white/15 font-mono">via {shortModel(msg.model)}</div>
          )}

          {/* Suggested actions */}
          {msg.suggestions && msg.suggestions.length > 0 && onSuggestion && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {msg.suggestions.map(s => (
                <button
                  key={s}
                  onClick={() => onSuggestion(s)}
                  className="px-3 py-1.5 rounded-full text-[11px] border border-white/[0.08] text-white/40
                             hover:border-white/20 hover:text-white/70 bg-white/[0.02] hover:bg-white/[0.04]
                             transition-all"
                >
                  {s}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// Extract partial HTML from streaming JSON response
function extractPartialHtml(accumulated: string): string | null {
  // First try: the content field is complete enough to extract a full HTML string
  // Match "content": "..." where the string value might be incomplete
  const idx = accumulated.search(/"content"\s*:\s*"/)
  if (idx === -1) return null

  // Find the start of the value
  const valStart = accumulated.indexOf('"', accumulated.indexOf(':', idx) + 1) + 1
  if (valStart <= 0) return null

  let raw = ''
  let i = valStart
  while (i < accumulated.length) {
    const ch = accumulated[i]
    if (ch === '\\' && i + 1 < accumulated.length) {
      const next = accumulated[i + 1]
      if (next === 'n')       { raw += '\n'; i += 2 }
      else if (next === '"')  { raw += '"';  i += 2 }
      else if (next === '\\') { raw += '\\'; i += 2 }
      else if (next === 't')  { raw += '\t'; i += 2 }
      else if (next === 'r')  { i += 2 }
      else { raw += ch; i++ }
    } else if (ch === '"') {
      break // End of JSON string
    } else {
      raw += ch; i++
    }
  }

  // Only return if it looks like HTML
  if (raw.includes('<html') || raw.includes('<!DOCTYPE') || raw.includes('<body')) return raw
  return null
}

function shortModel(model?: string): string {
  if (!model) return ''
  if (model.includes('flash')) return 'Gemini Flash'
  if (model.includes('3.1-pro')) return 'Gemini 3.1 Pro'
  if (model.includes('3-pro')) return 'Gemini 3 Pro'
  if (model.includes('2.5-pro') || model.includes('pro-preview')) return 'Gemini 2.5 Pro'
  if (model.includes('deepseek')) return 'DeepSeek'
  if (model.includes('haiku')) return 'Claude Haiku'
  if (model.includes('sonnet')) return 'Claude Sonnet'
  return model.split('/').at(-1)?.split('-').slice(0, 2).join('-') ?? ''
}

// ─── Landing screen ────────────────────────────────────────────
function LandingScreen({ onSend, isGenerating, selectedModel, onModelChange }: {
  onSend: (t: string) => void
  isGenerating: boolean
  selectedModel: string
  onModelChange: (m: string) => void
}) {
  const [input, setInput] = useState('')
  const [showPicker, setShowPicker] = useState(false)
  const ref = useRef<HTMLTextAreaElement>(null)
  const submit = () => { const t = input.trim(); if (!t || isGenerating) return; onSend(t); setInput('') }

  return (
    <div className="flex flex-col h-screen" onClick={() => setShowPicker(false)}>
      <header className="flex items-center justify-between px-6 h-14 border-b border-white/[0.06] flex-shrink-0">
        <Logo />
        <div className="flex items-center gap-1 text-[13px] text-white/40">
          <span className="px-3 py-1.5 hover:text-white/70 cursor-pointer transition-colors rounded-lg hover:bg-white/[0.04]">FAQ</span>
          <span className="px-3 py-1.5 hover:text-white/70 cursor-pointer transition-colors rounded-lg hover:bg-white/[0.04]">Docs</span>
        </div>
      </header>

      <div className="flex-1 flex flex-col items-center justify-center px-4">
        <div className="w-full max-w-2xl">
          <h1 className="text-[2.5rem] font-semibold text-center mb-2 tracking-tight leading-tight">
            Что хочешь построить?
          </h1>
          <p className="text-center text-white/35 text-sm mb-8">
            Опиши приложение, игру или инструмент — ИИ построит его мгновенно
          </p>

          <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] focus-within:border-white/20 transition-colors">
            <textarea
              ref={ref} value={input} onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit() } }}
              placeholder="Опиши своё приложение..."
              className="w-full bg-transparent px-5 pt-5 pb-2 text-[15px] text-white placeholder-white/20 resize-none outline-none leading-relaxed rounded-t-2xl"
              rows={3} disabled={isGenerating} autoFocus
            />
            <div className="flex items-center justify-between px-4 pb-4 pt-2 gap-3">
              <ModelPicker
                selectedModel={selectedModel}
                onSelect={m => { onModelChange(m); setShowPicker(false) }}
                open={showPicker}
                onToggle={() => setShowPicker(v => !v)}
                position="top"
              />

              <button onClick={submit} disabled={isGenerating || !input.trim()}
                className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-medium bg-white text-black hover:bg-white/90 disabled:opacity-30 disabled:cursor-not-allowed transition-all ml-auto">
                {isGenerating
                  ? <><span className="flex gap-1">{[0, 1, 2].map(i => <span key={i} className="w-1 h-1 bg-black rounded-full animate-bounce" style={{ animationDelay: `${i * 100}ms` }} />)}</span> Строю...</>
                  : 'Построить →'}
              </button>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-2 justify-center">
            {EXAMPLES.map(ex => (
              <button key={ex} onClick={() => { setInput(ex); ref.current?.focus() }}
                className="px-3 py-1.5 rounded-full text-xs text-white/35 border border-white/[0.07] hover:border-white/20 hover:text-white/60 transition-all bg-white/[0.02]">
                {ex}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Main shell ────────────────────────────────────────────────
type Screen = 'gallery' | 'landing' | 'builder' | 'chat'

export default function BuilderShell() {
  const [screen,         setScreen]         = useState<Screen>('gallery')
  const [projectId,      setProjectId]      = useState<string>(() => crypto.randomUUID())
  const [messages,       setMessages]       = useState<ChatMessage[]>([])
  const [files,          setFiles]          = useState<AgentFile[]>([])
  const [activeFile,     setActiveFile]     = useState<string | null>(null)
  const [previewUrl,     setPreviewUrl]     = useState<string | null>(null)
  const [isGenerating,   setIsGenerating]   = useState(false)
  const [statusText,     setStatusText]     = useState('')
  const [previewSize,    setPreviewSize]    = useState<PreviewSize>('D')
  const [previewTab,     setPreviewTab]     = useState<PreviewTab>('preview')
  const [chatInput,      setChatInput]      = useState('')
  const [projectName,    setProjectName]    = useState('')
  const [selectedModel,  setSelectedModel]  = useState<string>('auto')
  const [showModelPicker, setShowModelPicker] = useState(false)
  const [firstUserMsg,   setFirstUserMsg]   = useState('')
  const [isFixing,       setIsFixing]       = useState(false)
  const [showVersions,   setShowVersions]   = useState(false)
  const [activeModel,    setActiveModel]    = useState<string>('')  // actual model used, from API
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const iframeRef      = useRef<HTMLIFrameElement>(null)

  const { versions, push: pushVersion, undo, redo, restore, canUndo, canRedo, cursor: vCursor } = useVersionHistory()

  const { projects, saveProject, deleteProject, loadProject } = useProjects()

  const scrollToBottom = () =>
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)

  // Autosave whenever files/messages change
  useEffect(() => {
    if (files.length === 0) return
    saveProject(projectId, projectName, messages, files, activeFile)
  }, [files, messages]) // eslint-disable-line react-hooks/exhaustive-deps

  // Close model picker on outside click
  useEffect(() => {
    const handler = () => setShowModelPicker(false)
    document.addEventListener('click', handler)
    return () => document.removeEventListener('click', handler)
  }, [])

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const mod = e.ctrlKey || e.metaKey
      if (mod && e.key === 'z' && !e.shiftKey && canUndo) { e.preventDefault(); undo() }
      if ((mod && e.key === 'y') || (mod && e.shiftKey && e.key === 'z')) {
        if (canRedo) { e.preventDefault(); redo() }
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [canUndo, canRedo, undo, redo])

  const openProject = useCallback(async (meta: { id: string }) => {
    const p = await loadProject(meta.id)
    if (!p) return
    setProjectId(p.id)
    setProjectName(p.name)
    setMessages(p.messages)
    setFiles(p.files)
    setActiveFile(p.activeFile)
    // Multi-file preview
    if (p.files.length > 0) {
      const entry = p.files.find(f => f.path.endsWith('.html'))
      if (entry) {
        setPreviewUrl(previewManager.buildFromFiles(
          p.files.map(f => ({ ...f, content: f.path.endsWith('.html') ? injectErrorListener(f.content) : f.content })),
          entry.path
        ))
      }
    } else {
      setPreviewUrl(null)
    }
    setFirstUserMsg(p.messages.find(m => m.role === 'user')?.content ?? '')
    setScreen('builder')
  }, [loadProject])

  const startNew = () => {
    setProjectId(crypto.randomUUID())
    setMessages([])
    setFiles([])
    setActiveFile(null)
    setPreviewUrl(null)
    setProjectName('')
    setFirstUserMsg('')
    setScreen('landing')
  }

  const runAgent = useCallback(async (text: string) => {
    setIsGenerating(true)
    setStatusText('Подключаюсь...')

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(), role: 'user', content: text, ts: Date.now(),
    }
    const next = [...messages, userMsg]
    setMessages(next)
    if (!projectName && messages.length === 0) {
      setProjectName(text.slice(0, 40))
      setFirstUserMsg(text)
    }
    scrollToBottom()

    try {
      const res = await fetch('/api/agent/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: next,
          projectFiles: files,
          model: selectedModel === 'auto' ? undefined : selectedModel,
        }),
      })

      if (!res.body) throw new Error('No response body')

      // Stream reading
      const reader  = res.body.getReader()
      const decoder = new TextDecoder()
      let buf            = ''
      let result: AgentResult | null = null
      let errorText: string | null   = null
      let accumulated    = ''       // raw AI output accumulating
      let lastPreviewUpd = 0        // throttle preview updates

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buf += decoder.decode(value, { stream: true })
        const lines = buf.split('\n')
        buf = lines.pop() ?? ''

        for (const line of lines) {
          if (!line.trim()) continue
          try {
            const event: StreamEvent = JSON.parse(line)

            if (event.type === 'status' && event.text) {
              setStatusText(event.text)
            } else if (event.type === 'model' && event.model) {
              setActiveModel(event.model)
            } else if (event.type === 'chunk' && event.text) {
              // Accumulate chunks and do live HTML preview
              accumulated += event.text
              const now = Date.now()
              if (now - lastPreviewUpd > 1000) {
                lastPreviewUpd = now
                // AI returns JSON with HTML in "content" field — extract it
                const partial = extractPartialHtml(accumulated)
                if (partial && partial.length > 200) {
                  setPreviewUrl(previewManager.buildFromHtml(injectErrorListener(partial)))
                  setPreviewTab('preview')
                }
              }
            } else if (event.type === 'result' && event.data) {
              result = event.data
            } else if (event.type === 'error' && event.text) {
              errorText = event.text
            }
          } catch { /* skip malformed */ }
        }
      }

      if (errorText) throw new Error(errorText)

      if (result?.files?.length) {
        // Diff-merge: если это edit — мержим файлы, а не заменяем
        const isEditResult = files.length > 0
        let mergedFiles: AgentFile[]
        if (isEditResult) {
          // AI вернул только изменённые файлы — мержим
          const existingMap = new Map(files.map(f => [f.path, f]))
          for (const f of result.files) existingMap.set(f.path, f)
          mergedFiles = Array.from(existingMap.values())
        } else {
          mergedFiles = result.files
        }
        setFiles(mergedFiles)
        const entry = mergedFiles.find(f => f.path === result?.entryPoint)
          ?? mergedFiles.find(f => f.path.endsWith('.html'))
          ?? mergedFiles[0]
        setActiveFile(entry.path)
        // Multi-file preview
        setPreviewUrl(previewManager.buildFromFiles(
          mergedFiles.map(f => ({ ...f, content: f.path.endsWith('.html') ? injectErrorListener(f.content) : f.content })),
          entry.path
        ))
        setPreviewTab('preview')
      }

      // Push to version history
      if (result?.files?.length) {
        pushVersion(result.files, result.summary?.split('\n')[0] ?? text.slice(0, 60))
      }

      const prompt = firstUserMsg || text
      setMessages(prev => [...prev, {
        id:          crypto.randomUUID(),
        role:        'assistant',
        content:     result?.summary ?? 'Готово.',
        files:       result?.files ?? [],
        stage:       result?.stage as import('@/core/agentTypes').AgentStage | undefined,
        model:       result?._model,
        ts:          Date.now(),
        suggestions: getSuggestions(prompt),
      }])

    } catch (err) {
      setMessages(prev => [...prev, {
        id:      crypto.randomUUID(),
        role:    'assistant',
        content: `Ошибка: ${err instanceof Error ? err.message : String(err)}`,
        stage:   'error',
        ts:      Date.now(),
      }])
    } finally {
      setIsGenerating(false)
      setStatusText('')
      scrollToBottom()
    }
  }, [messages, files, projectName, selectedModel, firstUserMsg])

  const handleDownload = useCallback(async () => {
    if (files.length === 0) return

    if (files.length === 1) {
      // Single file — direct download
      const file = files[0]
      const a = Object.assign(document.createElement('a'), {
        href:     URL.createObjectURL(new Blob([file.content], { type: 'text/html' })),
        download: file.path,
      })
      a.click(); URL.revokeObjectURL(a.href)
      return
    }

    // Multiple files — ZIP
    const JSZip = (await import('jszip')).default
    const zip   = new JSZip()
    const name  = (projectName || 'project').replace(/\s+/g, '-').toLowerCase()
    const folder = zip.folder(name)!
    files.forEach(f => folder.file(f.path, f.content))
    const blob = await zip.generateAsync({ type: 'blob' })
    const a = Object.assign(document.createElement('a'), {
      href:     URL.createObjectURL(blob),
      download: `${name}.zip`,
    })
    a.click(); URL.revokeObjectURL(a.href)
  }, [files, activeFile, projectName])

  const handleAutoFix = useCallback(async (errors: ConsoleError[]) => {
    setIsFixing(true)
    const errText = errors.map(e => `- ${e.message}${e.line ? ` (line ${e.line})` : ''}`).join('\n')
    await runAgent(`Исправь следующие JavaScript ошибки в коде:\n${errText}`)
    setIsFixing(false)
  }, [runAgent])

  const sendChat = () => {
    const t = chatInput.trim()
    if (!t || isGenerating) return
    setChatInput('')
    runAgent(t)
  }

  const activeFileObj = files.find(f => f.path === activeFile)

  // ── Gallery ──────────────────────────────────────────────────
  if (screen === 'chat') {
    return <ChatScreen onBack={() => setScreen('gallery')} />
  }

  if (screen === 'gallery') {
    return (
      <ProjectGallery
        projects={projects}
        onOpen={openProject}
        onDelete={deleteProject}
        onNew={startNew}
        onChat={() => setScreen('chat')}
      />
    )
  }

  // ── Landing ─────────────────────────────────────────────────
  if (screen === 'landing' && messages.length === 0 && !isGenerating) {
    return (
      <LandingScreen
        onSend={t => { setScreen('builder'); runAgent(t) }}
        isGenerating={isGenerating}
        selectedModel={selectedModel}
        onModelChange={setSelectedModel}
      />
    )
  }

  // ── Builder ─────────────────────────────────────────────────
  return (
    <div className="h-screen bg-[#0a0a0a] flex flex-col overflow-hidden">

      {/* Header */}
      <header className="flex items-center h-12 border-b border-white/[0.06] flex-shrink-0 px-3 gap-3">
        <button
          onClick={() => setScreen('gallery')}
          className="p-1.5 rounded-lg text-white/30 hover:text-white/70 hover:bg-white/[0.05] transition-all flex-shrink-0 text-lg"
          title="На главную"
        >‹</button>

        <div className="flex items-center gap-1.5 min-w-0 flex-1">
          <span className="text-[13px] font-medium text-white truncate max-w-[200px]">
            {projectName || 'Новый проект'}
          </span>
          <span className="text-white/20 text-xs">›</span>
        </div>

        <div className="flex items-center gap-1.5 flex-shrink-0">
          {/* Preview size */}
          <div className="flex items-center rounded-lg border border-white/[0.06] overflow-hidden">
            {(['M', 'T', 'D'] as PreviewSize[]).map(s => (
              <button key={s} onClick={() => setPreviewSize(s)}
                className={`px-2.5 h-7 text-xs font-medium transition-colors ${
                  previewSize === s ? 'bg-white/10 text-white' : 'text-white/30 hover:text-white/60'
                }`}>{s}</button>
            ))}
          </div>

          <button onClick={handleDownload} disabled={files.length === 0}
            className="flex items-center gap-1.5 px-3 h-8 rounded-lg text-[12px] font-medium
                       border border-white/[0.08] text-white/50 hover:text-white hover:border-white/20
                       disabled:opacity-20 disabled:cursor-not-allowed transition-all">
            ↓ Export
          </button>

          <button
            onClick={() => {
              const w = window.open('', '_blank')
              if (w && activeFileObj) { w.document.write(activeFileObj.content); w.document.close() }
            }}
            disabled={!previewUrl}
            className="flex items-center gap-1.5 px-4 h-8 rounded-lg text-[12px] font-semibold
                       bg-white text-black hover:bg-white/90
                       disabled:opacity-20 disabled:cursor-not-allowed transition-all">
            ↗ Open
          </button>
        </div>
      </header>

      {/* Body */}
      <div className="flex-1 flex overflow-hidden">

        {/* Chat sidebar */}
        <div className="w-[285px] flex-shrink-0 border-r border-white/[0.06] flex flex-col bg-[#0a0a0a]">

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5">
            {messages.map(msg => (
              <ChatMsg
                key={msg.id}
                msg={msg}
                onSuggestion={text => { if (!isGenerating) runAgent(text) }}
              />
            ))}

            {isGenerating && <StatusDots text={statusText} />}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-3 border-t border-white/[0.06] flex-shrink-0">
            <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] overflow-hidden focus-within:border-white/15 transition-colors">
              <textarea
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendChat() } }}
                placeholder={files.length > 0 ? 'Что изменить?' : 'Опиши приложение...'}
                rows={2}
                disabled={isGenerating}
                className="w-full bg-transparent px-3 pt-3 pb-1 text-[13px] text-white placeholder-white/20 resize-none outline-none leading-relaxed"
              />
              <div className="flex items-center justify-between px-3 pb-2 pt-1 relative">
                <ModelPicker
                  selectedModel={selectedModel}
                  onSelect={m => { setSelectedModel(m); setShowModelPicker(false) }}
                  open={showModelPicker}
                  onToggle={() => setShowModelPicker(v => !v)}
                  activeModel={activeModel}
                  position="bottom"
                  compact
                />

                <button onClick={sendChat} disabled={isGenerating || !chatInput.trim()}
                  className="w-7 h-7 rounded-lg bg-white text-black text-sm font-semibold flex items-center justify-center hover:bg-white/90 disabled:opacity-25 disabled:cursor-not-allowed transition-all">
                  →
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Preview panel */}
        <ErrorBoundary fallbackMessage="Ошибка в превью — попробуйте перегенерировать">
        <div className="flex-1 flex flex-col overflow-hidden bg-[#0d0d0d]">

          {/* Tabs */}
          <div className="flex items-center border-b border-white/[0.06] px-3 h-10 gap-3 flex-shrink-0">
            <div className="flex items-center gap-0.5">
              {(['code', 'preview'] as PreviewTab[]).map(tab => (
                <button key={tab}
                  onClick={() => setPreviewTab(tab)}
                  className={`flex items-center gap-1.5 px-3 h-7 rounded-lg text-[12px] font-medium transition-colors ${
                    previewTab === tab ? 'bg-white/10 text-white' : 'text-white/35 hover:text-white/60'
                  }`}
                >
                  {tab === 'code' ? <><span className="text-[10px]">{'</>'}</span> Код</> : <><span>👁</span> Превью</>}
                </button>
              ))}
            </div>

            <div className="w-px h-4 bg-white/[0.06]" />

            {/* File tabs */}
            <div className="flex items-center gap-1 overflow-x-auto flex-1 min-w-0">
              {files.map(f => (
                <button key={f.path}
                  onClick={() => {
                    setActiveFile(f.path)
                    if (f.path.endsWith('.html')) setPreviewUrl(previewManager.buildFromHtml(injectErrorListener(f.content)))
                  }}
                  className={`flex items-center gap-1.5 px-2.5 h-6 rounded-md text-[11px] font-mono flex-shrink-0 transition-colors ${
                    activeFile === f.path
                      ? 'bg-white/10 text-white border border-white/10'
                      : 'text-white/30 hover:text-white/60 border border-transparent hover:border-white/[0.06]'
                  }`}
                >{f.path}</button>
              ))}
            </div>

            {/* Regenerate button */}
            {/* Undo / Redo */}
            <div className="flex items-center gap-0.5 flex-shrink-0">
              <button onClick={undo} disabled={!canUndo} title="Undo (Ctrl+Z)"
                className="px-2 h-6 rounded-md text-[11px] text-white/30 hover:text-white/60 border border-white/[0.06] hover:border-white/15 disabled:opacity-20 transition-all">↩</button>
              <button onClick={redo} disabled={!canRedo} title="Redo (Ctrl+Y)"
                className="px-2 h-6 rounded-md text-[11px] text-white/30 hover:text-white/60 border border-white/[0.06] hover:border-white/15 disabled:opacity-20 transition-all">↪</button>
            </div>

            {/* Version history */}
            <div className="relative flex-shrink-0" onClick={e => e.stopPropagation()}>
              <button onClick={() => setShowVersions(v => !v)}
                className="flex items-center gap-1 px-2.5 h-6 rounded-md text-[11px] text-white/30 hover:text-white/60 border border-white/[0.06] hover:border-white/15 transition-all"
                title="История версий">
                ⏱ {versions.length > 0 ? versions.length : ''}
              </button>
              {showVersions && (
                <VersionPanel versions={versions} cursor={vCursor}
                  onRestore={id => { restore(id); setShowVersions(false) }}
                  onClose={() => setShowVersions(false)} />
              )}
            </div>

            {/* Regenerate */}
            {files.length > 0 && !isGenerating && (
              <button
                onClick={() => { const last = messages.filter(m => m.role === 'user').at(-1)?.content; if (last) runAgent(last) }}
                className="flex items-center gap-1 px-2.5 h-6 rounded-md text-[11px] text-white/30 hover:text-white/60 border border-white/[0.06] hover:border-white/15 transition-all flex-shrink-0"
                title="Перегенерировать">
                ↺ Повтор
              </button>
            )}
          </div>

          {/* Content */}
          {previewTab === 'code' ? (
            activeFileObj ? (
              <MonacoCodeView
                filePath={activeFileObj.path}
                value={activeFileObj.content}
                onChange={newVal => {
                  setFiles(prev => prev.map(f =>
                    f.path === activeFileObj.path ? { ...f, content: newVal } : f
                  ))
                  if (activeFileObj.path.endsWith('.html')) {
                    setPreviewUrl(previewManager.buildFromHtml(injectErrorListener(newVal)))
                  }
                }}
              />
            ) : (
              <div className="flex-1 flex items-center justify-center text-white/20 text-sm">
                Нет файла
              </div>
            )
          ) : previewUrl ? (
            <div className="flex-1 flex items-stretch overflow-hidden p-4">
              <div
                className={`mx-auto flex flex-col overflow-hidden border border-white/[0.08] shadow-2xl transition-all duration-300 ease-out ${
                  previewSize === 'M' ? 'rounded-[2.5rem] border-2 border-white/20' : 'rounded-xl'
                }`}
                style={{ width: PREVIEW_WIDTH[previewSize] }}
              >
                {/* Phone notch */}
                {previewSize === 'M' && (
                  <div className="h-8 bg-black flex-shrink-0 flex items-center justify-center rounded-t-[2.5rem]">
                    <div className="w-24 h-5 bg-black rounded-full border border-white/10 flex items-center justify-center">
                      <div className="w-2 h-2 bg-white/10 rounded-full" />
                    </div>
                  </div>
                )}

                {/* Browser bar */}
                {previewSize !== 'M' && (
                  <div className="flex items-center gap-2 px-4 h-9 bg-[#141414] border-b border-white/[0.06] flex-shrink-0">
                    <div className="flex gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#ff5f57]" />
                      <span className="w-2.5 h-2.5 rounded-full bg-[#febc2e]" />
                      <span className="w-2.5 h-2.5 rounded-full bg-[#28c840]" />
                    </div>
                    <div className="flex-1 mx-3 h-5 rounded bg-white/[0.04] border border-white/[0.05] px-2 flex items-center text-[10px] text-white/20 font-mono">
                      {activeFile ?? 'index.html'}
                    </div>
                  </div>
                )}

                <iframe
                  key={previewUrl}
                  ref={iframeRef}
                  src={previewUrl}
                  sandbox="allow-scripts allow-same-origin allow-forms"
                  className={`flex-1 w-full ${previewSize === 'M' ? 'rounded-b-[2.5rem]' : ''}`}
                  title="App preview"
                />
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="w-14 h-14 rounded-2xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-xl mx-auto mb-3">✦</div>
                <p className="text-sm text-white/25">Превью появится здесь</p>
                {isGenerating && (
                  <p className="text-xs text-white/15 mt-1 animate-pulse">{statusText || 'Генерирую...'}</p>
                )}
              </div>
            </div>
          )}

          {/* Error console */}
          <ErrorConsole
            iframeRef={iframeRef}
            onAutoFix={handleAutoFix}
            isFixing={isFixing}
          />
        </div>
        </ErrorBoundary>
      </div>
    </div>
  )
}
