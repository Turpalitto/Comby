import { NextRequest, NextResponse } from 'next/server'
import type { ChatMessage, AgentResponse, AgentFile } from '@/core/agentTypes'

// ─── Model catalogue ──────────────────────────────────────────

// Models available via OpenRouter
const MODELS = {
  // Fast + cheap — good for most web tasks
  'gemini-flash':    'google/gemini-2.0-flash-001',
  // Best quality — complex apps, games
  'gemini-pro':      'google/gemini-2.5-pro-preview-03-25',
  // Strong coder
  'deepseek-coder':  'deepseek/deepseek-chat-v3-5',
  // Claude — creative + complex UI
  'claude-haiku':    'anthropic/claude-haiku-4-5',
  'claude-sonnet':   'anthropic/claude-sonnet-4-5',
} as const

type ModelKey = keyof typeof MODELS

// Auto-select best model for the task
function selectModel(userMessage: string, isEdit: boolean): ModelKey {
  const text = userMessage.toLowerCase()

  // Edits → fast model
  if (isEdit) return 'gemini-flash'

  // Complex games → strongest model
  if (/game|игр|canvas|3d|physics|animation/i.test(text)) return 'gemini-pro'

  // Complex full apps → pro model
  if (/dashboard|complete|полный|полноценн|enterprise|e2e|сложн|advanced/i.test(text)) return 'gemini-pro'

  // Landing pages, calculators, simple tools → fast
  if (/landing|лендинг|calculator|калькулятор|converter|конвертер|timer|таймер/i.test(text)) return 'gemini-flash'

  // Default
  return 'gemini-flash'
}

// ─── System prompt ────────────────────────────────────────────

const SYSTEM = `You are an autonomous web app builder. Turn user ideas into complete, working web applications.

ALWAYS respond with valid JSON (no markdown, no code fences) in this EXACT schema:
{
  "stage": "complete",
  "summary": "What was built — short bullet list of key features",
  "entryPoint": "index.html",
  "files": [
    { "path": "index.html", "content": "<!DOCTYPE html>...full content..." }
  ]
}

RULES:
- Generate fully FUNCTIONAL apps, not mockups or generic landing pages
- Use Tailwind CSS via CDN: <script src="https://cdn.tailwindcss.com"></script>
- Default dark theme: bg #0a0a0f, text white. Use accent color if user specifies
- For CALCULATORS: implement REAL working JavaScript calculation logic with input fields
- For GAMES: implement REAL game loop with Canvas API (keyboard controls, score, lives)
- For TOOLS/FORMS: make them actually work (validate inputs, compute results, show output)
- For LANDING PAGES: rich content, multiple sections (hero, features, pricing, cta, footer)
- NO Lorem ipsum — write real, contextually relevant copy
- If request is in Russian — generate Russian UI text
- Self-contained single HTML file (all JS and CSS inline)
- Professional animations, hover states, transitions, responsive design
- Use emoji as icons instead of image placeholders
- Summary field: use "\\n- " prefix for each bullet point of what was built`

// ─── JSON extractor ───────────────────────────────────────────

function isValidResponse(obj: unknown): obj is AgentResponse {
  if (!obj || typeof obj !== 'object') return false
  const r = obj as Record<string, unknown>
  return (
    typeof r.stage   === 'string' &&
    typeof r.summary === 'string' &&
    Array.isArray(r.files) &&
    r.files.every((f: unknown) =>
      f && typeof f === 'object' &&
      typeof (f as Record<string,unknown>).path    === 'string' &&
      typeof (f as Record<string,unknown>).content === 'string'
    )
  )
}

function extractJSON(text: string): AgentResponse | null {
  const attempts = [
    () => JSON.parse(text),
    () => JSON.parse(text.replace(/^```[a-z]*\n?/im, '').replace(/```\s*$/m, '').trim()),
    () => { const s = text.indexOf('{'); const e = text.lastIndexOf('}'); return s !== -1 && e > s ? JSON.parse(text.slice(s, e + 1)) : null },
  ]
  for (const attempt of attempts) {
    try {
      const parsed = attempt()
      if (isValidResponse(parsed)) return parsed
    } catch { /* try next */ }
  }
  return null
}

function salvageHTML(text: string): AgentResponse | null {
  const m = text.match(/<!DOCTYPE[\s\S]*<\/html>/i)
  if (!m) return null
  return { stage: 'complete', summary: 'App generated', entryPoint: 'index.html', files: [{ path: 'index.html', content: m[0] }] }
}

// ─── Route handler ────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const openrouterKey = process.env.OPENROUTER_API_KEY ?? ''
  const geminiKey     = process.env.GOOGLE_AI_API_KEY  ?? ''

  if (!openrouterKey && !geminiKey) {
    return NextResponse.json({ error: 'No API key configured' }, { status: 401 })
  }

  let body: { messages: ChatMessage[]; projectFiles?: AgentFile[]; model?: ModelKey }
  try { body = await req.json() }
  catch { return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 }) }

  const { messages, projectFiles = [], model: requestedModel } = body

  // Determine if this is an edit (has existing files)
  const isEdit = projectFiles.length > 0
  const lastUserMsg = messages.filter(m => m.role === 'user').at(-1)?.content ?? ''

  // Auto-select or use requested model
  const modelKey = requestedModel ?? selectModel(lastUserMsg, isEdit)
  const modelId  = MODELS[modelKey]

  // Build conversation
  const history = messages.map(m => ({
    role: m.role as 'user' | 'assistant',
    content: m.content,
  }))

  // Inject current files for edit context
  if (projectFiles.length > 0 && history.length > 0) {
    const ctx = projectFiles.map(f => `\n\n--- Current file: ${f.path} ---\n${f.content}`).join('')
    history[history.length - 1].content += ctx
  }

  let rawText = ''

  try {
    if (openrouterKey) {
      const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openrouterKey}`,
          'Content-Type':  'application/json',
          'HTTP-Referer':  'http://localhost:3003',
          'X-Title':       'local-ai-builder',
        },
        body: JSON.stringify({
          model:      modelId,
          max_tokens: 8192,
          messages:   [{ role: 'system', content: SYSTEM }, ...history],
        }),
      })

      if (!res.ok) {
        const err = await res.text()
        // Fallback to gemini-flash if pro fails
        if (modelKey !== 'gemini-flash') {
          return POST(new NextRequest(req.url, {
            method: 'POST',
            headers: req.headers,
            body: JSON.stringify({ messages, projectFiles, model: 'gemini-flash' as ModelKey }),
          }))
        }
        return NextResponse.json({ error: `OpenRouter error ${res.status}: ${err}` }, { status: 502 })
      }

      const data = await res.json()
      rawText = data.choices?.[0]?.message?.content ?? ''

    } else {
      // Gemini direct fallback
      const { GoogleGenerativeAI } = await import('@google/generative-ai')
      const genAI = new GoogleGenerativeAI(geminiKey)
      const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })
      const fullPrompt = SYSTEM + '\n\n' + history.map(m => `${m.role}: ${m.content}`).join('\n\n')
      const result = await model.generateContent(fullPrompt)
      rawText = result.response.text()
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: msg }, { status: 502 })
  }

  const parsed = extractJSON(rawText) ?? salvageHTML(rawText)

  if (!parsed) {
    return NextResponse.json(
      { error: 'AI returned unparseable response', raw: rawText.slice(0, 400) },
      { status: 500 },
    )
  }

  // Attach model info to response
  return NextResponse.json({ ...parsed, _model: modelId })
}
