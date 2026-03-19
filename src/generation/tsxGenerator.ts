import type { WebsiteSpec, AppSpec, ProjectSpec, GeneratedFile } from '@/core/types'

// ─── Entry point ──────────────────────────────────────────────

export function generateTsxFiles(spec: ProjectSpec): GeneratedFile[] {
  switch (spec.type) {
    case 'website': return generateWebsite(spec)
    case 'app':     return generateApp(spec)
    default:        return []
  }
}

// ─── Helpers ──────────────────────────────────────────────────

function esc(s: string): string {
  return s.replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]!))
}

function jsStr(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n')
}

// ─── Layout (shared) ─────────────────────────────────────────

function buildLayout(title: string): string {
  return `import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: '${jsStr(title)}',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body style={{ margin: 0, fontFamily: "'Inter', system-ui, sans-serif" }}>{children}</body>
    </html>
  )
}
`
}

// ═══════════════════════════════════════════════════════════════
// WEBSITE GENERATOR
// ═══════════════════════════════════════════════════════════════

function generateWebsite(spec: WebsiteSpec): GeneratedFile[] {
  return [
    { path: 'app/layout.tsx',  content: buildLayout(spec.title) },
    { path: 'app/globals.css', content: buildGlobalsCss() },
    { path: 'app/page.tsx',    content: buildWebsitePage(spec) },
  ]
}

function buildGlobalsCss(): string {
  return `@tailwind base;\n@tailwind components;\n@tailwind utilities;\n\n* { box-sizing: border-box; }\nhtml { scroll-behavior: smooth; }\n`
}

function buildWebsitePage(spec: WebsiteSpec): string {
  const { title, description, primaryColor, sections, tone, features } = spec

  const isDark    = tone === 'professional' || tone === 'casual'
  const isMinimal = tone === 'minimal'
  const bg        = isMinimal ? '#ffffff' : '#0a0a0a'
  const text      = isMinimal ? '#111111' : '#f1f5f9'
  const muted     = isMinimal ? '#64748b' : '#94a3b8'
  const border    = isMinimal ? '#e2e8f0' : 'rgba(255,255,255,0.08)'
  const cardBg    = isMinimal ? '#f8fafc' : '#111111'

  // Generate feature items — use spec.features if present, else defaults
  const featureItems = features.length > 0
    ? features.slice(0, 6).map((f, i) => ({ icon: ['⚡','🎯','🔒','📊','🚀','✨'][i % 6], title: f, desc: 'Built to help you succeed faster than ever before.' }))
    : [
        { icon: '⚡', title: 'Lightning Fast',   desc: 'Optimized for peak performance.' },
        { icon: '🎯', title: 'Precision Tools',  desc: 'Get exactly what you need, every time.' },
        { icon: '🔒', title: 'Secure by Default', desc: 'Enterprise-grade security built in.' },
        { icon: '📊', title: 'Smart Analytics',  desc: 'Real-time insights at your fingertips.' },
        { icon: '🚀', title: 'Instant Deploy',   desc: 'Go live in seconds, not days.' },
        { icon: '✨', title: 'AI-Powered',        desc: 'Intelligent automation for every workflow.' },
      ]

  const featureItemsJson = JSON.stringify(featureItems)

  // Tagline: use spec.description if set, else tone-based fallback
  const tagline = description && description.trim()
    ? description
    : tone === 'playful'
    ? 'The most fun way to get things done'
    : tone === 'minimal'
    ? 'Simple. Fast. Effective.'
    : tone === 'casual'
    ? 'Everything you need, nothing you don\'t'
    : 'The professional platform for modern teams'

  const showFeatures     = sections.includes('features')
  const showTestimonials = sections.includes('testimonials')
  const showPricing      = sections.includes('pricing')

  // suppress unused variable warning
  void isDark

  return `'use client';

// ─── Spec ────────────────────────────────────────────────────
const TITLE        = "${jsStr(title)}";
const TAGLINE      = "${jsStr(tagline)}";
const PRIMARY      = "${primaryColor}";
const BG           = "${bg}";
const TEXT         = "${text}";
const MUTED        = "${muted}";
const BORDER       = "${border}";
const CARD_BG      = "${cardBg}";
const SHOW_FEATURES     = ${showFeatures};
const SHOW_TESTIMONIALS = ${showTestimonials};
const SHOW_PRICING      = ${showPricing};

const FEATURES = ${featureItemsJson} as const;

const TESTIMONIALS = [
  { name: 'Sarah K.',   role: 'CEO at TechCorp',   text: 'Absolutely transformed how our team works. Cannot recommend highly enough.' },
  { name: 'Mark R.',    role: 'Lead Developer',     text: 'The best tool we have adopted this year. Saves us hours every week.' },
  { name: 'Anna M.',    role: 'Product Manager',    text: 'Intuitive, fast, and reliable. Exactly what we were looking for.' },
] as const;

const PRICING = [
  { name: 'Free',       price: '$0',   period: '/mo', features: ['5 projects', '1 GB storage', 'Basic analytics', 'Community support'],            cta: 'Get started',  highlight: false },
  { name: 'Pro',        price: '$29',  period: '/mo', features: ['Unlimited projects', '50 GB storage', 'Advanced analytics', 'Priority support'], cta: 'Start free trial', highlight: true  },
  { name: 'Enterprise', price: '$99',  period: '/mo', features: ['Everything in Pro', 'Custom integrations', 'SLA guarantee', 'Dedicated support'],  cta: 'Contact sales', highlight: false },
] as const;

// ─── Page ────────────────────────────────────────────────────
export default function Page() {
  return (
    <div style={{ minHeight: '100vh', background: BG, color: TEXT, fontFamily: "'Inter', system-ui, sans-serif" }}>
      <Nav />
      <Hero />
      {SHOW_FEATURES     && <Features />}
      {SHOW_TESTIMONIALS && <Testimonials />}
      {SHOW_PRICING      && <Pricing />}
      <CTA />
      <Footer />
    </div>
  );
}

// ─── Nav ─────────────────────────────────────────────────────
function Nav() {
  return (
    <nav style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
      borderBottom: \`1px solid \${BORDER}\`,
      backdropFilter: 'blur(12px)',
      background: BG + 'cc',
    }}>
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontWeight: 800, fontSize: 16, color: TEXT }}>{TITLE}</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          {SHOW_FEATURES && <a href="#features" style={{ fontSize: 14, color: MUTED, textDecoration: 'none' }}>Features</a>}
          {SHOW_PRICING  && <a href="#pricing"  style={{ fontSize: 14, color: MUTED, textDecoration: 'none' }}>Pricing</a>}
          <a href="#cta" style={{
            padding: '6px 18px', borderRadius: 999, fontSize: 14, fontWeight: 600,
            background: PRIMARY, color: '#fff', textDecoration: 'none',
          }}>Get started</a>
        </div>
      </div>
    </nav>
  );
}

// ─── Hero ────────────────────────────────────────────────────
function Hero() {
  return (
    <section style={{ paddingTop: 140, paddingBottom: 96, padding: '140px 24px 96px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
      <div style={{
        position: 'absolute', inset: 0, zIndex: 0,
        background: \`radial-gradient(ellipse 80% 55% at 50% -5%, \${PRIMARY}28, transparent 65%)\`,
      }} />
      <div style={{ maxWidth: 800, margin: '0 auto', position: 'relative', zIndex: 1 }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          padding: '4px 14px', borderRadius: 999, border: \`1px solid \${BORDER}\`,
          background: 'rgba(255,255,255,0.04)', fontSize: 12, color: MUTED, marginBottom: 28,
        }}>
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: PRIMARY, animation: 'pulse 2s infinite' }} />
          Now available — beta
        </div>
        <h1 style={{ fontSize: 'clamp(36px, 6vw, 68px)', fontWeight: 800, color: TEXT, lineHeight: 1.1, letterSpacing: '-0.03em', marginBottom: 20 }}>
          {TITLE}
        </h1>
        <p style={{ fontSize: 20, color: MUTED, maxWidth: 520, margin: '0 auto 36px', lineHeight: 1.6 }}>
          {TAGLINE}
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <a href="#cta" style={{
            padding: '14px 32px', borderRadius: 12, fontWeight: 700, fontSize: 16,
            background: PRIMARY, color: '#fff', textDecoration: 'none',
            boxShadow: \`0 0 40px \${PRIMARY}44\`,
          }}>
            Get started free →
          </a>
          {SHOW_FEATURES && (
            <a href="#features" style={{
              padding: '14px 32px', borderRadius: 12, fontWeight: 600, fontSize: 16,
              border: \`1px solid \${BORDER}\`, color: MUTED, textDecoration: 'none',
            }}>
              See how it works
            </a>
          )}
        </div>
      </div>
    </section>
  );
}

// ─── Features ────────────────────────────────────────────────
function Features() {
  return (
    <section id="features" style={{ padding: '96px 24px', borderTop: \`1px solid \${BORDER}\` }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 60 }}>
          <h2 style={{ fontSize: 40, fontWeight: 800, color: TEXT, marginBottom: 12 }}>Everything you need</h2>
          <p style={{ fontSize: 18, color: MUTED }}>Powerful features built for modern teams.</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20 }}>
          {FEATURES.map((f, i) => (
            <div key={i} style={{
              padding: 28, borderRadius: 16, border: \`1px solid \${BORDER}\`,
              background: CARD_BG, transition: 'border-color 0.2s',
            }}>
              <div style={{ fontSize: 32, marginBottom: 14 }}>{f.icon}</div>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: TEXT, marginBottom: 8 }}>{f.title}</h3>
              <p style={{ fontSize: 14, color: MUTED, lineHeight: 1.6 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Testimonials ────────────────────────────────────────────
function Testimonials() {
  return (
    <section style={{ padding: '96px 24px', borderTop: \`1px solid \${BORDER}\` }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 60 }}>
          <h2 style={{ fontSize: 40, fontWeight: 800, color: TEXT, marginBottom: 12 }}>Loved by teams worldwide</h2>
          <p style={{ fontSize: 18, color: MUTED }}>Join thousands of companies already using {TITLE}.</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
          {TESTIMONIALS.map((t, i) => (
            <div key={i} style={{
              padding: 28, borderRadius: 16, border: \`1px solid \${BORDER}\`,
              background: CARD_BG,
            }}>
              <p style={{ fontSize: 15, color: MUTED, lineHeight: 1.7, marginBottom: 20, fontStyle: 'italic' }}>
                "{t.text}"
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: '50%',
                  background: PRIMARY + '33', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 14, fontWeight: 700, color: PRIMARY,
                }}>
                  {t.name[0]}
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: TEXT }}>{t.name}</div>
                  <div style={{ fontSize: 12, color: MUTED }}>{t.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Pricing ─────────────────────────────────────────────────
function Pricing() {
  return (
    <section id="pricing" style={{ padding: '96px 24px', borderTop: \`1px solid \${BORDER}\` }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 60 }}>
          <h2 style={{ fontSize: 40, fontWeight: 800, color: TEXT, marginBottom: 12 }}>Simple pricing</h2>
          <p style={{ fontSize: 18, color: MUTED }}>Start free. Upgrade when you need more.</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 20, alignItems: 'start' }}>
          {PRICING.map((plan, i) => (
            <div key={i} style={{
              padding: 32, borderRadius: 20,
              border: plan.highlight ? \`2px solid \${PRIMARY}\` : \`1px solid \${BORDER}\`,
              background: plan.highlight ? PRIMARY + '11' : CARD_BG,
              position: 'relative',
            }}>
              {plan.highlight && (
                <div style={{
                  position: 'absolute', top: -14, left: '50%', transform: 'translateX(-50%)',
                  background: PRIMARY, color: '#fff', fontSize: 11, fontWeight: 700,
                  padding: '3px 14px', borderRadius: 999,
                }}>
                  MOST POPULAR
                </div>
              )}
              <div style={{ marginBottom: 24 }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: TEXT, marginBottom: 8 }}>{plan.name}</div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                  <span style={{ fontSize: 40, fontWeight: 800, color: TEXT }}>{plan.price}</span>
                  <span style={{ fontSize: 14, color: MUTED }}>{plan.period}</span>
                </div>
              </div>
              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 28px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                {plan.features.map((f, j) => (
                  <li key={j} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, color: MUTED }}>
                    <span style={{ color: PRIMARY, fontWeight: 700 }}>✓</span> {f}
                  </li>
                ))}
              </ul>
              <a href="#" style={{
                display: 'block', textAlign: 'center', padding: '12px 0', borderRadius: 10,
                fontWeight: 600, fontSize: 15, textDecoration: 'none',
                background: plan.highlight ? PRIMARY : 'transparent',
                color: plan.highlight ? '#fff' : PRIMARY,
                border: plan.highlight ? 'none' : \`2px solid \${PRIMARY}\`,
              }}>
                {plan.cta}
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── CTA ─────────────────────────────────────────────────────
function CTA() {
  return (
    <section id="cta" style={{ padding: '96px 24px', borderTop: \`1px solid \${BORDER}\`, textAlign: 'center' }}>
      <div style={{ maxWidth: 640, margin: '0 auto' }}>
        <h2 style={{ fontSize: 44, fontWeight: 800, color: TEXT, marginBottom: 16 }}>
          Ready to get started?
        </h2>
        <p style={{ fontSize: 18, color: MUTED, marginBottom: 36 }}>
          Join thousands of teams using {TITLE}. Free to start, no credit card required.
        </p>
        <a href="#" style={{
          display: 'inline-block', padding: '16px 40px', borderRadius: 14,
          fontWeight: 700, fontSize: 18, background: PRIMARY, color: '#fff',
          textDecoration: 'none', boxShadow: \`0 0 60px \${PRIMARY}44\`,
        }}>
          Start for free →
        </a>
      </div>
    </section>
  );
}

// ─── Footer ──────────────────────────────────────────────────
function Footer() {
  return (
    <footer style={{ borderTop: \`1px solid \${BORDER}\`, padding: '32px 24px' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <span style={{ fontWeight: 800, fontSize: 15, color: TEXT }}>{TITLE}</span>
        <p style={{ fontSize: 12, color: MUTED }}>
          © {new Date().getFullYear()} {TITLE}. Built with local-ai-builder.
        </p>
      </div>
    </footer>
  );
}
`
}

// ═══════════════════════════════════════════════════════════════
// APP GENERATOR
// ═══════════════════════════════════════════════════════════════

function generateApp(spec: AppSpec): GeneratedFile[] {
  return [
    { path: 'app/layout.tsx',  content: buildLayout(spec.title) },
    { path: 'app/globals.css', content: buildGlobalsCss() },
    { path: 'app/page.tsx',    content: buildAppPage(spec) },
  ]
}

function buildAppPage(spec: AppSpec): string {
  const { title, primaryColor, views, layout, widgets } = spec

  const hasChart = widgets.includes('chart')
  const hasTable = widgets.includes('table')

  const viewsJson = JSON.stringify(views)

  // suppress unused variable warning
  void layout

  return `'use client';
import { useState } from 'react';

const TITLE   = "${jsStr(title)}";
const PRIMARY = "${primaryColor}";
const VIEWS   = ${viewsJson} as const;

const STATS = [
  { label: 'Total Users',    value: '12,430', delta: '+8.2%',  up: true  },
  { label: 'Revenue',        value: '$48,290', delta: '+12.1%', up: true  },
  { label: 'Active Sessions',value: '1,847',   delta: '-2.4%',  up: false },
  { label: 'Conversion',     value: '3.24%',   delta: '+0.6%',  up: true  },
] as const;

const TABLE_DATA = [
  { id: 1, name: 'Alice Johnson',  status: 'Active',   value: '$2,400', date: '2024-03-15' },
  { id: 2, name: 'Bob Martinez',   status: 'Inactive', value: '$1,800', date: '2024-03-14' },
  { id: 3, name: 'Carol Williams', status: 'Active',   value: '$3,200', date: '2024-03-13' },
  { id: 4, name: 'David Brown',    status: 'Pending',  value: '$980',   date: '2024-03-12' },
  { id: 5, name: 'Eva Davis',      status: 'Active',   value: '$5,100', date: '2024-03-11' },
] as const;

const CHART_DATA = [42, 58, 45, 70, 55, 80, 65, 90, 72, 85, 78, 95];
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

export default function Page() {
  const [activeView, setActiveView] = useState(VIEWS[0] ?? 'Dashboard');

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#0f0f0f', color: '#f1f5f9', fontFamily: "'Inter', system-ui, sans-serif", overflow: 'hidden' }}>
      {/* Sidebar */}
      <aside style={{ width: 220, flexShrink: 0, borderRight: '1px solid rgba(255,255,255,0.06)', background: '#0a0a0a', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '20px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: PRIMARY, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>✦</div>
            <span style={{ fontWeight: 700, fontSize: 14, color: '#f1f5f9' }}>{TITLE}</span>
          </div>
        </div>
        <nav style={{ flex: 1, padding: '12px 8px', display: 'flex', flexDirection: 'column', gap: 2 }}>
          {VIEWS.map(view => (
            <button key={view} onClick={() => setActiveView(view)} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '8px 12px', borderRadius: 8, border: 'none', cursor: 'pointer',
              textAlign: 'left', fontSize: 13, fontWeight: activeView === view ? 600 : 400,
              background: activeView === view ? PRIMARY + '22' : 'transparent',
              color: activeView === view ? PRIMARY : '#94a3b8',
              transition: 'all 0.15s',
            }}>
              <span>{VIEW_ICON[view] ?? '○'}</span>
              {view}
            </button>
          ))}
        </nav>
        <div style={{ padding: '12px 8px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px' }}>
            <div style={{ width: 28, height: 28, borderRadius: '50%', background: PRIMARY + '33', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: PRIMARY }}>U</div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#f1f5f9' }}>User</div>
              <div style={{ fontSize: 11, color: '#475569' }}>user@example.com</div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main style={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column' }}>
        {/* Top bar */}
        <div style={{ padding: '16px 28px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 700, color: '#f1f5f9', margin: 0 }}>{activeView}</h1>
            <p style={{ fontSize: 12, color: '#475569', margin: '2px 0 0' }}>Welcome back! Here\\'s what\\'s happening.</p>
          </div>
          <button style={{
            padding: '8px 18px', borderRadius: 8, border: 'none', cursor: 'pointer',
            background: PRIMARY, color: '#fff', fontSize: 13, fontWeight: 600,
          }}>
            + New
          </button>
        </div>

        {/* Content */}
        <div style={{ flex: 1, padding: 28, overflow: 'auto' }}>
          {/* Stats cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
            {STATS.map((s, i) => (
              <div key={i} style={{ padding: 20, borderRadius: 14, border: '1px solid rgba(255,255,255,0.06)', background: '#111111' }}>
                <div style={{ fontSize: 12, color: '#475569', marginBottom: 8 }}>{s.label}</div>
                <div style={{ fontSize: 26, fontWeight: 800, color: '#f1f5f9', marginBottom: 6 }}>{s.value}</div>
                <div style={{ fontSize: 12, color: s.up ? '#22c55e' : '#ef4444', fontWeight: 600 }}>{s.delta} vs last month</div>
              </div>
            ))}
          </div>

          {/* Chart */}
          ${hasChart ? `
          <div style={{ padding: 24, borderRadius: 14, border: '1px solid rgba(255,255,255,0.06)', background: '#111111', marginBottom: 24 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#f1f5f9', marginBottom: 20 }}>Revenue Overview</div>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 140 }}>
              {CHART_DATA.map((v, i) => (
                <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                  <div style={{
                    width: '100%', borderRadius: 4,
                    background: i === CHART_DATA.length - 1 ? PRIMARY : PRIMARY + '55',
                    height: v + '%',
                    transition: 'height 0.3s',
                  }} />
                  <span style={{ fontSize: 10, color: '#475569' }}>{MONTHS[i]}</span>
                </div>
              ))}
            </div>
          </div>` : ''}

          {/* Table */}
          ${hasTable ? `
          <div style={{ borderRadius: 14, border: '1px solid rgba(255,255,255,0.06)', background: '#111111', overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', fontSize: 15, fontWeight: 700, color: '#f1f5f9' }}>Recent Activity</div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                  {['Name', 'Status', 'Value', 'Date'].map(h => (
                    <th key={h} style={{ padding: '10px 20px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {TABLE_DATA.map(row => (
                  <tr key={row.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <td style={{ padding: '12px 20px', fontSize: 14, color: '#f1f5f9', fontWeight: 500 }}>{row.name}</td>
                    <td style={{ padding: '12px 20px' }}>
                      <span style={{
                        padding: '2px 10px', borderRadius: 999, fontSize: 11, fontWeight: 600,
                        background: row.status === 'Active' ? '#22c55e22' : row.status === 'Pending' ? '#f59e0b22' : '#ef444422',
                        color:      row.status === 'Active' ? '#22c55e'   : row.status === 'Pending' ? '#f59e0b'   : '#ef4444',
                      }}>{row.status}</span>
                    </td>
                    <td style={{ padding: '12px 20px', fontSize: 14, color: '#94a3b8' }}>{row.value}</td>
                    <td style={{ padding: '12px 20px', fontSize: 14, color: '#475569' }}>{row.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>` : ''}
        </div>
      </main>
    </div>
  );
}

const VIEW_ICON: Record<string, string> = {
  Dashboard: '◻', Analytics: '📊', Users: '👥', Settings: '⚙',
  Products: '📦', Orders: '🛒', Billing: '💳', Reports: '📋',
  Tasks: '✓', Messages: '✉', Calendar: '📅', Finance: '💰',
  Inventory: '🗃',
};
`
}
