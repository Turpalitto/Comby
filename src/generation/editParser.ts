/**
 * EditParser — converts a free-text edit command into structured operations.
 * Rule-based, no AI. Each rule tries to match a user intent.
 */

import type { WebsiteSpec, AppSpec, GameSpec } from '@/core/types';

// ─── Operation types ──────────────────────────────────────────

export type EditOperation =
  // Universal
  | { kind: 'change_color';      color: string }
  // Website
  | { kind: 'add_section';       section: WebsiteSpec['sections'][number] }
  | { kind: 'remove_section';    section: WebsiteSpec['sections'][number] }
  | { kind: 'change_tone';       tone: WebsiteSpec['tone'] }
  // App
  | { kind: 'add_view';          view: string }
  | { kind: 'remove_view';       view: string }
  | { kind: 'add_widget';        widget: AppSpec['widgets'][number] }
  | { kind: 'change_layout';     layout: AppSpec['layout'] }
  // Game
  | { kind: 'change_difficulty'; difficulty: GameSpec['difficulty'] }
  | { kind: 'change_genre';      genre: GameSpec['genre'] }
  | { kind: 'add_mechanic';      mechanic: string }
  // Fallback
  | { kind: 'unknown';           raw: string };

export interface ParseResult {
  ops:     EditOperation[];
  summary: string;   // human-readable description of what will change
}

// ─── Parser ───────────────────────────────────────────────────

export function parseEditCommand(text: string): ParseResult {
  const low = text.toLowerCase().trim();
  const ops: EditOperation[] = [];

  // ── Color ───────────────────────────────────────────────────
  const colorOp = parseColor(low);
  if (colorOp) ops.push(colorOp);

  // ── Website sections ────────────────────────────────────────
  const sectionOps = parseSections(low);
  ops.push(...sectionOps);

  // ── Tone ────────────────────────────────────────────────────
  const toneOp = parseTone(low);
  if (toneOp) ops.push(toneOp);

  // ── App views ───────────────────────────────────────────────
  const viewOps = parseViews(low);
  ops.push(...viewOps);

  // ── App widgets ─────────────────────────────────────────────
  const widgetOp = parseWidget(low);
  if (widgetOp) ops.push(widgetOp);

  // ── App layout ──────────────────────────────────────────────
  const layoutOp = parseLayout(low);
  if (layoutOp) ops.push(layoutOp);

  // ── Game difficulty ─────────────────────────────────────────
  const diffOp = parseDifficulty(low);
  if (diffOp) ops.push(diffOp);

  // ── Game genre ──────────────────────────────────────────────
  const genreOp = parseGenre(low);
  if (genreOp) ops.push(genreOp);

  // ── Game mechanics ──────────────────────────────────────────
  const mechOps = parseMechanics(low);
  ops.push(...mechOps);

  // ── Fallback ────────────────────────────────────────────────
  if (ops.length === 0) {
    ops.push({ kind: 'unknown', raw: text });
  }

  return { ops, summary: describOps(ops) };
}

// ─── Sub-parsers ──────────────────────────────────────────────

const COLOR_NAMES: [RegExp, string][] = [
  [/\b(red|crimson|rose)\b|красн|алый|пурпурный/,          '#ef4444'],
  [/\b(orange|amber)\b|оранжев|янтарн/,                    '#f97316'],
  [/\b(yellow|gold)\b|жёлт|золот/,                         '#eab308'],
  [/\b(green|emerald|lime)\b|зелён|изумрудн/,              '#22c55e'],
  [/\b(teal|cyan|aqua)\b|бирюзов|голубой/,                 '#14b8a6'],
  [/\b(blue|azure|sky)\b|синий|лазурн|небесн/,             '#3b82f6'],
  [/\b(indigo|violet)\b|индиго|фиолетов/,                  '#6366f1'],
  [/\b(purple)\b|пурпурн|лиловый/,                         '#a855f7'],
  [/\b(pink|fuchsia|magenta)\b|розов|малинов/,             '#ec4899'],
  [/\b(white|light|bright)\b|белый|светлый/,               '#f8fafc'],
  [/\b(black|dark|darker|night)\b|чёрн|тёмн|ночн/,        '#1e1b4b'],
  [/\b(slate|gray|grey|neutral)\b|серый|нейтральн/,        '#64748b'],
];

function parseColor(low: string): EditOperation | null {
  // Explicit hex  #abc123
  const hexMatch = low.match(/#([0-9a-f]{6}|[0-9a-f]{3})\b/i);
  if (hexMatch) return { kind: 'change_color', color: hexMatch[0].toLowerCase() };

  // Named color in a color-change context (English + Russian)
  const isColorIntent = /\b(make|use|change|set|switch|go)\b.*\b(color|theme|accent|tone)\b|\b(color|theme|accent)\b.*\b(to|into|as)\b|\bdarker\b|\blighter\b|\bbrighter\b/.test(low)
    || /\b(make it|turn it)\b/.test(low)
    || /(сделай|измени|поменяй|используй|установи).*(цвет|тема|акцент)|(цвет|тема|акцент).*(на|в)|темнее|светлее|ярче/.test(low)
    || /(сделай|сделать)\s+(его|её|это)/.test(low);

  for (const [re, hex] of COLOR_NAMES) {
    if (re.test(low)) {
      // Only emit if there's clear color intent OR a strong color word
      if (isColorIntent || /\b(red|blue|green|purple|pink|teal|indigo|orange)\b|красн|синий|зелён|фиолетов|розов|бирюзов|индиго|оранжев/.test(low)) {
        return { kind: 'change_color', color: hex };
      }
    }
  }

  return null;
}

const SECTIONS: WebsiteSpec['sections'][number][] = [
  'hero', 'features', 'testimonials', 'pricing', 'cta', 'footer',
];

const SECTION_ALIASES: Record<string, WebsiteSpec['sections'][number]> = {
  'review':      'testimonials',
  'reviews':     'testimonials',
  'testimonial': 'testimonials',
  'price':       'pricing',
  'plans':       'pricing',
  'plan':        'pricing',
  'call to action': 'cta',
  'feature':     'features',
  'banner':      'hero',
  // Russian aliases
  'отзыв':       'testimonials',
  'отзывы':      'testimonials',
  'клиенты':     'testimonials',
  'цены':        'pricing',
  'тарифы':      'pricing',
  'тариф':       'pricing',
  'план':        'pricing',
  'планы':       'pricing',
  'стоимость':   'pricing',
  'функции':     'features',
  'возможности': 'features',
  'услуги':      'features',
  'преимущества':'features',
  'баннер':      'hero',
  'шапка':       'hero',
  'подвал':      'footer',
  'футер':       'footer',
};

function parseSections(low: string): EditOperation[] {
  const ops: EditOperation[] = [];
  const isAdd    = /\b(add|include|show|enable|insert|put)\b|добавь|добавить|включи|включить|покажи|показать/.test(low);
  const isRemove = /\b(remove|delete|hide|disable|take out|get rid of)\b|удали|удалить|убери|убрать|скрой|скрыть|отключи|отключить/.test(low);

  if (!isAdd && !isRemove) return ops;

  for (const sec of SECTIONS) {
    if (low.includes(sec)) {
      ops.push({ kind: isAdd ? 'add_section' : 'remove_section', section: sec });
    }
  }
  for (const [alias, sec] of Object.entries(SECTION_ALIASES)) {
    if (low.includes(alias)) {
      const kind = isAdd ? 'add_section' : 'remove_section';
      if (!ops.some(o => o.kind === kind && (o as any).section === sec)) {
        ops.push({ kind, section: sec });
      }
    }
  }

  return ops;
}

function parseTone(low: string): EditOperation | null {
  if (/\b(professional|corporate|formal|serious)\b|профессиональный|деловой|формальный|серьёзный/.test(low))  return { kind: 'change_tone', tone: 'professional' };
  if (/\b(minimal|minimalist|clean|simple)\b|минималист|минимальный|чистый|простой/.test(low))               return { kind: 'change_tone', tone: 'minimal' };
  if (/\b(playful|fun|quirky|bold|energetic)\b|игривый|весёлый|яркий|энергичный/.test(low))                  return { kind: 'change_tone', tone: 'playful' };
  if (/\b(casual|friendly|relaxed|chill|warm)\b|дружелюбный|расслаблен|неформальн|тёплый/.test(low))         return { kind: 'change_tone', tone: 'casual' };
  return null;
}

const VIEW_KEYWORDS: [RegExp, string][] = [
  [/\b(dashboard|home)\b|дашборд|панель\s*управления/,           'Dashboard'],
  [/\b(analytics?|stats?|metrics)\b|аналитик|статистик|метрик/,  'Analytics'],
  [/\b(user|users|members?|people)\b|пользовател|участник/,       'Users'],
  [/\b(settings?|config|preferences?)\b|настройк|конфигурац/,     'Settings'],
  [/\b(products?|items?|catalog)\b|продукт|товар|каталог/,        'Products'],
  [/\b(orders?|purchases?|transactions?)\b|заказ|покупк|транзакц/, 'Orders'],
  [/\b(invoices?|billing|payments?)\b|счёт|выставлен|платёж/,     'Billing'],
  [/\b(reports?|exports?)\b|отчёт|экспорт/,                       'Reports'],
  [/\b(tasks?|todos?|kanban|board)\b|задач|список\s*дел|канбан/,   'Tasks'],
  [/\b(messages?|chat|inbox)\b|сообщен|чат|входящ/,               'Messages'],
  [/\b(calendar|schedule|events?)\b|календар|расписан|событ/,     'Calendar'],
  [/\b(finance|budget|expenses?)\b|финанс|бюджет|расход/,         'Finance'],
];

function parseViews(low: string): EditOperation[] {
  const ops: EditOperation[] = [];
  const isAdd    = /\b(add|include|show|enable|insert)\b|добавь|добавить|включи|включить|покажи|показать/.test(low);
  const isRemove = /\b(remove|delete|hide|disable)\b|удали|удалить|убери|убрать|скрой|скрыть/.test(low);

  if (!isAdd && !isRemove) return ops;

  for (const [re, view] of VIEW_KEYWORDS) {
    if (re.test(low)) {
      ops.push({ kind: isAdd ? 'add_view' : 'remove_view', view });
    }
  }
  return ops;
}

function parseWidget(low: string): EditOperation | null {
  const addRu = /добавь|добавить|включи|включить|покажи|показать/;
  if (/\b(add|show|include)\b.*\bchart\b|\bchart\b.*\b(add|show)\b/.test(low) || (addRu.test(low) && /\bграфик|\bдиаграмм/.test(low))) return { kind: 'add_widget', widget: 'chart' };
  if (/\b(add|show|include)\b.*\btable\b|\btable\b.*\b(add|show)\b/.test(low) || (addRu.test(low) && /\bтаблиц/.test(low)))           return { kind: 'add_widget', widget: 'table' };
  if (/\b(add|show|include)\b.*\blist\b|\blist\b.*\b(add|show)\b/.test(low)   || (addRu.test(low) && /\bсписок/.test(low)))            return { kind: 'add_widget', widget: 'list' };
  if (/\b(add|show|include)\b.*\bcards?\b|\bcards?\b.*\b(add|show)\b/.test(low)|| (addRu.test(low) && /\bкарточк/.test(low)))          return { kind: 'add_widget', widget: 'cards' };
  return null;
}

function parseLayout(low: string): EditOperation | null {
  if (/\b(sidebar|side\s*bar)\b|боковая\s*панель|боковое\s*меню/.test(low))               return { kind: 'change_layout', layout: 'sidebar' };
  if (/\b(topbar|top\s*bar|header\s*nav)\b|верхняя\s*панель|шапка\s*навигация/.test(low)) return { kind: 'change_layout', layout: 'topbar' };
  if (/\b(both|sidebar.*topbar|topbar.*sidebar)\b|оба|оба\s*меню/.test(low))               return { kind: 'change_layout', layout: 'both' };
  return null;
}

function parseDifficulty(low: string): EditOperation | null {
  if (/\b(easy|easier|simple|simpler|casual|beginner)\b|лёгк|простой|казуальн|начинающ|проще/.test(low))    return { kind: 'change_difficulty', difficulty: 'easy' };
  if (/\b(hard|harder|difficult|challenge|brutal|expert)\b|сложн|труднее|трудный|эксперт|жёстк/.test(low)) return { kind: 'change_difficulty', difficulty: 'hard' };
  if (/\b(medium|normal|default|middle)\b|средн|нормальн|обычн/.test(low))                                  return { kind: 'change_difficulty', difficulty: 'medium' };
  // Speed-based difficulty (English + Russian)
  if (/\bfaster\b|\bspeed up\b|\bincrease\b.*\bspeed\b|\bspeed\b.*\bincrease\b|\benemi.*faster\b|быстрее|ускори|увеличь.*скорост|скорост.*увеличь/.test(low))
    return { kind: 'change_difficulty', difficulty: 'hard' };
  if (/\bslower\b|\bslow down\b|\bdecrease\b.*\bspeed\b|\bspeed\b.*\bdecrease\b|медленнее|замедли|уменьши.*скорост/.test(low))
    return { kind: 'change_difficulty', difficulty: 'easy' };
  return null;
}

function parseGenre(low: string): EditOperation | null {
  if (/\bplatform(er)?|платформер/.test(low))                         return { kind: 'change_genre', genre: 'platformer' };
  if (/\bshooter?\b|\bshoot.?em.?up\b|шутер|стрелялк/.test(low))     return { kind: 'change_genre', genre: 'shooter' };
  if (/\bpuzzle\b|головоломк|пазл/.test(low))                         return { kind: 'change_genre', genre: 'puzzle' };
  if (/\b(endless\s*)?runner\b|раннер|бесконечн.*бег/.test(low))      return { kind: 'change_genre', genre: 'runner' };
  if (/\barcade\b|аркад/.test(low))                                    return { kind: 'change_genre', genre: 'arcade' };
  return null;
}

function parseMechanics(low: string): EditOperation[] {
  const ops: EditOperation[] = [];
  if (!/\b(add|include|enable)\b|добавь|добавить|включи|включить/.test(low)) return ops;

  const MECHS: [RegExp, string][] = [
    [/\bboss\b|босс/,               'boss fight'],
    [/\bpower.?up|усилени|бонус/,   'power-ups'],
    [/\bshield\b|щит/,              'shield'],
    [/\bmultiplier\b|множител/,     'score multiplier'],
    [/\bcheckpoint\b|чекпоинт/,     'checkpoints'],
    [/\b(life|lives?)\b|жизн/,      'extra lives'],
    [/\bcombo\b|комбо/,             'combo system'],
  ];
  for (const [re, mech] of MECHS) {
    if (re.test(low)) ops.push({ kind: 'add_mechanic', mechanic: mech });
  }
  return ops;
}

function describOps(ops: EditOperation[]): string {
  const parts = ops.map(op => {
    switch (op.kind) {
      case 'change_color':      return `color → ${op.color}`;
      case 'add_section':       return `+${op.section}`;
      case 'remove_section':    return `-${op.section}`;
      case 'change_tone':       return `tone → ${op.tone}`;
      case 'add_view':          return `+view:${op.view}`;
      case 'remove_view':       return `-view:${op.view}`;
      case 'add_widget':        return `+widget:${op.widget}`;
      case 'change_layout':     return `layout → ${op.layout}`;
      case 'change_difficulty': return `difficulty → ${op.difficulty}`;
      case 'change_genre':      return `genre → ${op.genre}`;
      case 'add_mechanic':      return `+mechanic:${op.mechanic}`;
      case 'unknown':           return `? "${op.raw}"`;
    }
  });
  return parts.join(', ');
}
