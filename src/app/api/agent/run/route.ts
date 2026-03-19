import { NextRequest } from 'next/server'
import type { ChatMessage, AgentFile } from '@/core/agentTypes'
import { streamWithRetry, ALL_MODELS, type EnvKeys } from '@/lib/providers'

// ─── Auto-select model by task ────────────────────────────────

function selectModel(userMessage: string, isEdit: boolean): string {
  const text = userMessage.toLowerCase()

  // Быстрые правки → flash
  if (isEdit && text.length < 80) return 'gemini-flash'

  // Игры → нужен сильный reasoning
  if (/game|игр|canvas|arcade|platformer|shooter|puzzle|тетрис|змейка|snake/i.test(text)) return 'gemini-3.1-pro'

  // Сложные полные приложения
  if (/dashboard|полноценн|complete|enterprise|advanced|сложн|crm|erp|saas/i.test(text)) return 'claude-sonnet'

  // Простые калькуляторы/таймеры → flash
  if (/calculator|калькулятор|timer|таймер|converter|конвертер|clock|часы/i.test(text)) return 'gemini-flash'

  // По умолчанию для первой генерации → sonnet для качества
  if (!isEdit) return 'claude-sonnet'

  return 'gemini-flash'
}

// ─── System prompt ────────────────────────────────────────────

const SYSTEM_GENERATE = `You are an elite full-stack developer and UI/UX designer at the level of Vercel, Linear, or Stripe's frontend teams. Every project you build must be polished, complete, and impressive — not a toy or a demo.

RESPONSE FORMAT — ALWAYS respond with valid JSON only (no markdown, no code fences):
{
  "stage": "complete",
  "summary": "Brief description\\n- Feature 1\\n- Feature 2\\n- Feature 3",
  "entryPoint": "index.html",
  "files": [
    { "path": "index.html", "content": "<!DOCTYPE html>..." }
  ]
}

════════════════════════════════════════
QUALITY BAR
════════════════════════════════════════

MINIMUM OUTPUT SIZE: at least 400 lines of HTML/CSS/JS. Never produce a skeleton.
COMPLETENESS: Every feature mentioned must be FULLY implemented. No "TODO", no placeholders, no "coming soon".
VISUAL POLISH: If it wouldn't pass a Dribbble shot or a ProductHunt launch — redo it.
TEST IT MENTALLY: Run through the app in your head. Does every button work? Does every flow make sense?

════════════════════════════════════════
DESIGN SYSTEM (apply to every project)
════════════════════════════════════════

ALWAYS INCLUDE these CDN libraries in <head>:
  • Tailwind CSS: <script src="https://cdn.tailwindcss.com"></script>
  • Inter font: <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
  • Lucide icons: <script src="https://unpkg.com/lucide@latest/dist/umd/lucide.min.js"></script>
  • After Lucide script: call lucide.createIcons() AFTER DOM is ready (in DOMContentLoaded or at bottom of body)

TYPOGRAPHY:
  • Base font: font-family: 'Inter', sans-serif on body
  • Font sizes: 11-12px labels, 13-14px body, 16-18px headings, 24-40px hero
  • Line heights: 1.6 body, 1.2 headings. Letter-spacing: -0.02em for headings
  • Font weights: 400 body, 500 medium, 600 semibold, 700 bold

COLORS — Pick ONE accent per project, use it consistently everywhere:
  • Violet: #7c3aed → hover #6d28d9 (SaaS, apps, productivity)
  • Emerald: #10b981 → hover #059669 (finance, health, success states)
  • Blue: #3b82f6 → hover #2563eb (tech, developer tools)
  • Orange: #f97316 → hover #ea580c (games, energy, creative)
  • Rose: #f43f5e → hover #e11d48 (social, creative, emotional)
  • Amber: #f59e0b → hover #d97706 (warning, premium, gold)

DARK THEME (mandatory default):
  • Page background: #09090b
  • Surface (cards, panels): #111113
  • Elevated (dropdowns, modals): #1a1a1d
  • Border subtle: rgba(255,255,255,0.07)
  • Border default: rgba(255,255,255,0.12)
  • Border hover: rgba(255,255,255,0.22)
  • Text primary: #f4f4f5
  • Text secondary: #a1a1aa
  • Text muted: #52525b
  • Cards: background #111113, border 1px solid rgba(255,255,255,0.07), border-radius 12px, padding 20px

INTERACTIVE STATES (mandatory on every interactive element):
  • Hover: background lightens + border brightens + cursor:pointer
  • Active: slight scale(0.97) or darker bg
  • Focus: 2px outline with accent color at 40% opacity
  • Disabled: opacity-40, cursor-not-allowed
  • transition: all 0.15s ease on EVERYTHING interactive

SHADOWS AND DEPTH:
  • Cards: box-shadow: 0 1px 3px rgba(0,0,0,0.4)
  • Elevated (modals): box-shadow: 0 20px 60px rgba(0,0,0,0.7)
  • Glow (accent buttons): box-shadow: 0 0 20px accentColor + 30%

MICRO-ANIMATIONS — use CSS keyframes:
  • fadeIn: opacity 0→1 over 0.3s for new elements
  • slideUp: translateY(8px)→0 + opacity 0→1 for panels/cards
  • pulse: subtle scale animation for loading states
  • shimmer: background-position animation for skeleton loading

════════════════════════════════════════
FUNCTIONAL REQUIREMENTS
════════════════════════════════════════

FOR ALL APPS:
  • 100% FUNCTIONAL — zero mock data except pre-populated samples
  • All inputs must validate with real-time feedback (red border + error message)
  • Data persists in localStorage with proper serialization
  • Loading skeletons for async operations (not spinners)
  • Empty states: illustrated with icon + title + CTA button
  • Success feedback: toast notifications (build a simple toast system)
  • Keyboard navigation: Tab order, Enter to submit, Escape to close

TOAST NOTIFICATION SYSTEM (build in every complex app):
  • Fixed position bottom-right, stack multiple toasts
  • Types: success (green), error (red), info (blue), warning (amber)
  • Auto-dismiss after 3s with slide-out animation
  • Max 3 toasts visible at once

FOR GAMES (Canvas API — full production game):
  • Resolution: canvas fills viewport, use devicePixelRatio for sharp rendering
  • Game loop: requestAnimationFrame with delta time (dt in seconds)
  • State machine: 'menu' | 'playing' | 'paused' | 'gameover'
  • Menu screen: game title (large stylized text), high score, "Press SPACE or tap to start"
  • HUD: score, high score, lives (drawn directly on canvas), level
  • Pause: P or Escape key, dim overlay with "PAUSED" text
  • Keyboard AND touch controls (on-screen DPAD for mobile)
  • Particle system: pool of 50+ particles for explosions, scoring, effects
  • Difficulty: starts easy, ramps up every 30 seconds or every level
  • Game over: overlay with final score, high score comparison, restart button
  • AudioContext sounds: shoot (short beep), explosion (noise burst), score (ding)
  • Smooth movement: no teleporting, interpolate positions
  • Visual polish: gradient backgrounds, glow effects on players/bullets, shadows

FOR CALCULATORS / TOOLS:
  • Real math: use proper algorithms, handle edge cases (division by zero, etc.)
  • Calculation history panel (last 10 operations, clickable to reload)
  • Keyboard bindings: number keys, operators, Enter=calculate, Escape=clear, Backspace=delete
  • Copy result button with clipboard API + "Copied!" feedback
  • Animated result display (count-up animation for numbers)

FOR LANDING PAGES (full marketing page):
  • Sections IN ORDER: sticky-navbar + hero + social-proof + features + how-it-works + pricing + testimonials + FAQ + CTA-band + footer
  • Navbar: logo, nav links, CTA button, blur backdrop (backdrop-filter: blur(20px))
  • Hero: H1 (max 8 words, punchy), subheadline (1-2 sentences), 2 CTAs (primary+secondary), decorative element (gradient mesh or glassmorphism card mockup)
  • Social proof: logos or "X+ users" stats bar
  • Features: 6 cards in 2x3 grid, each with Lucide icon + title + 2-sentence description
  • How it works: 3-step numbered process with connecting lines
  • Pricing: 3 tiers, middle = "Most Popular" with accent border + badge, all prices filled in
  • Testimonials: 3 cards with avatar (colorful initials), name, role@company, quote
  • FAQ: 5+ accordion items
  • CTA band: gradient background (use accent color), bold headline, large button
  • Footer: 4 column grid, links, social icons (Lucide), copyright
  • Scroll animations: Intersection Observer → add 'visible' class → CSS transition
  • Smooth scroll for anchor links

FOR DASHBOARDS / APPS:
  • Layout: fixed left sidebar (240px) + main content area
  • Sidebar: app logo, nav items with Lucide icons, active state (accent bg), user avatar at bottom
  • Topbar: breadcrumbs, search bar, notification bell (with badge), user avatar + dropdown
  • Dashboard overview: 4 KPI cards with icon, value, trend (↑ +12% green / ↓ -3% red)
  • SVG or Canvas charts: line chart, bar chart, donut chart — write from scratch
  • Data table: sortable columns (click header), search filter, pagination (10 per page)
  • Sidebar mobile: hamburger button, slide-in overlay
  • Client-side routing: window.location.hash, render different views
  • At least 3 pages/views accessible from sidebar

════════════════════════════════════════
CONTENT RULES
════════════════════════════════════════
  • ZERO Lorem ipsum — write real, contextually appropriate content
  • Language: match the user's language EXACTLY (Russian prompt → Russian UI, English prompt → English UI)
  • Data: pre-populate with 5-10 realistic, believable sample items
  • Names: use real-sounding names for the domain (not "John Doe", not "Test User")
  • Numbers: realistic figures ($1,247.83 not $100, 47,291 users not 1000 users)
  • Copywriting: compelling, benefit-focused, not feature-focused

════════════════════════════════════════
CODE QUALITY
════════════════════════════════════════
  • Single HTML file with all CSS in <style> and all JS in <script> at end of body
  • CSS: use custom properties at :root level for colors, then reference them
  • JS structure: // Constants → // State → // DOM Refs → // Utilities → // Core Logic → // Event Listeners → // Init
  • ES6+: const/let, arrow functions, destructuring, template literals, async/await
  • No jQuery, no external JS beyond the CDN libs listed
  • Performance: requestAnimationFrame for animations, debounce(300ms) for search inputs
  • Error boundaries: wrap risky operations in try/catch with user-visible feedback

════════════════════════════════════════
FOR EDIT REQUESTS (existing files provided)
════════════════════════════════════════
  • Make SURGICAL changes — touch only what was asked
  • Preserve all existing functionality and design language
  • Do NOT rewrite the whole file unless explicitly requested
  • Return ONLY the files that were actually changed
  • Summary must clearly explain what was changed and why`

// ─── JSON extractor ───────────────────────────────────────────

interface AgentResponse {
  stage: string
  summary: string
  entryPoint?: string
  files: AgentFile[]
  _model?: string
}

function isValidResponse(obj: unknown): obj is AgentResponse {
  if (!obj || typeof obj !== 'object') return false
  const r = obj as Record<string, unknown>
  return (
    typeof r.stage === 'string' &&
    typeof r.summary === 'string' &&
    Array.isArray(r.files) &&
    r.files.every((f: unknown) =>
      f && typeof f === 'object' &&
      typeof (f as Record<string, unknown>).path === 'string' &&
      typeof (f as Record<string, unknown>).content === 'string'
    )
  )
}

function extractJSON(text: string): AgentResponse | null {
  const attempts = [
    () => JSON.parse(text),
    () => JSON.parse(text.replace(/^```[a-z]*\n?/im, '').replace(/```\s*$/m, '').trim()),
    () => {
      const s = text.indexOf('{')
      const e = text.lastIndexOf('}')
      return s !== -1 && e > s ? JSON.parse(text.slice(s, e + 1)) : null
    },
  ]
  for (const attempt of attempts) {
    try { const p = attempt(); if (isValidResponse(p)) return p } catch { /* next */ }
  }
  return null
}

function salvageHTML(text: string): AgentResponse | null {
  const m = text.match(/<!DOCTYPE[\s\S]*<\/html>/i)
  if (!m) return null
  return { stage: 'complete', summary: 'Приложение сгенерировано', entryPoint: 'index.html', files: [{ path: 'index.html', content: m[0] }] }
}

// ─── Agent Loop — валидация HTML ──────────────────────────────

function validateHTML(html: string): string[] {
  const errors: string[] = []
  if (!html.includes('<!DOCTYPE') && !html.includes('<html')) {
    errors.push('Missing <!DOCTYPE html> or <html> tag')
  }
  // Check for unclosed script/style tags
  const scripts = (html.match(/<script/gi) || []).length
  const scriptsClose = (html.match(/<\/script>/gi) || []).length
  if (scripts !== scriptsClose) errors.push(`Unclosed <script> tags: ${scripts} opened, ${scriptsClose} closed`)

  const styles = (html.match(/<style/gi) || []).length
  const stylesClose = (html.match(/<\/style>/gi) || []).length
  if (styles !== stylesClose) errors.push(`Unclosed <style> tags: ${styles} opened, ${stylesClose} closed`)

  // Check for truncated output
  if (html.length > 100 && !html.trim().endsWith('>')) {
    errors.push('Output appears truncated — does not end with a closing tag')
  }

  return errors
}

// ─── NDJSON helpers ───────────────────────────────────────────

function encodeEvent(obj: Record<string, unknown>): Uint8Array {
  return new TextEncoder().encode(JSON.stringify(obj) + '\n')
}

// ─── Route handler ────────────────────────────────────────────

const MAX_FIX_ITERATIONS = 2

export async function POST(req: NextRequest) {
  const env: EnvKeys = {
    openrouterKey: process.env.OPENROUTER_API_KEY,
    googleKey:     process.env.GOOGLE_AI_API_KEY,
    mistralKey:    process.env.MISTRAL_API_KEY,
    groqKey:       process.env.GROQ_API_KEY,
    cerebrasKey:   process.env.CEREBRAS_API_KEY,
  }

  const hasAnyKey = Object.values(env).some(Boolean)
  if (!hasAnyKey) {
    return new Response(
      JSON.stringify({ type: 'error', text: 'Ни один API-ключ не сконфигурирован' }) + '\n',
      { status: 401, headers: { 'Content-Type': 'application/x-ndjson' } }
    )
  }

  let body: { messages: ChatMessage[]; projectFiles?: AgentFile[]; model?: string }
  try { body = await req.json() }
  catch { return new Response(JSON.stringify({ type: 'error', text: 'Неверный JSON' }) + '\n', { status: 400, headers: { 'Content-Type': 'application/x-ndjson' } }) }

  const { messages, projectFiles = [], model: requestedModel } = body
  const isEdit      = projectFiles.length > 0
  const lastUserMsg = messages.filter(m => m.role === 'user').at(-1)?.content ?? ''
  const modelKey    = requestedModel && requestedModel !== 'auto'
    ? requestedModel
    : selectModel(lastUserMsg, isEdit)

  // Resolve display model ID for UI
  const providerModel = ALL_MODELS.find(m => m.key === modelKey)
  const displayModelId = providerModel?.modelId ?? modelKey

  const history = messages.map(m => ({ role: m.role as 'user' | 'assistant', content: m.content }))

  // Для edit-запросов — добавляем файлы в контекст
  if (projectFiles.length > 0 && history.length > 0) {
    const ctx = projectFiles.map(f => `\n\n--- CURRENT FILE: ${f.path} ---\n${f.content}`).join('')
    history[history.length - 1].content += `\n\nExisting project files for context:${ctx}`
  }

  const stream = new ReadableStream({
    async start(controller) {
      const send = (obj: Record<string, unknown>) => controller.enqueue(encodeEvent(obj))

      try {
        send({ type: 'status', text: isEdit ? 'Анализирую изменения...' : 'Анализирую задачу...' })
        send({ type: 'model', model: displayModelId })

        let currentHistory = [...history]
        let parsed: AgentResponse | null = null

        // ── Agent Loop: generate → validate → fix ──────────────
        for (let iteration = 0; iteration <= MAX_FIX_ITERATIONS; iteration++) {
          const isFixIteration = iteration > 0

          if (isFixIteration) {
            send({ type: 'status', text: `Исправляю ошибки (попытка ${iteration}/${MAX_FIX_ITERATIONS})...` })
          } else {
            send({ type: 'status', text: isEdit ? 'Вношу правки...' : 'Генерирую приложение...' })
          }

          let rawText = ''

          rawText = await streamWithRetry(
            modelKey,
            currentHistory,
            SYSTEM_GENERATE,
            chunk => send({ type: 'chunk', text: chunk }),
            env,
            (from, to, reason) => {
              send({ type: 'status', text: `Переключаюсь на резервную модель (${to})...` })
            },
          )

          send({ type: 'status', text: 'Обрабатываю результат...' })
          parsed = extractJSON(rawText) ?? salvageHTML(rawText)

          if (!parsed) {
            if (iteration < MAX_FIX_ITERATIONS) {
              // Ask AI to fix its output format
              currentHistory = [
                ...currentHistory,
                { role: 'assistant' as const, content: rawText },
                { role: 'user' as const, content: 'Your response was not valid JSON. Please respond ONLY with the JSON object as specified in the format above. No markdown, no code fences.' },
              ]
              continue
            }
            send({ type: 'error', text: 'Модель вернула некорректный ответ. Попробуйте ещё раз.' })
            controller.close()
            return
          }

          // Validate HTML in generated files
          const htmlFile = parsed.files.find(f => f.path.endsWith('.html'))
          if (htmlFile) {
            const htmlErrors = validateHTML(htmlFile.content)
            if (htmlErrors.length > 0 && iteration < MAX_FIX_ITERATIONS) {
              send({ type: 'status', text: `Найдены ошибки в HTML, исправляю...` })
              currentHistory = [
                ...currentHistory,
                { role: 'assistant' as const, content: rawText },
                { role: 'user' as const, content: `The generated HTML has these errors:\n${htmlErrors.map(e => `- ${e}`).join('\n')}\n\nPlease fix them and return the corrected JSON response.` },
              ]
              continue
            }
          }

          // All good — exit loop
          break
        }

        if (!parsed) {
          send({ type: 'error', text: 'Не удалось получить корректный ответ от модели.' })
          controller.close()
          return
        }

        send({ type: 'result', data: { ...parsed, _model: displayModelId } })

      } catch (err) {
        send({ type: 'error', text: err instanceof Error ? err.message : String(err) })
      } finally {
        controller.close()
      }
    }
  })

  return new Response(stream, {
    headers: { 'Content-Type': 'application/x-ndjson', 'Cache-Control': 'no-cache', 'X-Accel-Buffering': 'no' },
  })
}
