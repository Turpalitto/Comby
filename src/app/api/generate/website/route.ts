import { NextRequest, NextResponse } from 'next/server';
import type { WebsiteSpec } from '@/core/types';
import { buildProjectContext } from '@/generation/aiService';
import { generateStream } from '@/lib/model-router';

// ─── Prompt builder ───────────────────────────────────────────

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

// ─── Route handler ────────────────────────────────────────────

export async function POST(req: NextRequest) {
  let spec: WebsiteSpec;
  try {
    const body = await req.json();
    spec = body.spec as WebsiteSpec;
    if (!spec?.type || spec.type !== 'website') throw new Error('Invalid spec');
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  try {
    const messages = [{ role: 'user', content: buildUserPrompt(spec) }];
    const { stream, provider } = await generateStream(messages, 'default');

    return new NextResponse(stream, {
      headers: {
        'Content-Type':     'text/html; charset=utf-8',
        'Transfer-Encoding': 'chunked',
        'X-Generator':       provider,
      },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 503 });
  }
}
