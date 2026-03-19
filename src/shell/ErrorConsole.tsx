'use client'

import { useEffect, useRef, useState } from 'react'

export interface ConsoleError {
  message: string
  source?: string
  line?:   number
  ts:      number
}

interface ErrorConsoleProps {
  iframeRef:  React.RefObject<HTMLIFrameElement>
  onAutoFix:  (errors: ConsoleError[]) => void
  isFixing:   boolean
}

export function ErrorConsole({ iframeRef, onAutoFix, isFixing }: ErrorConsoleProps) {
  const [errors,   setErrors]   = useState<ConsoleError[]>([])
  const [expanded, setExpanded] = useState(false)
  const listRef = useRef<HTMLDivElement>(null)

  // Listen for postMessage from iframe injected script
  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (e.data?.type === 'combi_error') {
        const err: ConsoleError = {
          message: e.data.message ?? 'Unknown error',
          source:  e.data.source,
          line:    e.data.line,
          ts:      Date.now(),
        }
        setErrors(prev => [...prev.slice(-19), err])
        setExpanded(true)
      }
      if (e.data?.type === 'combi_clear') {
        setErrors([])
      }
    }
    window.addEventListener('message', handler)
    return () => window.removeEventListener('message', handler)
  }, [])

  // Scroll to bottom on new errors
  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' })
  }, [errors])

  if (errors.length === 0 && !expanded) return null

  return (
    <div className={`flex-shrink-0 border-t border-white/[0.06] bg-[#0a0a0a] transition-all ${expanded ? 'h-36' : 'h-8'}`}>
      {/* Toolbar */}
      <div className="flex items-center justify-between px-3 h-8 flex-shrink-0">
        <button
          onClick={() => setExpanded(v => !v)}
          className="flex items-center gap-2 text-[11px] text-white/40 hover:text-white/70 transition-colors"
        >
          <span className={`transition-transform ${expanded ? 'rotate-90' : ''}`}>›</span>
          <span className={errors.length > 0 ? 'text-red-400' : ''}>
            Консоль {errors.length > 0 ? `(${errors.length})` : ''}
          </span>
        </button>

        <div className="flex items-center gap-2">
          {errors.length > 0 && (
            <>
              <button
                onClick={() => onAutoFix(errors)}
                disabled={isFixing}
                className="flex items-center gap-1.5 px-2.5 h-5 rounded text-[10px] bg-red-500/15 border border-red-500/30 text-red-400 hover:bg-red-500/25 disabled:opacity-40 transition-all"
              >
                {isFixing ? '⟳ Исправляю...' : '✦ Исправить ошибки'}
              </button>
              <button
                onClick={() => setErrors([])}
                className="text-[10px] text-white/20 hover:text-white/50 transition-colors"
              >
                Очистить
              </button>
            </>
          )}
        </div>
      </div>

      {/* Error list */}
      {expanded && (
        <div ref={listRef} className="overflow-y-auto h-28 px-3 pb-2 space-y-1">
          {errors.length === 0 ? (
            <p className="text-[11px] text-white/20 py-2">Ошибок нет</p>
          ) : (
            errors.map((e, i) => (
              <div key={i} className="flex items-start gap-2 text-[11px] font-mono">
                <span className="text-red-400 flex-shrink-0 mt-px">✕</span>
                <span className="text-red-300/80 flex-1 break-all leading-relaxed">
                  {e.message}
                  {e.line && <span className="text-white/20 ml-1">:{e.line}</span>}
                </span>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}

// ─── Inject error listener into iframe HTML ───────────────────
export function injectErrorListener(html: string): string {
  const script = `
<script>
(function() {
  window.onerror = function(msg, src, line) {
    window.parent.postMessage({ type: 'combi_error', message: String(msg), source: src, line: line }, '*');
    return false;
  };
  window.addEventListener('unhandledrejection', function(e) {
    window.parent.postMessage({ type: 'combi_error', message: 'Unhandled Promise: ' + (e.reason?.message || e.reason) }, '*');
  });
  var _ce = console.error;
  console.error = function() {
    var msg = Array.from(arguments).join(' ');
    window.parent.postMessage({ type: 'combi_error', message: msg }, '*');
    _ce.apply(console, arguments);
  };
  window.parent.postMessage({ type: 'combi_clear' }, '*');
})();
<\/script>`

  // Inject right after <head> or at the start of <body>
  if (html.includes('<head>')) return html.replace('<head>', '<head>' + script)
  if (html.includes('<body>')) return html.replace('<body>', '<body>' + script)
  return script + html
}
