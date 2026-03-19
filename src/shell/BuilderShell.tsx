'use client'

import { useCallback, useRef, useState } from 'react'
import { previewManager } from '@/preview/PreviewManager'
import type { ChatMessage, AgentFile, AgentResponse } from '@/core/agentTypes'

// ─── Logo ─────────────────────────────────────────────────────
function Logo() {
  return (
    <span className="text-sm font-semibold tracking-tight text-white flex items-center gap-1.5">
      <span className="w-3.5 h-3.5 rounded-full bg-white inline-block flex-shrink-0" />
      local-ai-builder
    </span>
  )
}

// ─── Landing ───────────────────────────────────────────────────
const EXAMPLES = [
  'Калькулятор процентов с историей',
  'Игра Snake на Canvas',
  'Менеджер задач с drag & drop',
  'Таймер Помодоро',
  'Конвертер единиц',
  'Лендинг для SaaS',
]

function LandingScreen({ onSend, isGenerating }: { onSend: (t: string) => void; isGenerating: boolean }) {
  const [input, setInput] = useState('')
  const ref = useRef<HTMLTextAreaElement>(null)
  const submit = () => { const t = input.trim(); if (!t || isGenerating) return; onSend(t); setInput('') }

  return (
    <div className="flex flex-col h-screen">
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
            What do you want to build?
          </h1>
          <p className="text-center text-white/35 text-sm mb-8">
            Describe your web app, game, or tool — AI will build it instantly
          </p>
          <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] overflow-hidden focus-within:border-white/20 transition-colors">
            <textarea
              ref={ref} value={input} onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit() } }}
              placeholder="Опиши своё приложение..."
              className="w-full bg-transparent px-5 pt-5 pb-2 text-[15px] text-white placeholder-white/20 resize-none outline-none leading-relaxed"
              rows={3} disabled={isGenerating} autoFocus
            />
            <div className="flex items-center justify-between px-4 pb-4 pt-2">
              <span className="text-xs text-white/20">Enter — отправить · Shift+Enter — перенос</span>
              <button onClick={submit} disabled={isGenerating || !input.trim()}
                className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-medium bg-white text-black hover:bg-white/90 disabled:opacity-30 disabled:cursor-not-allowed transition-all">
                {isGenerating
                  ? <><span className="flex gap-1">{[0,1,2].map(i=><span key={i} className="w-1 h-1 bg-black rounded-full animate-bounce" style={{animationDelay:`${i*100}ms`}}/>)}</span> Building...</>
                  : 'Build →'}
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

// ─── Message renderer ─────────────────────────────────────────
function renderContent(text: string) {
  const lines = text.split('\n')
  const elements: React.ReactNode[] = []
  let bullets: string[] = []

  const flushBullets = () => {
    if (bullets.length) {
      elements.push(
        <ul key={`ul-${elements.length}`} className="mt-2 space-y-1">
          {bullets.map((b, i) => (
            <li key={i} className="flex gap-2 text-[12px] text-white/60 leading-snug">
              <span className="text-white/20 flex-shrink-0 mt-0.5">•</span>
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
      if (trimmed) {
        elements.push(<p key={i} className="text-[13px] leading-relaxed">{trimmed}</p>)
      }
    }
  })
  flushBullets()
  return <div className="space-y-1">{elements}</div>
}

// ─── Chat message ─────────────────────────────────────────────
function ChatMsg({ msg }: { msg: ChatMessage }) {
  const [expanded, setExpanded] = useState(false)
  const isUser = msg.role === 'user'

  if (isUser) {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] px-4 py-3 rounded-2xl rounded-tr-sm bg-white/[0.08] border border-white/[0.08] text-[13px] text-white leading-relaxed">
          {msg.content}
        </div>
      </div>
    )
  }

  const hasFiles = msg.files && msg.files.length > 0

  return (
    <div className="space-y-2">
      <div className="flex gap-2.5">
        <div className="w-5 h-5 rounded-full bg-white/10 flex-shrink-0 flex items-center justify-center text-[9px] mt-0.5 border border-white/10">✦</div>
        <div className="flex-1 min-w-0">
          <div className={`text-[13px] leading-relaxed ${msg.stage === 'error' ? 'text-red-400' : 'text-white/80'}`}>
            {renderContent(msg.content)}
          </div>

          {hasFiles && (
            <button
              onClick={() => setExpanded(v => !v)}
              className="mt-2 flex items-center gap-1.5 text-[11px] text-white/30 hover:text-white/60 transition-colors"
            >
              <span className={`transition-transform duration-200 ${expanded ? 'rotate-90' : ''}`}>›</span>
              Made {msg.files?.length} file{(msg.files?.length ?? 0) !== 1 ? 's' : ''}
            </button>
          )}

          {hasFiles && expanded && (
            <div className="mt-2 space-y-1 pl-3 border-l border-white/[0.08]">
              {msg.files?.map(f => (
                <div key={f.path} className="flex items-center gap-2 text-[11px] text-white/30 font-mono">
                  <span>📄</span><span>{f.path}</span>
                  <span className="text-white/15">{(f.content.length/1024).toFixed(1)}k</span>
                </div>
              ))}
            </div>
          )}

          {msg.model && (
            <div className="mt-2 text-[10px] text-white/15 font-mono">
              via {shortModel(msg.model)}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Code viewer ──────────────────────────────────────────────
function CodeView({ file }: { file: AgentFile | undefined }) {
  if (!file) return <div className="flex-1 flex items-center justify-center text-white/20 text-sm">No file selected</div>
  return (
    <div className="flex-1 overflow-auto p-4">
      <pre className="text-[11px] font-mono text-white/60 leading-relaxed whitespace-pre-wrap break-all">
        {file.content}
      </pre>
    </div>
  )
}

// ─── Preview panel ────────────────────────────────────────────
type PreviewTab = 'preview' | 'code'
type PreviewSize = 'M' | 'T' | 'D'
const PREVIEW_WIDTH: Record<PreviewSize, string> = { M: '375px', T: '768px', D: '100%' }

// ─── Model labels ─────────────────────────────────────────────
const MODEL_OPTIONS = [
  { key: 'auto',           label: '✦ Auto',          desc: 'Авто-выбор лучшей модели' },
  { key: 'gemini-flash',   label: '⚡ Gemini Flash',  desc: 'Быстро и дёшево' },
  { key: 'gemini-pro',     label: '🧠 Gemini Pro',    desc: 'Сложные приложения и игры' },
  { key: 'deepseek-coder', label: '💻 DeepSeek',      desc: 'Сильный в коде' },
  { key: 'claude-haiku',   label: '🎨 Claude Haiku',  desc: 'Креативный UI' },
] as const

function shortModel(model?: string): string {
  if (!model) return ''
  if (model.includes('flash')) return 'Flash'
  if (model.includes('2.5-pro') || model.includes('pro-preview')) return 'Pro'
  if (model.includes('deepseek')) return 'DeepSeek'
  if (model.includes('haiku')) return 'Haiku'
  if (model.includes('sonnet')) return 'Sonnet'
  return model.split('/').at(-1)?.split('-').slice(0,2).join('-') ?? ''
}

// ─── Main shell ───────────────────────────────────────────────
export default function BuilderShell() {
  const [messages,     setMessages]     = useState<ChatMessage[]>([])
  const [files,        setFiles]        = useState<AgentFile[]>([])
  const [activeFile,   setActiveFile]   = useState<string | null>(null)
  const [previewUrl,   setPreviewUrl]   = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [previewSize,  setPreviewSize]  = useState<PreviewSize>('D')
  const [previewTab,   setPreviewTab]   = useState<PreviewTab>('preview')
  const [chatInput,    setChatInput]    = useState('')
  const [projectName,  setProjectName]  = useState('')
  const [selectedModel, setSelectedModel] = useState<string>('auto')
  const [showModelPicker, setShowModelPicker] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () =>
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)

  const runAgent = useCallback(async (text: string) => {
    setIsGenerating(true)
    const userMsg: ChatMessage = { id: crypto.randomUUID(), role: 'user', content: text, ts: Date.now() }
    const next = [...messages, userMsg]
    setMessages(next)
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
      const data: AgentResponse & { error?: string } = await res.json()
      if (!res.ok || data.error) throw new Error(data.error ?? `HTTP ${res.status}`)

      if (data.files?.length) {
        setFiles(data.files)
        const entry = data.files.find(f => f.path === data.entryPoint)
          ?? data.files.find(f => f.path.endsWith('.html'))
          ?? data.files[0]
        setActiveFile(entry.path)
        setPreviewUrl(previewManager.buildFromHtml(entry.content))
        setPreviewTab('preview')
        // Extract project name from first generation
        if (!projectName && messages.length === 0) {
          const name = text.slice(0, 40)
          setProjectName(name)
        }
      }

      setMessages(prev => [...prev, {
        id: crypto.randomUUID(), role: 'assistant',
        content: data.summary ?? 'Готово.',
        files: data.files ?? [],
        stage: data.stage,
        model: data._model,
        ts: Date.now(),
      }])
    } catch (err) {
      setMessages(prev => [...prev, {
        id: crypto.randomUUID(), role: 'assistant',
        content: `Ошибка: ${err instanceof Error ? err.message : String(err)}`,
        stage: 'error', ts: Date.now(),
      }])
    } finally {
      setIsGenerating(false)
      scrollToBottom()
    }
  }, [messages, files, projectName])

  const handleDownload = useCallback(() => {
    const file = files.find(f => f.path === activeFile) ?? files[0]
    if (!file) return
    const a = Object.assign(document.createElement('a'), {
      href: URL.createObjectURL(new Blob([file.content], { type: 'text/html' })),
      download: file.path,
    })
    a.click(); URL.revokeObjectURL(a.href)
  }, [files, activeFile])

  const sendChat = () => {
    const t = chatInput.trim()
    if (!t || isGenerating) return
    setChatInput('')
    runAgent(t)
  }

  const activeFileObj = files.find(f => f.path === activeFile)

  // ── Landing ────────────────────────────────────────────────
  if (messages.length === 0 && !isGenerating) {
    return <LandingScreen onSend={runAgent} isGenerating={isGenerating} />
  }

  // ── Builder ────────────────────────────────────────────────
  return (
    <div className="h-screen bg-[#0a0a0a] flex flex-col overflow-hidden">

      {/* ── Header ── */}
      <header className="flex items-center h-12 border-b border-white/[0.06] flex-shrink-0 px-3 gap-3">
        {/* Left: back + project name */}
        <button
          onClick={() => { setMessages([]); setFiles([]); setPreviewUrl(null); setProjectName('') }}
          className="p-1.5 rounded-lg text-white/30 hover:text-white/70 hover:bg-white/[0.05] transition-all flex-shrink-0"
          title="Back to home"
        >
          ‹
        </button>

        <div className="flex items-center gap-1.5 min-w-0 flex-1">
          <span className="text-[13px] font-medium text-white truncate max-w-[200px]">
            {projectName || 'New project'}
          </span>
          <span className="text-white/20 text-xs">›</span>
        </div>

        {/* Right: actions */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {/* Preview size */}
          <div className="flex items-center rounded-lg border border-white/[0.06] overflow-hidden">
            {(['M','T','D'] as PreviewSize[]).map(s => (
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

      {/* ── Body ── */}
      <div className="flex-1 flex overflow-hidden">

        {/* ── Chat sidebar ── */}
        <div className="w-[280px] flex-shrink-0 border-r border-white/[0.06] flex flex-col bg-[#0a0a0a]">

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5">
            {messages.map(msg => <ChatMsg key={msg.id} msg={msg} />)}

            {isGenerating && (
              <div className="flex gap-2.5">
                <div className="w-5 h-5 rounded-full bg-white/10 flex-shrink-0 flex items-center justify-center text-[9px] mt-0.5 border border-white/10">✦</div>
                <div className="flex items-center gap-1 pt-1">
                  {[0,100,200].map(d => (
                    <span key={d} className="w-1.5 h-1.5 bg-white/30 rounded-full animate-bounce"
                          style={{ animationDelay: `${d}ms` }} />
                  ))}
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-3 border-t border-white/[0.06] flex-shrink-0">
            <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] overflow-hidden focus-within:border-white/15 transition-colors">
              <textarea
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendChat() } }}
                placeholder="Describe the app you want to build..."
                rows={2}
                className="w-full bg-transparent px-3 pt-3 pb-1 text-[13px] text-white placeholder-white/20 resize-none outline-none leading-relaxed"
              />
              <div className="flex items-center justify-between px-3 pb-2 pt-1 relative">
                <div className="flex items-center gap-1">
                  {/* Model picker */}
                  <div className="relative">
                    <button
                      onClick={() => setShowModelPicker(v => !v)}
                      className="flex items-center gap-1 px-2 h-6 rounded-md text-[11px] text-white/40 hover:text-white/70 border border-white/[0.06] hover:border-white/15 transition-all"
                    >
                      {MODEL_OPTIONS.find(m => m.key === selectedModel)?.label ?? '✦ Auto'}
                      <span className="text-white/20">▾</span>
                    </button>
                    {showModelPicker && (
                      <div className="absolute bottom-8 left-0 w-52 bg-[#1a1a1a] border border-white/[0.1] rounded-xl shadow-2xl z-50 overflow-hidden">
                        {MODEL_OPTIONS.map(opt => (
                          <button
                            key={opt.key}
                            onClick={() => { setSelectedModel(opt.key); setShowModelPicker(false) }}
                            className={`w-full flex flex-col px-3 py-2.5 text-left hover:bg-white/[0.05] transition-colors ${
                              selectedModel === opt.key ? 'bg-white/[0.05]' : ''
                            }`}
                          >
                            <span className="text-[12px] text-white/80">{opt.label}</span>
                            <span className="text-[10px] text-white/30">{opt.desc}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <button onClick={sendChat} disabled={isGenerating || !chatInput.trim()}
                  className="w-7 h-7 rounded-lg bg-white text-black text-sm font-semibold flex items-center justify-center hover:bg-white/90 disabled:opacity-25 disabled:cursor-not-allowed transition-all">
                  →
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ── Preview panel ── */}
        <div className="flex-1 flex flex-col overflow-hidden bg-[#0d0d0d]">

          {/* Preview top bar: tabs + file tabs */}
          <div className="flex items-center border-b border-white/[0.06] px-3 h-10 gap-3 flex-shrink-0">
            {/* Code / Preview tabs */}
            <div className="flex items-center gap-0.5">
              <button
                onClick={() => setPreviewTab('code')}
                className={`flex items-center gap-1.5 px-3 h-7 rounded-lg text-[12px] font-medium transition-colors ${
                  previewTab === 'code' ? 'bg-white/10 text-white' : 'text-white/35 hover:text-white/60'
                }`}
              >
                <span className="text-[10px]">{'</>'}</span> Code
              </button>
              <button
                onClick={() => setPreviewTab('preview')}
                className={`flex items-center gap-1.5 px-3 h-7 rounded-lg text-[12px] font-medium transition-colors ${
                  previewTab === 'preview' ? 'bg-white/10 text-white' : 'text-white/35 hover:text-white/60'
                }`}
              >
                <span className="text-[11px]">👁</span> Preview
              </button>
            </div>

            <div className="w-px h-4 bg-white/[0.06]" />

            {/* File tabs */}
            <div className="flex items-center gap-1 overflow-x-auto flex-1 min-w-0">
              {files.map(f => (
                <button
                  key={f.path}
                  onClick={() => {
                    setActiveFile(f.path)
                    if (f.path.endsWith('.html')) setPreviewUrl(previewManager.buildFromHtml(f.content))
                  }}
                  className={`flex items-center gap-1.5 px-2.5 h-6 rounded-md text-[11px] font-mono flex-shrink-0 transition-colors ${
                    activeFile === f.path
                      ? 'bg-white/10 text-white border border-white/10'
                      : 'text-white/30 hover:text-white/60 border border-transparent hover:border-white/[0.06]'
                  }`}
                >
                  {f.path}
                </button>
              ))}
            </div>
          </div>

          {/* Preview body */}
          {previewTab === 'code' ? (
            <CodeView file={activeFileObj} />
          ) : previewUrl ? (
            <div className="flex-1 flex items-stretch overflow-hidden p-4">
              <div
                className={`mx-auto flex flex-col overflow-hidden border border-white/[0.08] shadow-2xl transition-all duration-300 ease-out ${
                  previewSize === 'M'
                    ? 'rounded-[2.5rem] border-2 border-white/20'
                    : 'rounded-xl'
                }`}
                style={{ width: PREVIEW_WIDTH[previewSize] }}
              >
                {/* Phone notch for M size */}
                {previewSize === 'M' && (
                  <div className="h-8 bg-black flex-shrink-0 flex items-center justify-center rounded-t-[2.5rem]">
                    <div className="w-24 h-5 bg-black rounded-full border border-white/10 flex items-center justify-center">
                      <div className="w-2 h-2 bg-white/10 rounded-full" />
                    </div>
                  </div>
                )}

                {/* Browser bar for T/D */}
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
                {isGenerating && <p className="text-xs text-white/15 mt-1 animate-pulse">Генерирую...</p>}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
