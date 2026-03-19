// Unified provider routing — direct APIs, no OpenRouter dependency

export interface ChatMsg { role: 'user' | 'assistant'; content: string }

// ── Model registry ─────────────────────────────────────────────

export type ProviderKey = 'google' | 'mistral' | 'groq' | 'cerebras' | 'openrouter'

export interface ModelDef {
  key:      string
  label:    string
  desc:     string
  badge:    string
  modelId:  string        // actual API model id
  provider: ProviderKey
}

export const ALL_MODELS: ModelDef[] = [
  // Google — direct API
  { key: 'gemini-3.1-pro',  label: '◈ Gemini 3.1 Pro',   desc: 'Новейший Google, мощный',       badge: 'smart', modelId: 'gemini-3.1-pro-preview',  provider: 'google'      },
  { key: 'gemini-2.5-pro',  label: '◈ Gemini 2.5 Pro',   desc: 'Стабильный и надёжный',         badge: '',      modelId: 'gemini-2.5-pro',           provider: 'google'      },
  { key: 'gemini-flash',    label: '⚡ Gemini 2.5 Flash', desc: 'Быстрый — правки, диалог',      badge: 'fast',  modelId: 'gemini-2.5-flash',         provider: 'google'      },
  // Mistral — direct API
  { key: 'mistral-large',   label: '▲ Mistral Large',     desc: 'Сильный в структурном коде',   badge: 'code',  modelId: 'mistral-large-latest',     provider: 'mistral'     },
  { key: 'mistral-small',   label: '▲ Mistral Small',     desc: 'Быстрый Mistral',               badge: 'fast',  modelId: 'mistral-small-latest',     provider: 'mistral'     },
  // Groq — fast inference
  { key: 'llama-groq',      label: '◉ Llama 3.3 70B',    desc: 'Быстрый open-source (Groq)',    badge: 'fast',  modelId: 'llama-3.3-70b-versatile',  provider: 'groq'        },
  // Cerebras — ultra fast
  { key: 'cerebras',        label: '⬡ Cerebras Llama',   desc: 'Очень быстрый',                 badge: 'fast',  modelId: 'llama3.1-8b',              provider: 'cerebras'    },
  // OpenRouter (needs credits)
  { key: 'claude-sonnet',   label: '✺ Claude Sonnet',     desc: 'Лучший код/UI (нужен баланс)',  badge: 'best',  modelId: 'anthropic/claude-sonnet-4-5', provider: 'openrouter' },
  { key: 'gpt-4o',          label: '◇ GPT-4o',            desc: 'Универсал (нужен баланс)',      badge: '',      modelId: 'openai/gpt-4o',            provider: 'openrouter'  },
  { key: 'deepseek-coder',  label: '⌥ DeepSeek V3',       desc: 'Сильный кодер (нужен баланс)', badge: 'code',  modelId: 'deepseek/deepseek-chat-v3-5', provider: 'openrouter'},
  { key: 'claude-haiku',    label: '◻ Claude Haiku',      desc: 'Быстрый Claude (нужен баланс)',badge: '',      modelId: 'anthropic/claude-haiku-4-5',  provider: 'openrouter' },
]

export function getModel(key: string): ModelDef {
  return ALL_MODELS.find(m => m.key === key) ?? ALL_MODELS[0]
}

// ── Streaming helpers ──────────────────────────────────────────

async function consumeOpenAIStream(
  body: ReadableStream<Uint8Array>,
  onChunk: (t: string) => void
): Promise<string> {
  const reader = body.getReader()
  const dec = new TextDecoder()
  let buf = '', full = ''
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buf += dec.decode(value, { stream: true })
    const lines = buf.split('\n'); buf = lines.pop() ?? ''
    for (const line of lines) {
      const t = line.replace(/^data:\s*/, '').trim()
      if (!t || t === '[DONE]') continue
      try {
        const json = JSON.parse(t)
        const text = json.choices?.[0]?.delta?.content ?? ''
        if (text) { full += text; onChunk(text) }
      } catch { /* skip */ }
    }
  }
  return full
}

// OpenAI-compatible: Groq, Mistral, Cerebras, OpenRouter
export async function streamOpenAICompat(
  endpoint: string,
  apiKey: string,
  model: string,
  messages: ChatMsg[],
  system: string,
  onChunk: (t: string) => void,
  extraHeaders: Record<string, string> = {}
): Promise<string> {
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      ...extraHeaders,
    },
    body: JSON.stringify({
      model,
      max_tokens: 16000,
      stream: true,
      messages: [{ role: 'system', content: system }, ...messages],
    }),
  })
  if (!res.ok || !res.body) {
    const err = await res.text()
    throw new Error(`${model} error ${res.status}: ${err.slice(0, 200)}`)
  }
  return consumeOpenAIStream(res.body, onChunk)
}

// Google Gemini via REST (supports streaming)
export async function streamGemini(
  modelId: string,
  apiKey: string,
  messages: ChatMsg[],
  system: string,
  onChunk: (t: string) => void
): Promise<string> {
  const contents = messages.map(m => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }))

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:streamGenerateContent?key=${apiKey}&alt=sse`

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: system }] },
      contents,
      generationConfig: { maxOutputTokens: 16000, temperature: 1.0 },
    }),
  })

  if (!res.ok || !res.body) {
    const err = await res.text()
    throw new Error(`Gemini ${modelId} error ${res.status}: ${err.slice(0, 200)}`)
  }

  const reader = res.body.getReader()
  const dec = new TextDecoder()
  let buf = '', full = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buf += dec.decode(value, { stream: true })
    const lines = buf.split('\n'); buf = lines.pop() ?? ''
    for (const line of lines) {
      const t = line.replace(/^data:\s*/, '').trim()
      if (!t || t === '[DONE]') continue
      try {
        const json = JSON.parse(t)
        const text = json.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
        if (text) { full += text; onChunk(text) }
      } catch { /* skip */ }
    }
  }
  return full
}

// ── Main dispatcher ────────────────────────────────────────────

export async function streamModel(
  modelKey: string,
  messages: ChatMsg[],
  system: string,
  onChunk: (t: string) => void,
  env: {
    openrouterKey?: string
    googleKey?:     string
    mistralKey?:    string
    groqKey?:       string
    cerebrasKey?:   string
  }
): Promise<string> {
  const def = getModel(modelKey)

  switch (def.provider) {
    case 'google':
      if (!env.googleKey) throw new Error('Google AI API key not configured')
      return streamGemini(def.modelId, env.googleKey, messages, system, onChunk)

    case 'mistral':
      if (!env.mistralKey) throw new Error('Mistral API key not configured')
      return streamOpenAICompat(
        'https://api.mistral.ai/v1/chat/completions',
        env.mistralKey, def.modelId, messages, system, onChunk
      )

    case 'groq':
      if (!env.groqKey) throw new Error('Groq API key not configured')
      return streamOpenAICompat(
        'https://api.groq.com/openai/v1/chat/completions',
        env.groqKey, def.modelId, messages, system, onChunk
      )

    case 'cerebras':
      if (!env.cerebrasKey) throw new Error('Cerebras API key not configured')
      return streamOpenAICompat(
        'https://api.cerebras.ai/v1/chat/completions',
        env.cerebrasKey, def.modelId, messages, system, onChunk
      )

    case 'openrouter':
    default:
      if (!env.openrouterKey) throw new Error('OpenRouter API key not configured (нужен баланс)')
      return streamOpenAICompat(
        'https://openrouter.ai/api/v1/chat/completions',
        env.openrouterKey, def.modelId, messages, system, onChunk,
        { 'HTTP-Referer': 'http://localhost:3001', 'X-Title': 'combi-builder' }
      )
  }
}

// ── Retry / fallback wrapper ───────────────────────────────────

export type EnvKeys = {
  openrouterKey?: string
  googleKey?:     string
  mistralKey?:    string
  groqKey?:       string
  cerebrasKey?:   string
}

const FALLBACK_CHAIN = ['gemini-flash', 'gemini-2.5-pro', 'llama-groq', 'cerebras'] as const

function delay(ms: number) { return new Promise(r => setTimeout(r, ms)) }

export async function streamWithRetry(
  modelKey: string,
  messages: ChatMsg[],
  system: string,
  onChunk: (t: string) => void,
  env: EnvKeys,
  onFallback?: (fromModel: string, toModel: string, reason: string) => void,
): Promise<string> {
  // Try primary model
  try {
    return await streamModel(modelKey, messages, system, onChunk, env)
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    const isRetryable = /429|rate.limit|503|502|timeout|ECONNRESET|fetch failed/i.test(msg)

    if (!isRetryable) throw err

    // Try fallback chain
    for (const fallbackKey of FALLBACK_CHAIN) {
      if (fallbackKey === modelKey) continue
      const fb = ALL_MODELS.find(m => m.key === fallbackKey)
      if (!fb) continue

      // Check if we have the key for this fallback
      const hasKey =
        (fb.provider === 'google' && env.googleKey) ||
        (fb.provider === 'groq' && env.groqKey) ||
        (fb.provider === 'cerebras' && env.cerebrasKey) ||
        (fb.provider === 'mistral' && env.mistralKey) ||
        (fb.provider === 'openrouter' && env.openrouterKey)
      if (!hasKey) continue

      onFallback?.(modelKey, fallbackKey, msg)
      await delay(500)

      try {
        return await streamModel(fallbackKey, messages, system, onChunk, env)
      } catch { continue }
    }

    throw new Error(`Все модели недоступны. Последняя ошибка: ${msg}`)
  }
}
