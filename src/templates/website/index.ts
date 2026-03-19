import type { WebsiteSpec } from '@/core/types';

export function buildWebsiteHTML(spec: WebsiteSpec): string {
  const { title, description, primaryColor, sections, tone } = spec;

  const toneFont = tone === 'playful'
    ? 'Nunito'
    : tone === 'minimal'
    ? 'DM Sans'
    : 'Inter';

  const hasSection = (s: typeof sections[number]) => sections.includes(s);

  return /* html */`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escHtml(title)}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link href="https://fonts.googleapis.com/css2?family=${toneFont}:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
  <script src="https://cdn.tailwindcss.com"></script>
  <script>
    tailwind.config = {
      theme: {
        extend: {
          colors: { brand: '${primaryColor}' },
          fontFamily: { sans: ['${toneFont}', 'system-ui', 'sans-serif'] },
        }
      }
    }
  </script>
  <style>
    :root { --brand: ${primaryColor}; }
    html { scroll-behavior: smooth; }
    .gradient-hero {
      background: radial-gradient(ellipse 80% 60% at 50% -10%, ${primaryColor}22, transparent 70%);
    }
  </style>
</head>
<body class="bg-neutral-950 text-neutral-100 font-sans antialiased">

  <!-- NAV -->
  <nav class="fixed top-0 left-0 right-0 z-50 border-b border-white/5 backdrop-blur bg-neutral-950/80">
    <div class="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
      <span class="font-bold text-white">${escHtml(title)}</span>
      <div class="flex items-center gap-6 text-sm text-neutral-400">
        ${hasSection('features')     ? '<a href="#features"      class="hover:text-white transition">Features</a>'   : ''}
        ${hasSection('pricing')      ? '<a href="#pricing"       class="hover:text-white transition">Pricing</a>'    : ''}
        ${hasSection('testimonials') ? '<a href="#testimonials"  class="hover:text-white transition">Reviews</a>'    : ''}
        <a href="#cta" class="px-4 py-1.5 rounded-full text-white font-medium transition"
           style="background:${primaryColor}">Get started</a>
      </div>
    </div>
  </nav>

  ${hasSection('hero')         ? heroSection(title, description, primaryColor)     : ''}
  ${hasSection('features')     ? featuresSection(spec.features, primaryColor)      : ''}
  ${hasSection('testimonials') ? testimonialsSection()                             : ''}
  ${hasSection('pricing')      ? pricingSection(primaryColor)                      : ''}
  ${hasSection('cta')          ? ctaSection(title, primaryColor)                   : ''}
  ${hasSection('footer')       ? footerSection(title)                              : ''}

</body>
</html>`;
}

function heroSection(title: string, description: string, color: string): string {
  return /* html */`
  <section class="gradient-hero pt-36 pb-24 px-6 text-center">
    <div class="max-w-3xl mx-auto">
      <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10
                  bg-white/5 text-xs text-neutral-400 mb-6">
        <span class="w-1.5 h-1.5 rounded-full animate-pulse" style="background:${color}"></span>
        Now available — beta
      </div>
      <h1 class="text-5xl font-extrabold text-white leading-tight tracking-tight mb-5">
        ${escHtml(title)}
      </h1>
      <p class="text-lg text-neutral-400 max-w-xl mx-auto mb-10">
        ${escHtml(description || 'The fastest way to go from idea to product. Built for teams that ship.')}
      </p>
      <div class="flex flex-col sm:flex-row gap-3 justify-center">
        <a href="#cta" class="px-8 py-3 rounded-lg font-semibold text-white transition hover:opacity-90"
           style="background:${color}">Get started free →</a>
        <a href="#features"
           class="px-8 py-3 rounded-lg font-semibold text-neutral-300 border border-neutral-800
                  hover:border-neutral-600 transition">See how it works</a>
      </div>
      <div class="mt-16 rounded-2xl border border-white/10 bg-neutral-900 overflow-hidden shadow-2xl">
        <div class="flex items-center gap-2 px-4 py-3 border-b border-neutral-800">
          <span class="w-3 h-3 rounded-full bg-red-500/60"></span>
          <span class="w-3 h-3 rounded-full bg-yellow-500/60"></span>
          <span class="w-3 h-3 rounded-full bg-green-500/60"></span>
          <span class="ml-2 text-xs text-neutral-600 font-mono">
            ${escHtml(title.toLowerCase().replace(/\s+/g, '-'))}.app
          </span>
        </div>
        <div class="p-6 grid grid-cols-3 gap-4">
          ${[['📈','Growth','+24%'],['👥','Users','1,204'],['⚡','Speed','99ms']].map(([icon,label,val]) => `
          <div class="rounded-xl bg-neutral-800/60 p-4 text-center">
            <div class="text-2xl mb-1">${icon}</div>
            <div class="text-xs text-neutral-500">${label}</div>
            <div class="text-lg font-bold text-white">${val}</div>
          </div>`).join('')}
        </div>
      </div>
    </div>
  </section>`;
}

function featuresSection(features: string[], color: string): string {
  const defaults = [
    ['⚡','Lightning fast',   'Built for speed from day one. No compromises on performance.'],
    ['🔒','Secure by default','Enterprise-grade security baked into every layer.'],
    ['🎯','Precision built',  'Every detail crafted to help your team move faster.'],
    ['📊','Rich analytics',   'Understand what matters with clear, actionable insights.'],
    ['🔌','Integrations',     'Connects with the tools your team already loves.'],
    ['🤝','Team-first',       'Built for collaboration. Works better the more you use it.'],
  ];
  const items = features.length >= 3
    ? features.slice(0, 6).map((f, i) => [defaults[i]?.[0] ?? '✦', f, ''])
    : defaults;

  return /* html */`
  <section id="features" class="py-24 px-6 border-t border-neutral-900">
    <div class="max-w-6xl mx-auto">
      <div class="text-center mb-16">
        <h2 class="text-3xl font-bold text-white mb-3">Everything you need</h2>
        <p class="text-neutral-400 max-w-md mx-auto">
          Designed to take you from zero to production without the overhead.
        </p>
      </div>
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        ${items.map(([icon,label,desc]) => `
        <div class="rounded-2xl border border-neutral-800 bg-neutral-900/50 p-6
                    hover:border-neutral-600 transition-all">
          <div class="w-10 h-10 rounded-xl flex items-center justify-center text-xl mb-4"
               style="background:${color}22">${icon}</div>
          <h3 class="font-semibold text-white mb-1">${escHtml(String(label))}</h3>
          <p class="text-sm text-neutral-500">${escHtml(String(desc))}</p>
        </div>`).join('')}
      </div>
    </div>
  </section>`;
}

function testimonialsSection(): string {
  const quotes = [
    { text: 'Shipped our MVP in a weekend. The whole team was blown away.',
      name: 'Sarah K.', role: 'CTO at Flowbase' },
    { text: "We tried everything. This is the only tool that actually fits how our team works.",
      name: 'Marcus L.', role: 'Lead Engineer at Grido' },
    { text: 'Replaced three tools with this one. Velocity doubled in the first month.',
      name: 'Priya M.', role: 'Product Lead at Arkko' },
  ];
  return /* html */`
  <section id="testimonials" class="py-24 px-6 bg-neutral-900/30 border-t border-neutral-900">
    <div class="max-w-6xl mx-auto">
      <div class="text-center mb-16">
        <h2 class="text-3xl font-bold text-white mb-3">Loved by builders</h2>
        <p class="text-neutral-400">Join thousands of teams shipping faster.</p>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-5">
        ${quotes.map(q => `
        <div class="rounded-2xl border border-neutral-800 bg-neutral-900 p-6">
          <div class="text-2xl mb-4">★★★★★</div>
          <p class="text-neutral-300 text-sm leading-relaxed mb-5">"${escHtml(q.text)}"</p>
          <div class="flex items-center gap-3">
            <div class="w-8 h-8 rounded-full bg-neutral-700 flex items-center justify-center
                        text-xs font-bold text-white">${q.name.charAt(0)}</div>
            <div>
              <div class="text-sm font-medium text-white">${escHtml(q.name)}</div>
              <div class="text-xs text-neutral-500">${escHtml(q.role)}</div>
            </div>
          </div>
        </div>`).join('')}
      </div>
    </div>
  </section>`;
}

function pricingSection(color: string): string {
  const plans = [
    { name: 'Starter', price: 'Free', desc: 'For individuals and side projects.',
      features: ['3 projects','5GB storage','Community support'], highlight: false },
    { name: 'Pro',     price: '$29',  desc: 'For growing teams.',
      features: ['Unlimited projects','50GB storage','Priority support','Analytics'], highlight: true },
    { name: 'Team',    price: '$99',  desc: 'For scaling organisations.',
      features: ['Everything in Pro','Team seats','SSO','SLA'], highlight: false },
  ];
  return /* html */`
  <section id="pricing" class="py-24 px-6 border-t border-neutral-900">
    <div class="max-w-5xl mx-auto">
      <div class="text-center mb-16">
        <h2 class="text-3xl font-bold text-white mb-3">Simple pricing</h2>
        <p class="text-neutral-400">No surprises. Cancel anytime.</p>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-5 items-start">
        ${plans.map(p => `
        <div class="rounded-2xl border p-6 relative
          ${p.highlight ? 'border-indigo-500 bg-indigo-500/5' : 'border-neutral-800 bg-neutral-900/50'}">
          ${p.highlight ? `<div class="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5
            rounded-full text-xs font-semibold text-white" style="background:${color}">Most popular</div>` : ''}
          <div class="mb-4">
            <div class="font-semibold text-white mb-1">${escHtml(p.name)}</div>
            <div class="text-3xl font-extrabold text-white">
              ${escHtml(p.price)}
              ${p.price !== 'Free' ? '<span class="text-sm font-normal text-neutral-400">/mo</span>' : ''}
            </div>
            <p class="text-xs text-neutral-500 mt-1">${escHtml(p.desc)}</p>
          </div>
          <ul class="space-y-2 mb-6">
            ${p.features.map(f => `
            <li class="text-sm text-neutral-400 flex items-center gap-2">
              <span style="color:${color}">✓</span> ${escHtml(f)}
            </li>`).join('')}
          </ul>
          <button class="w-full py-2 rounded-lg text-sm font-semibold transition
            ${p.highlight ? 'text-white hover:opacity-90' : 'border border-neutral-700 text-neutral-300 hover:border-neutral-500'}"
            ${p.highlight ? `style="background:${color}"` : ''}>
            Get started
          </button>
        </div>`).join('')}
      </div>
    </div>
  </section>`;
}

function ctaSection(title: string, color: string): string {
  return /* html */`
  <section id="cta" class="py-24 px-6 border-t border-neutral-900">
    <div class="max-w-2xl mx-auto text-center">
      <h2 class="text-4xl font-extrabold text-white mb-4">Ready to ship faster?</h2>
      <p class="text-neutral-400 mb-8">
        Join thousands of teams using ${escHtml(title)} to build better products.
      </p>
      <a href="#" class="inline-block px-10 py-3.5 rounded-xl font-semibold text-white
                         transition hover:opacity-90"
         style="background:${color}; box-shadow: 0 0 40px ${color}55">
        Start for free →
      </a>
    </div>
  </section>`;
}

function footerSection(title: string): string {
  return /* html */`
  <footer class="border-t border-neutral-900 py-10 px-6">
    <div class="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
      <span class="font-bold text-white">${escHtml(title)}</span>
      <p class="text-xs text-neutral-600">
        © ${new Date().getFullYear()} ${escHtml(title)}. Built with local-ai-builder.
      </p>
    </div>
  </footer>`;
}

function escHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
