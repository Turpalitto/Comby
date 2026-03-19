/**
 * model-router.ts
 *
 * Unified AI provider router for COMBI.
 * All providers use the OpenAI-compatible chat completions API,
 * including Gemini via Google's OpenAI-compatible endpoint.
 *
 * Task → provider priority:
 *   default  → OpenRouter → Cerebras → Gemini → Groq → Mistral
 *   fast     → Groq → Cerebras → OpenRouter → Mistral → Gemini
 *   complex  → Gemini → OpenRouter → Mistral → Cerebras → Groq
 *   code     → Mistral → OpenRouter → Gemini → Cerebras → Groq
 */

export type TaskType = 'default' | 'fast' | 'complex' | 'code';

interface Provider {
  id:      string;
  label:   string;
  model:   string;
  baseUrl: string;
  apiKey:  string;
  /** Extra headers required by the provider */
  headers?: Record<string, string>;
}

// ─── Provider definitions ────────────────────────────────────

function buildProviders(): Partial<Record<string, Provider>> {
  const env = process.env;

  return {
    openrouter: env.OPENROUTER_API_KEY ? {
      id:      'openrouter',
      label:   'OpenRouter / gemini-2.0-flash',
      model:   'google/gemini-2.0-flash-001',
      baseUrl: 'https://openrouter.ai/api/v1',
      apiKey:  env.OPENROUTER_API_KEY,
      headers: {
        'HTTP-Referer': 'http://localhost:3003',
        'X-Title':      'combi-builder',
      },
    } : undefined,

    groq: env.GROQ_API_KEY ? {
      id:      'groq',
      label:   'Groq / llama-3.3-70b',
      model:   'llama-3.3-70b-versatile',
      baseUrl: 'https://api.groq.com/openai/v1',
      apiKey:  env.GROQ_API_KEY,
    } : undefined,

    gemini: env.GOOGLE_AI_API_KEY ? {
      id:      'gemini',
      label:   'Gemini / gemini-1.5-pro',
      // Use pro for complex tasks; flash for default via OpenRouter
      model:   'gemini-1.5-pro',
      baseUrl: 'https://generativelanguage.googleapis.com/v1beta/openai',
      apiKey:  env.GOOGLE_AI_API_KEY,
    } : undefined,

    cerebras: env.CEREBRAS_API_KEY ? {
      id:      'cerebras',
      label:   'Cerebras / llama3.1-8b',
      model:   'llama3.1-8b',
      baseUrl: 'https://api.cerebras.ai/v1',
      apiKey:  env.CEREBRAS_API_KEY,
    } : undefined,

    mistral: env.MISTRAL_API_KEY ? {
      id:      'mistral',
      label:   'Mistral / codestral-latest',
      model:   'codestral-latest',
      baseUrl: 'https://api.mistral.ai/v1',
      apiKey:  env.MISTRAL_API_KEY,
    } : undefined,
  };
}

// ─── Priority matrix ─────────────────────────────────────────

const PRIORITY: Record<TaskType, string[]> = {
  default: ['openrouter', 'cerebras', 'gemini', 'groq', 'mistral'],
  fast:    ['groq', 'cerebras', 'openrouter', 'mistral', 'gemini'],
  complex: ['gemini', 'openrouter', 'mistral', 'cerebras', 'groq'],
  code:    ['mistral', 'openrouter', 'gemini', 'cerebras', 'groq'],
};

// ─── Public API ───────────────────────────────────────────────

export function selectProvider(task: TaskType = 'default'): Provider {
  const available = buildProviders();
  const order = PRIORITY[task];

  for (const id of order) {
    const p = available[id];
    if (p) return p;
  }

  throw new Error(
    'No AI provider configured. Add at least one API key to .env.local:\n' +
    '  OPENROUTER_API_KEY, GROQ_API_KEY, GOOGLE_AI_API_KEY, CEREBRAS_API_KEY, MISTRAL_API_KEY',
  );
}

export interface StreamResult {
  stream:   ReadableStream<Uint8Array>;
  provider: string;
}

/**
 * Generate a streaming response from the best available provider for the given task.
 * Returns an SSE-decoded text stream and the provider label for logging/headers.
 */
export async function generateStream(
  messages: { role: string; content: string }[],
  task: TaskType = 'default',
): Promise<StreamResult> {
  const provider = selectProvider(task);
  const encoder  = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        const res = await fetch(`${provider.baseUrl}/chat/completions`, {
          method:  'POST',
          headers: {
            'Content-Type':  'application/json',
            'Authorization': `Bearer ${provider.apiKey}`,
            ...provider.headers,
          },
          body: JSON.stringify({
            model:    provider.model,
            stream:   true,
            messages,
          }),
        });

        if (!res.ok || !res.body) {
          const err = await res.text().catch(() => `HTTP ${res.status}`);
          controller.enqueue(encoder.encode(`<!-- AI_ERROR [${provider.id}]: ${err} -->`));
          controller.close();
          return;
        }

        const reader = res.body.getReader();
        const dec    = new TextDecoder();
        let buf      = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buf += dec.decode(value, { stream: true });
          const lines = buf.split('\n');
          buf = lines.pop() ?? '';

          for (const line of lines) {
            const trimmed = line.replace(/^data:\s*/, '');
            if (!trimmed || trimmed === '[DONE]') continue;
            try {
              const json = JSON.parse(trimmed);
              const text = json.choices?.[0]?.delta?.content ?? '';
              if (text) controller.enqueue(encoder.encode(text));
            } catch { /* skip malformed SSE chunks */ }
          }
        }

        controller.close();
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        controller.enqueue(encoder.encode(`<!-- AI_ERROR [${provider.id}]: ${msg} -->`));
        controller.close();
      }
    },
  });

  return { stream, provider: provider.label };
}
