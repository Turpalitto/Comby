import type { AppSpec } from '@/core/types';

export function buildAppHTML(spec: AppSpec): string {
  const { title, primaryColor, views, widgets } = spec;

  const navItems = views.length > 0 ? views : ['Dashboard', 'Analytics', 'Users', 'Settings'];
  const hasWidget = (w: string) => widgets.includes(w as typeof widgets[number]);

  return /* html */`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escHtml(title)}</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
  <script src="https://cdn.tailwindcss.com"></script>
  <script>
    tailwind.config = {
      theme: { extend: { fontFamily: { sans: ['Inter', 'system-ui', 'sans-serif'] } } }
    }
  </script>
  <style>
    :root { --brand: ${primaryColor}; }
    body { margin: 0; }
    .sidebar-link.active { background: ${primaryColor}18; color: ${primaryColor}; }
    .sidebar-link:not(.active):hover { background: #ffffff0a; }
    .stat-change.up   { color: #34d399; }
    .stat-change.down { color: #f87171; }
  </style>
</head>
<body class="bg-neutral-950 text-neutral-100 font-sans antialiased flex h-screen overflow-hidden">

  <!-- ── SIDEBAR ──────────────────────────────────────────── -->
  <aside class="w-56 flex-shrink-0 flex flex-col border-r border-neutral-800 bg-neutral-950">
    <!-- Logo -->
    <div class="h-14 flex items-center px-5 border-b border-neutral-800">
      <div class="w-7 h-7 rounded-lg flex items-center justify-center text-white text-sm font-bold mr-2"
           style="background:${primaryColor}">
        ${escHtml(title.charAt(0))}
      </div>
      <span class="font-semibold text-sm text-white">${escHtml(title)}</span>
    </div>

    <!-- Nav -->
    <nav class="flex-1 py-4 px-3 space-y-0.5 overflow-y-auto">
      <p class="px-3 py-1 text-xs font-medium uppercase tracking-widest text-neutral-600 mb-2">
        Menu
      </p>
      ${navItems.map((item, i) => `
      <a href="#" onclick="switchView('${escHtml(item)}'); return false;"
         id="nav-${escHtml(item)}"
         class="sidebar-link flex items-center gap-3 px-3 py-2 rounded-lg text-sm
                cursor-pointer transition-all ${i === 0 ? 'active' : 'text-neutral-400'}">
        <span>${navIcon(item)}</span>
        ${escHtml(item)}
      </a>`).join('')}
    </nav>

    <!-- User -->
    <div class="border-t border-neutral-800 p-3">
      <div class="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-white/5 cursor-pointer">
        <div class="w-7 h-7 rounded-full bg-neutral-700 flex items-center justify-center text-xs font-bold">
          U
        </div>
        <div class="flex-1 min-w-0">
          <div class="text-xs font-medium text-white truncate">User</div>
          <div class="text-xs text-neutral-600 truncate">user@example.com</div>
        </div>
      </div>
    </div>
  </aside>

  <!-- ── MAIN ─────────────────────────────────────────────── -->
  <div class="flex-1 flex flex-col overflow-hidden">

    <!-- Topbar -->
    <header class="h-14 flex items-center justify-between px-6 border-b border-neutral-800
                   bg-neutral-950 flex-shrink-0">
      <div id="page-title" class="font-semibold text-white">${escHtml(navItems[0])}</div>
      <div class="flex items-center gap-3">
        <button class="w-8 h-8 rounded-lg bg-neutral-900 border border-neutral-800
                       flex items-center justify-center text-neutral-500 hover:text-white
                       transition text-sm">
          🔔
        </button>
        <div class="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white"
             style="background:${primaryColor}">
          U
        </div>
      </div>
    </header>

    <!-- Content -->
    <main class="flex-1 overflow-y-auto p-6 bg-neutral-950">

      <!-- Stat cards -->
      ${hasWidget('cards') || true ? statCards(primaryColor) : ''}

      <!-- Chart area -->
      ${hasWidget('chart') ? chartWidget(primaryColor) : ''}

      <!-- Table -->
      ${hasWidget('table') ? tableWidget() : mainContent(primaryColor)}

    </main>
  </div>

  <script>
    const navItems = ${JSON.stringify(navItems)};

    function switchView(name) {
      // Update active state
      navItems.forEach(item => {
        const el = document.getElementById('nav-' + item);
        if (el) {
          el.classList.toggle('active', item === name);
          if (item !== name) el.classList.add('text-neutral-400');
          else el.classList.remove('text-neutral-400');
        }
      });

      // Update title
      document.getElementById('page-title').textContent = name;
    }
  </script>
</body>
</html>`;
}

// ─── Widget builders ──────────────────────────────────────────

function statCards(color: string): string {
  const stats = [
    { label: 'Total Users',    value: '12,847', change: '+12.5%', up: true,  icon: '👥' },
    { label: 'Revenue',        value: '$48,295', change: '+8.1%',  up: true,  icon: '💰' },
    { label: 'Active Sessions',value: '2,340',   change: '-3.2%',  up: false, icon: '⚡' },
    { label: 'Conversion',     value: '3.6%',    change: '+0.4%',  up: true,  icon: '📈' },
  ];

  return `
  <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
    ${stats.map(s => `
    <div class="rounded-xl border border-neutral-800 bg-neutral-900 p-4">
      <div class="flex items-center justify-between mb-3">
        <span class="text-xs text-neutral-500 font-medium">${escHtml(s.label)}</span>
        <span class="text-base">${s.icon}</span>
      </div>
      <div class="text-2xl font-bold text-white mb-1">${escHtml(s.value)}</div>
      <div class="text-xs stat-change ${s.up ? 'up' : 'down'}">${escHtml(s.change)} vs last month</div>
    </div>`).join('')}
  </div>`;
}

function chartWidget(color: string): string {
  // SVG sparkline bars
  const bars = [40, 65, 45, 80, 55, 90, 70, 85, 60, 95, 75, 88];
  const maxH = 80;
  const barW = 20;

  const svgBars = bars.map((val, i) => {
    const h = (val / 100) * maxH;
    const y = maxH - h + 10;
    return `<rect x="${i * (barW + 4)}" y="${y}" width="${barW}" height="${h}"
              rx="4" fill="${color}" opacity="${0.4 + (i / bars.length) * 0.6}" />`;
  }).join('');

  return `
  <div class="rounded-xl border border-neutral-800 bg-neutral-900 p-5 mb-6">
    <div class="flex items-center justify-between mb-4">
      <div>
        <div class="font-semibold text-white">Revenue overview</div>
        <div class="text-xs text-neutral-500">Last 12 months</div>
      </div>
      <span class="text-xs px-2 py-1 rounded-full border border-neutral-700 text-neutral-400">Monthly</span>
    </div>
    <svg viewBox="0 0 ${bars.length * (barW + 4)} 100" class="w-full h-32 overflow-visible">
      ${svgBars}
    </svg>
  </div>`;
}

function tableWidget(): string {
  const rows = [
    { name: 'Alice Johnson', email: 'alice@example.com', status: 'Active',   amount: '$240' },
    { name: 'Bob Martinez',  email: 'bob@example.com',   status: 'Pending',  amount: '$180' },
    { name: 'Carol White',   email: 'carol@example.com', status: 'Active',   amount: '$520' },
    { name: 'David Lee',     email: 'david@example.com', status: 'Inactive', amount: '$90'  },
    { name: 'Eva Green',     email: 'eva@example.com',   status: 'Active',   amount: '$310' },
  ];

  const statusColor: Record<string, string> = {
    Active:   'bg-emerald-500/15 text-emerald-400',
    Pending:  'bg-amber-500/15 text-amber-400',
    Inactive: 'bg-neutral-700 text-neutral-400',
  };

  return `
  <div class="rounded-xl border border-neutral-800 bg-neutral-900 overflow-hidden">
    <div class="flex items-center justify-between px-5 py-4 border-b border-neutral-800">
      <div class="font-semibold text-white">Recent users</div>
      <button class="text-xs px-3 py-1.5 rounded-lg border border-neutral-700 text-neutral-400
                     hover:border-neutral-500 hover:text-neutral-200 transition">Export</button>
    </div>
    <table class="w-full text-sm">
      <thead>
        <tr class="border-b border-neutral-800 text-xs text-neutral-500">
          <th class="px-5 py-3 text-left font-medium">Name</th>
          <th class="px-5 py-3 text-left font-medium">Email</th>
          <th class="px-5 py-3 text-left font-medium">Status</th>
          <th class="px-5 py-3 text-right font-medium">Amount</th>
        </tr>
      </thead>
      <tbody>
        ${rows.map(r => `
        <tr class="border-b border-neutral-800/60 hover:bg-white/[0.02] transition">
          <td class="px-5 py-3 font-medium text-white">${escHtml(r.name)}</td>
          <td class="px-5 py-3 text-neutral-400">${escHtml(r.email)}</td>
          <td class="px-5 py-3">
            <span class="px-2 py-0.5 rounded-full text-xs font-medium ${statusColor[r.status] ?? ''}">
              ${escHtml(r.status)}
            </span>
          </td>
          <td class="px-5 py-3 text-right font-medium text-white">${escHtml(r.amount)}</td>
        </tr>`).join('')}
      </tbody>
    </table>
  </div>`;
}

function mainContent(color: string): string {
  return `
  <div class="rounded-xl border border-neutral-800 bg-neutral-900 p-5">
    <div class="text-sm font-medium text-white mb-4">Quick actions</div>
    <div class="grid grid-cols-2 gap-3">
      ${['New entry', 'Import data', 'Run report', 'Share'].map(label => `
      <button class="py-3 px-4 rounded-lg border border-neutral-800 text-sm text-neutral-400
                     hover:border-neutral-600 hover:text-white transition text-left">
        ${escHtml(label)}
      </button>`).join('')}
    </div>
  </div>`;
}

function navIcon(item: string): string {
  const lower = item.toLowerCase();
  if (lower.includes('dashboard') || lower.includes('home')) return '◻';
  if (lower.includes('analytic') || lower.includes('report')) return '📊';
  if (lower.includes('user') || lower.includes('team'))       return '👥';
  if (lower.includes('setting') || lower.includes('config'))  return '⚙';
  if (lower.includes('product') || lower.includes('item'))    return '📦';
  if (lower.includes('message') || lower.includes('chat'))    return '💬';
  return '◈';
}

function escHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
