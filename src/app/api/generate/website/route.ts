import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import type { WebsiteSpec } from '@/core/types';
import { buildProjectContext } from '@/generation/aiService';

// ─── Prompts ──────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are an expert frontend web developer.
Your task: generate a single, complete, self-contained HTML file for a website.

STRICT REQUIREMENTS:
- Output ONLY raw HTML. No markdown. No code blocks. No explanation. No \`\`\`html.
- Start with <!DOCTYPE html> and end with </html>. Nothing before or after.
- Use Tailwind CSS via CDN: <script src="https://cdn.tailwindcss.com"></script>
- Use Google Fonts via <link> in <head>
- Single file — all CSS and JS must be inline (no external files)
- Dark theme: base background #0a0a0f or neutral-950
- The primary accent color is specified in the spec — use it for buttons, highlights, glows
- NO placeholder images — use CSS gradients, emoji, SVG shapes, or pure CSS art
- Smooth scroll: html { scroll-behavior: smooth }
- Responsive: mobile-first, works at 375px and 1280px
- Working anchor links in navigation
- Real, varied copy — not "Lorem ipsum". Write believable marketing text.
- Each section must look polished: proper padding, typography scale, hover states
- Add subtle animations where natural`;

function buildUserPrompt(spec: WebsiteSpec): string {
  const ctx = buildProjectContext(spec);
  const sectionGuide: Record<string, string> = {
    hero:         'Full-width hero with headline, subheadline, CTA button(s), and a visual element',
    features:     'Grid of feature cards (3–6), each with icon, title, and description',
    testimonials: '2–3 testimonial cards with quote, name, role, and avatar initial',
    pricing:      '3-column pricing table (Starter/Pro/Team), one highlighted as popular',
    cta:          'Full-width CTA band with headline and primary button',
    footer:       'Footer with logo, copyright, and optional links',
  };
  const sections = spec.sections.map(s => `- ${s.toUpperCase()}: ${sectionGuide[s] ?? s}`).join('\n');
  return `${SYSTEM_PROMPT}

Generate the website HTML based on this spec:
${ctx}

SECTIONS TO INCLUDE (in order):
${sections}

Primary color hex: ${spec.primaryColor}
Font: ${spec.tone === 'playful' ? 'Nunito' : spec.tone === 'minimal' ? 'DM Sans' : spec.tone === 'casual' ? 'Plus Jakarta Sans' : 'Inter'} from Google Fonts

Remember: output ONLY the raw HTML file, nothing else.`;
}

// ─── Generators ───────────────────────────────────────────────

async function generateWithGemini(spec: WebsiteSpec, apiKey: string): Promise<ReadableStream<Uint8Array>> {
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
  const encoder = new TextEncoder();

  return new ReadableStream({
    async start(controller) {
      try {
        const result = await model.generateContentStream(buildUserPrompt(spec));
        for await (const chunk of result.stream) {
          const text = chunk.text();
          if (text) controller.enqueue(encoder.encode(text));
        }
        controller.close();
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Unknown error';
        controller.enqueue(encoder.encode(`<!-- AI_ERROR: ${msg} -->`));
        controller.close();
      }
    },
  });
}

async function generateWithOpenRouter(spec: WebsiteSpec, apiKey: string): Promise<ReadableStream<Uint8Array>> {
  const encoder = new TextEncoder();

  return new ReadableStream({
    async start(controller) {
      try {
        const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'http://localhost:3003',
            'X-Title': 'local-ai-builder',
          },
          body: JSON.stringify({
            model: 'google/gemini-2.0-flash-001',
            stream: true,
            messages: [{ role: 'user', content: buildUserPrompt(spec) }],
          }),
        });

        if (!res.ok || !res.body) {
          const err = await res.text();
          controller.enqueue(encoder.encode(`<!-- AI_ERROR: OpenRouter ${res.status}: ${err} -->`));
          controller.close();
          return;
        }

        const reader = res.body.getReader();
        const dec = new TextDecoder();
        let buf = '';

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
            } catch { /* skip malformed */ }
          }
        }
        controller.close();
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Unknown error';
        controller.enqueue(encoder.encode(`<!-- AI_ERROR: ${msg} -->`));
        controller.close();
      }
    },
  });
}

// ─── Route handler ────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const geminiKey     = process.env.GOOGLE_AI_API_KEY ?? '';
  const openrouterKey = process.env.OPENROUTER_API_KEY ?? '';

  if (!geminiKey && !openrouterKey) {
    return NextResponse.json(
      { error: 'No AI key found. Set GOOGLE_AI_API_KEY or OPENROUTER_API_KEY in .env.local.' },
      { status: 401 },
    );
  }

  let spec: WebsiteSpec;
  try {
    const body = await req.json();
    spec = body.spec as WebsiteSpec;
    if (!spec?.type || spec.type !== 'website') throw new Error('Invalid spec');
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  // Prefer Gemini, fall back to OpenRouter
  const stream = geminiKey
    ? await generateWithGemini(spec, geminiKey)
    : await generateWithOpenRouter(spec, openrouterKey);

  return new NextResponse(stream, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Transfer-Encoding': 'chunked',
      'X-Generator': geminiKey ? 'gemini-2.0-flash' : 'openrouter/gemini-2.0-flash',
    },
  });
}
