'use client'

import { useEffect, useRef, useState } from 'react'
import type { ChatMessage } from '@/core/agentTypes'

const SUGGESTIONS = [
  'Калькулятор процентов с историей',
  'Игра Snake на Canvas',
  'Менеджер задач с drag & drop',
  'Лендинг для SaaS стартапа',
  'Конвертер валют',
  'Таймер Помодоро',
]

interface Props {
  messages: ChatMessage[]
  isGenerating: boolean
  onSend: (text: string) => void
}

export default function ChatPanel({ messages, isGenerating, onSend }: Props) {
  const [input, setInput] = useState('')
  const endRef  = useRef<HTMLDivElement>(null)
  const textRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isGenerating])

  const send = () => {
    const text = input.trim()
    if (!text || isGenerating) return
    onSend(text)
    setInput('')
    textRef.current?.focus()
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-4 scroll-smooth">

        {messages.length === 0 && (
          <div className="text-center pt-6">
            <div className="text-3xl mb-2 opacity-60">✦</div>
            <p className="text-xs text-neutral-500 mb-5">Опиши своё приложение</p>
            <div className="space-y-1.5">
              {SUGGESTIONS.map(s => (
                <button
                  key={s}
                  onClick={() => onSend(s)}
                  className="w-full text-left text-xs px-3 py-2 rounded-lg border border-white/5
                             bg-white/2 hover:bg-white/8 hover:border-white/15
                             text-neutral-400 hover:text-neutral-200 transition"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map(msg => (
          <div key={msg.id} className={`flex gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>

            {/* Avatar */}
            <div className={`w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center
                             text-[10px] font-bold mt-0.5 ${
              msg.role === 'user'
                ? 'bg-indigo-500 text-white'
                : 'bg-neutral-800 text-neutral-400'
            }`}>
              {msg.role === 'user' ? 'U' : '✦'}
            </div>

            {/* Bubble */}
            <div className={`flex flex-col gap-1.5 max-w-[85%] ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
              <div className={`px-3 py-2 rounded-2xl text-xs leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-indigo-600 text-white rounded-tr-sm'
                  : msg.stage === 'error'
                  ? 'bg-red-950 border border-red-800 text-red-300 rounded-tl-sm'
                  : 'bg-neutral-800/80 text-neutral-200 rounded-tl-sm'
              }`}>
                {msg.content}
              </div>

              {/* File badges */}
              {msg.files && msg.files.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {msg.files.map(f => (
                    <span
                      key={f.path}
                      className="text-[10px] px-2 py-0.5 rounded-full bg-neutral-900
                                 border border-white/5 text-neutral-500 font-mono"
                    >
                      📄 {f.path}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}

        {/* Typing indicator */}
        {isGenerating && (
          <div className="flex gap-2">
            <div className="w-5 h-5 rounded-full bg-neutral-800 flex items-center justify-center text-[10px]">✦</div>
            <div className="px-3 py-2 rounded-2xl rounded-tl-sm bg-neutral-800/80">
              <span className="flex gap-1">
                {[0, 150, 300].map(delay => (
                  <span
                    key={delay}
                    className="w-1 h-1 rounded-full bg-neutral-400 animate-bounce inline-block"
                    style={{ animationDelay: `${delay}ms` }}
                  />
                ))}
              </span>
            </div>
          </div>
        )}

        <div ref={endRef} />
      </div>

      {/* Input */}
      <div className="p-3 border-t border-white/5 flex-shrink-0">
        <div className="flex gap-2">
          <textarea
            ref={textRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() }
            }}
            placeholder="Опиши приложение..."
            rows={2}
            className="flex-1 bg-neutral-900 border border-white/8 rounded-xl px-3 py-2
                       text-xs text-white placeholder-neutral-600 resize-none
                       focus:outline-none focus:border-white/20 transition leading-relaxed"
          />
          <button
            onClick={send}
            disabled={isGenerating || !input.trim()}
            className="px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500
                       disabled:opacity-30 disabled:cursor-not-allowed
                       text-white text-sm font-bold transition"
          >
            →
          </button>
        </div>
        <p className="text-[10px] text-neutral-700 mt-1.5 pl-1">Enter — отправить · Shift+Enter — новая строка</p>
      </div>
    </div>
  )
}
