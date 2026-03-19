import { NextRequest } from 'next/server'
import { streamWithRetry, type EnvKeys } from '@/lib/providers'
import type { ChatMsg } from '@/lib/providers'

const CHAT_SYSTEM = `You are a helpful, knowledgeable AI assistant. Be concise, clear, and friendly.
- Use markdown formatting where helpful (bold, code blocks, lists)
- For code examples, always use proper code blocks with language hints
- Answer in the same language the user writes in`

function encodeEvent(obj: Record<string, unknown>): Uint8Array {
  return new TextEncoder().encode(JSON.stringify(obj) + '\n')
}

export async function POST(req: NextRequest) {
  let body: { messages: ChatMsg[]; model: string }
  try { body = await req.json() }
  catch { return new Response(JSON.stringify({ type: 'error', text: 'Invalid JSON' }) + '\n', { status: 400 }) }

  // Default to gemini-flash — much higher free quota than 3.1-pro-preview
  const { messages, model = 'gemini-flash' } = body

  const env: EnvKeys = {
    openrouterKey: process.env.OPENROUTER_API_KEY,
    googleKey:     process.env.GOOGLE_AI_API_KEY,
    mistralKey:    process.env.MISTRAL_API_KEY,
    groqKey:       process.env.GROQ_API_KEY,
    cerebrasKey:   process.env.CEREBRAS_API_KEY,
  }

  const stream = new ReadableStream({
    async start(controller) {
      const send = (obj: Record<string, unknown>) => controller.enqueue(encodeEvent(obj))
      try {
        await streamWithRetry(
          model,
          messages,
          CHAT_SYSTEM,
          text => send({ type: 'chunk', text }),
          env,
          (from, to) => send({ type: 'status', text: `Переключаюсь на ${to}...` })
        )
        send({ type: 'done' })
      } catch (err) {
        send({ type: 'error', text: err instanceof Error ? err.message : String(err) })
      } finally {
        controller.close()
      }
    }
  })

  return new Response(stream, {
    headers: { 'Content-Type': 'application/x-ndjson', 'Cache-Control': 'no-cache' }
  })
}
