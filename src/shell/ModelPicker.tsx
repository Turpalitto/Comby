'use client'

import { ALL_MODELS, type ModelDef } from '@/lib/providers'

// Бесплатные модели (не нужен баланс OpenRouter)
const FREE_KEYS = new Set(['gemini-3.1-pro', 'gemini-2.5-pro', 'gemini-flash', 'mistral-large', 'mistral-small', 'llama-groq', 'cerebras'])

const BADGE_COLORS: Record<string, string> = {
  best:  'bg-violet-500/20 text-violet-300',
  smart: 'bg-blue-500/20 text-blue-300',
  fast:  'bg-emerald-500/20 text-emerald-300',
  code:  'bg-orange-500/20 text-orange-300',
}

// Auto-модель — вставляется первой
const AUTO_MODEL: ModelDef = {
  key: 'auto', label: '✦ Auto', desc: 'Умный выбор под задачу', badge: '', modelId: '', provider: 'google',
}

export function getModelOptions(): ModelDef[] {
  return [AUTO_MODEL, ...ALL_MODELS]
}

export function getModelLabel(key: string): string {
  if (key === 'auto') return '✦ Auto'
  return ALL_MODELS.find(m => m.key === key)?.label ?? '✦ Auto'
}

interface ModelPickerProps {
  selectedModel: string
  onSelect: (key: string) => void
  open: boolean
  onToggle: () => void
  /** Последняя использованная модель (из ответа API) */
  activeModel?: string
  /** Позиция: bottom (для landing) или top (для sidebar) */
  position?: 'bottom' | 'top'
  /** Компактный режим */
  compact?: boolean
}

export function ModelPicker({ selectedModel, onSelect, open, onToggle, activeModel, position = 'bottom', compact = false }: ModelPickerProps) {
  const currentModel = getModelOptions().find(m => m.key === selectedModel) ?? AUTO_MODEL

  return (
    <div className="relative" onClick={e => e.stopPropagation()}>
      <button
        onClick={onToggle}
        className={`flex items-center gap-${compact ? '1.5' : '2'} px-${compact ? '2' : '3'} ${compact ? 'h-6' : 'h-8'} rounded-lg border border-white/[0.08] hover:border-white/20 ${compact ? 'hover:bg-transparent' : 'hover:bg-white/[0.04]'} bg-white/[0.02] transition-all ${compact ? 'max-w-[130px]' : ''}`}
      >
        <span className={`text-[${compact ? '11' : '12'}px] text-white/60 truncate`}>{currentModel.label}</span>
        {currentModel.badge && (
          <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium ${BADGE_COLORS[currentModel.badge] ?? ''}`}>
            {currentModel.badge}
          </span>
        )}
        <span className="text-white/20 text-[10px] flex-shrink-0">▾</span>
      </button>

      {open && (
        <div
          className={`absolute ${position === 'bottom' ? 'bottom-10' : 'top-10'} left-0 w-64 bg-[#141414] border border-white/[0.1] rounded-2xl shadow-2xl z-50 overflow-hidden`}
        >
          <div className="px-3 py-2 border-b border-white/[0.06]">
            <p className="text-[10px] text-white/30 uppercase tracking-wider">Модель</p>
            {activeModel && (
              <p className="text-[10px] text-white/20 mt-0.5 font-mono truncate">
                Последняя: {activeModel.split('/').at(-1)}
              </p>
            )}
          </div>

          {/* Бесплатные */}
          <div className="py-1 max-h-72 overflow-y-auto">
            <p className="px-3 pt-2 pb-1 text-[10px] text-white/20 uppercase tracking-wider">Бесплатно</p>
            {getModelOptions().filter(m => m.key === 'auto' || FREE_KEYS.has(m.key)).map(opt => (
              <ModelOption key={opt.key} opt={opt} selected={selectedModel === opt.key} onSelect={() => onSelect(opt.key)} />
            ))}

            <p className="px-3 pt-3 pb-1 text-[10px] text-white/20 uppercase tracking-wider border-t border-white/[0.04] mt-1">
              Нужен баланс OpenRouter
            </p>
            {ALL_MODELS.filter(m => !FREE_KEYS.has(m.key)).map(opt => (
              <ModelOption key={opt.key} opt={opt} selected={selectedModel === opt.key} onSelect={() => onSelect(opt.key)} dimmed />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function ModelOption({ opt, selected, onSelect, dimmed }: { opt: ModelDef; selected: boolean; onSelect: () => void; dimmed?: boolean }) {
  return (
    <button
      onClick={onSelect}
      className={`w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-white/[0.05] transition-colors ${selected ? 'bg-white/[0.05]' : ''} ${dimmed ? 'opacity-60' : ''}`}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[12px] text-white/80">{opt.label}</span>
          {opt.badge && (
            <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium ${BADGE_COLORS[opt.badge] ?? ''}`}>
              {opt.badge}
            </span>
          )}
        </div>
        <span className="text-[10px] text-white/25">{opt.desc}</span>
      </div>
      {selected && <span className="text-white/40 text-[11px] flex-shrink-0">✓</span>}
    </button>
  )
}
