'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { ALL_MODELS } from '@/lib/providers'

// ── Types ──────────────────────────────────────────────────────

interface Message {
  id:      string
  role:    'user' | 'assistant'
  content: string
  model?:  string
  ts:      number
}

// ── Badge colors ───────────────────────────────────────────────

const BADGE: Record<string, string> = {
  best:  'bg-violet-500/20 text-violet-300',
  smart: 'bg-blue-500/20 text-blue-300',
  fast:  'bg-emerald-500/20 text-emerald-300',
  code:  'bg-orange-500/20 text-orange-300',
}

// Free models (don't need OpenRouter balance)
const FREE_KEYS = new Set(['gemini-3.1-pro', 'gemini-2.5-pro', 'gemini-flash', 'mistral-large', 'mistral-small', 'llama-groq', 'cerebras'])

// Preview models with strict rate limits (2-5 req/min on free tier)
const RATE_LIMITED = new Set(['gemini-3.1-pro', 'gemini-2.5-pro'])

// ── Markdown-lite renderer ─────────────────────────────────────

function renderMarkdown(text: string) {
  const lines = text.split('\n')
  const out: React.ReactNode[] = []
  let i = 0

  while (i < lines.length) {
    const line = lines[i]

    // Code block
    if (line.startsWith('```')) {
      const lang = line.slice(3).trim()
      const codeLines: string[] = []
      i++
      while (i < lines.length && !lines[i].startsWith('```')) {
        codeLines.push(lines[i])
        i++
      }
      out.push(
        <div key={i} className="my-2 rounded-xl overflow-hidden border border-white/[0.08]">
          {lang && (
            <div className="px-3 py-1.5 bg-white/[0.04] border-b border-white/[0.06] text-[10px] text-white/30 font-mono flex items-center justify-between">
              <span>{lang}</span>
              <button
                onClick={() => navigator.clipboard.writeText(codeLines.join('\n'))}
                className="hover:text-white/60 transition-colors"
              >Copy</button>
            </div>
          )}
          <pre className="p-3 bg-[#0d0d0d] text-[12px] font-mono text-white/75 overflow-x-auto leading-relaxed">
            <code>{codeLines.join('\n')}</code>
          </pre>
        </div>
      )
      i++
      continue
    }

    // Heading
    const h3 = line.match(/^### (.+)/)
    const h2 = line.match(/^## (.+)/)
    const h1 = line.match(/^# (.+)/)
    if (h1) { out.push(<h1 key={i} className="text-[16px] font-semibold text-white mt-3 mb-1">{h1[1]}</h1>); i++; continue }
    if (h2) { out.push(<h2 key={i} className="text-[14px] font-semibold text-white mt-2 mb-1">{h2[1]}</h2>); i++; continue }
    if (h3) { out.push(<h3 key={i} className="text-[13px] font-medium text-white/80 mt-2 mb-0.5">{h3[1]}</h3>); i++; continue }

    // Bullet
    if (line.match(/^[-*] /)) {
      const bullets: string[] = []
      while (i < lines.length && lines[i].match(/^[-*] /)) {
        bullets.push(lines[i].replace(/^[-*] /, ''))
        i++
      }
      out.push(
        <ul key={i} className="my-1.5 space-y-1 pl-1">
          {bullets.map((b, j) => (
            <li key={j} className="flex gap-2 text-[13px] text-white/70 leading-relaxed">
              <span className="text-white/20 flex-shrink-0 mt-0.5">▸</span>
              <span dangerouslySetInnerHTML={{ __html: inlineFormat(b) }} />
            </li>
          ))}
        </ul>
      )
      continue
    }

    // Numbered list
    if (line.match(/^\d+\. /)) {
      const items: string[] = []
      let num = 1
      while (i < lines.length && lines[i].match(/^\d+\. /)) {
        items.push(lines[i].replace(/^\d+\. /, ''))
        i++; num++
      }
      out.push(
        <ol key={i} className="my-1.5 space-y-1 pl-1">
          {items.map((it, j) => (
            <li key={j} className="flex gap-2 text-[13px] text-white/70 leading-relaxed">
              <span className="text-white/30 flex-shrink-0 font-mono text-[11px] mt-0.5 w-4 text-right">{j + 1}.</span>
              <span dangerouslySetInnerHTML={{ __html: inlineFormat(it) }} />
            </li>
          ))}
        </ol>
      )
      continue
    }

    // Horizontal rule
    if (line.match(/^---+$/)) {
      out.push(<hr key={i} className="my-3 border-white/[0.08]" />)
      i++; continue
    }

    // Empty line
    if (!line.trim()) {
      out.push(<div key={i} className="h-2" />)
      i++; continue
    }

    // Regular paragraph
    out.push(
      <p key={i} className="text-[13px] text-white/75 leading-relaxed"
        dangerouslySetInnerHTML={{ __html: inlineFormat(line) }} />
    )
    i++
  }

  return <div className="space-y-0.5">{out}</div>
}

function inlineFormat(text: string): string {
  // Sanitize: экранируем HTML перед обработкой markdown
  const safe = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
  return safe
    .replace(/\*\*(.+?)\*\*/g, '<strong class="text-white font-semibold">$1</strong>')
    .replace(/\*(.+?)\*/g, '<em class="text-white/80">$1</em>')
    .replace(/`(.+?)`/g, '<code class="px-1.5 py-0.5 rounded bg-white/[0.07] text-[11px] font-mono text-emerald-300/80">$1</code>')
}

// ── Chat screen ────────────────────────────────────────────────

interface ChatScreenProps {
  onBack: () => void
}

export function ChatScreen({ onBack }: ChatScreenProps) {
  const [messages,   setMessages]   = useState<Message[]>([])
  const [input,      setInput]      = useState('')
  const [streaming,  setStreaming]  = useState(false)
  const [streamText, setStreamText] = useState('')
  const [model,      setModel]      = useState('gemini-flash')
  const [showPicker, setShowPicker] = useState(false)
  const bottomRef  = useRef<HTMLDivElement>(null)
  const textaRef   = useRef<HTMLTextAreaElement>(null)

  const currentModel = ALL_MODELS.find(m => m.key === model) ?? ALL_MODELS[0]

  const scrollBottom = () =>
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)

  useEffect(() => {
    scrollBottom()
  }, [messages, streamText])

  const sendMessage = useCallback(async () => {
    const text = input.trim()
    if (!text || streaming) return
    setInput('')

    const userMsg: Message = { id: crypto.randomUUID(), role: 'user', content: text, ts: Date.now() }
    const history = [...messages, userMsg]
    setMessages(history)
    setStreaming(true)
    setStreamText('')
    scrollBottom()

    const apiMessages = history.map(m => ({ role: m.role, content: m.content }))

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: apiMessages, model }),
      })

      if (!res.body) throw new Error('No response body')

      const reader  = res.body.getReader()
      const decoder = new TextDecoder()
      let buf = '', full = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buf += decoder.decode(value, { stream: true })
        const lines = buf.split('\n'); buf = lines.pop() ?? ''
        for (const line of lines) {
          if (!line.trim()) continue
          try {
            const ev = JSON.parse(line)
            if (ev.type === 'chunk' && ev.text) {
              full += ev.text
              setStreamText(full)
            } else if (ev.type === 'error') {
              throw new Error(ev.text)
            }
          } catch (parseErr) {
            if ((parseErr as Error).message !== 'Unexpected token') throw parseErr
          }
        }
      }

      const assistantMsg: Message = {
        id:      crypto.randomUUID(),
        role:    'assistant',
        content: full || '...',
        model:   currentModel.label,
        ts:      Date.now(),
      }
      setMessages(prev => [...prev, assistantMsg])

    } catch (err) {
      setMessages(prev => [...prev, {
        id:      crypto.randomUUID(),
        role:    'assistant',
        content: `Ошибка: ${err instanceof Error ? err.message : String(err)}`,
        ts:      Date.now(),
      }])
    } finally {
      setStreaming(false)
      setStreamText('')
      scrollBottom()
    }
  }, [input, messages, model, streaming, currentModel])

  const clearChat = () => { setMessages([]); setStreamText('') }

  return (
    <div className="h-screen bg-[#09090b] flex flex-col overflow-hidden" onClick={() => setShowPicker(false)}>

      {/* Header */}
      <header className="flex items-center h-12 border-b border-white/[0.06] px-4 gap-3 flex-shrink-0">
        <button
          onClick={onBack}
          className="p-1.5 rounded-lg text-white/30 hover:text-white/70 hover:bg-white/[0.05] transition-all text-lg"
        >‹</button>

        <span className="text-[13px] font-medium text-white/80 flex-1">Чат с ИИ</span>

        {/* Model picker */}
        <div className="relative" onClick={e => e.stopPropagation()}>
          <button
            onClick={() => setShowPicker(v => !v)}
            className="flex items-center gap-2 px-3 h-8 rounded-lg border border-white/[0.08] hover:border-white/20 hover:bg-white/[0.04] transition-all"
          >
            <span className="text-[12px] text-white/60">{currentModel.label}</span>
            {currentModel.badge && (
              <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium ${BADGE[currentModel.badge] ?? ''}`}>
                {currentModel.badge}
              </span>
            )}
            <span className="text-white/20 text-[10px]">▾</span>
          </button>

          {showPicker && (
            <div className="absolute top-10 right-0 w-72 bg-[#141414] border border-white/[0.1] rounded-2xl shadow-2xl z-50 overflow-hidden">
              <div className="px-3 pt-2.5 pb-2 border-b border-white/[0.06]">
                <p className="text-[10px] text-white/30 uppercase tracking-wider">Выбери модель</p>
              </div>

              {/* Free models */}
              <div className="py-1">
                <p className="px-3 pt-2 pb-1 text-[10px] text-white/20 uppercase tracking-wider">Бесплатно</p>
                {ALL_MODELS.filter(m => FREE_KEYS.has(m.key)).map(opt => (
                  <button
                    key={opt.key}
                    onClick={() => { setModel(opt.key); setShowPicker(false) }}
                    className={`w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-white/[0.05] transition-colors ${model === opt.key ? 'bg-white/[0.05]' : ''}`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[12px] text-white/80">{opt.label}</span>
                        {opt.badge && (
                          <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium ${BADGE[opt.badge] ?? ''}`}>{opt.badge}</span>
                        )}
                        {RATE_LIMITED.has(opt.key) && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-amber-500/15 text-amber-400/70">~2 RPM</span>
                        )}
                      </div>
                      <span className="text-[10px] text-white/25">{opt.desc}</span>
                    </div>
                    {model === opt.key && <span className="text-white/40 text-[11px]">✓</span>}
                  </button>
                ))}

                <p className="px-3 pt-3 pb-1 text-[10px] text-white/20 uppercase tracking-wider border-t border-white/[0.04] mt-1">Нужен баланс OpenRouter</p>
                {ALL_MODELS.filter(m => !FREE_KEYS.has(m.key)).map(opt => (
                  <button
                    key={opt.key}
                    onClick={() => { setModel(opt.key); setShowPicker(false) }}
                    className={`w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-white/[0.05] transition-colors opacity-60 ${model === opt.key ? 'bg-white/[0.05]' : ''}`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[12px] text-white/80">{opt.label}</span>
                        {opt.badge && (
                          <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium ${BADGE[opt.badge] ?? ''}`}>{opt.badge}</span>
                        )}
                      </div>
                      <span className="text-[10px] text-white/25">{opt.desc}</span>
                    </div>
                    {model === opt.key && <span className="text-white/40 text-[11px]">✓</span>}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {messages.length > 0 && (
          <button
            onClick={clearChat}
            className="px-3 h-8 rounded-lg text-[12px] text-white/30 hover:text-white/60 border border-white/[0.06] hover:border-white/15 transition-all"
          >Очистить</button>
        )}
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto">
        {messages.length === 0 && !streaming ? (
          <div className="flex flex-col items-center justify-center h-full gap-4 px-4">
            <div className="w-14 h-14 rounded-2xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-2xl">
              ✦
            </div>
            <div className="text-center">
              <p className="text-[15px] font-medium text-white/60">Чат с {currentModel.label}</p>
              <p className="text-[13px] text-white/25 mt-1">Задай любой вопрос</p>
            </div>
            <div className="flex flex-wrap gap-2 justify-center max-w-lg mt-2">
              {[
                'Объясни как работает async/await',
                'Напиши функцию сортировки',
                'Как написать REST API на Node.js?',
                'Объясни разницу между == и ===',
              ].map(s => (
                <button
                  key={s}
                  onClick={() => { setInput(s); textaRef.current?.focus() }}
                  className="px-3 py-1.5 rounded-full text-[12px] text-white/35 border border-white/[0.07] hover:border-white/20 hover:text-white/60 transition-all bg-white/[0.02]"
                >{s}</button>
              ))}
            </div>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
            {messages.map(msg => (
              <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                {msg.role === 'assistant' && (
                  <div className="w-7 h-7 rounded-full bg-white/[0.07] border border-white/[0.08] flex items-center justify-center text-[10px] flex-shrink-0 mt-0.5">
                    ✦
                  </div>
                )}
                <div className={`max-w-[85%] ${msg.role === 'user' ? 'max-w-[75%]' : 'flex-1'}`}>
                  {msg.role === 'user' ? (
                    <div className="px-4 py-3 rounded-2xl rounded-tr-sm bg-white/[0.07] border border-white/[0.07] text-[13px] text-white leading-relaxed">
                      {msg.content}
                    </div>
                  ) : (
                    <div>
                      {renderMarkdown(msg.content)}
                      <div className="flex items-center gap-3 mt-2">
                        {msg.model && (
                          <span className="text-[10px] text-white/15">{msg.model}</span>
                        )}
                        <button
                          onClick={() => navigator.clipboard.writeText(msg.content)}
                          className="text-[10px] text-white/20 hover:text-white/50 transition-colors"
                        >Копировать</button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* Streaming message */}
            {streaming && (
              <div className="flex gap-3">
                <div className="w-7 h-7 rounded-full bg-white/[0.07] border border-white/[0.08] flex items-center justify-center text-[10px] flex-shrink-0 mt-0.5">
                  ✦
                </div>
                <div className="flex-1">
                  {streamText ? (
                    renderMarkdown(streamText)
                  ) : (
                    <div className="flex items-center gap-1.5 pt-1">
                      {[0, 150, 300].map(d => (
                        <span key={d} className="w-1.5 h-1.5 bg-white/25 rounded-full animate-bounce"
                          style={{ animationDelay: `${d}ms` }} />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* Input */}
      <div className="border-t border-white/[0.06] p-4 flex-shrink-0">
        <div className="max-w-3xl mx-auto">
          <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] overflow-hidden focus-within:border-white/15 transition-colors">
            <textarea
              ref={textaRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() } }}
              placeholder="Напиши сообщение..."
              rows={3}
              disabled={streaming}
              className="w-full bg-transparent px-4 pt-4 pb-2 text-[14px] text-white placeholder-white/20 resize-none outline-none leading-relaxed"
              autoFocus
            />
            <div className="flex items-center justify-between px-4 pb-3 pt-1">
              <span className="text-[11px] text-white/20">Enter — отправить · Shift+Enter — перенос</span>
              <button
                onClick={sendMessage}
                disabled={streaming || !input.trim()}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] font-medium bg-white text-black hover:bg-white/90 disabled:opacity-25 disabled:cursor-not-allowed transition-all"
              >
                {streaming ? '...' : '→'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
