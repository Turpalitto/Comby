/**
 * normaliseIdeaToSpec — main entry point for Spec Layer.
 * Parses raw idea text + detected type → strict ProjectSpec.
 */

import type { ProjectType, UserIdea, ProjectSpec } from './types';
import { buildWebsiteSpec } from '@/modes/website/spec';
import { buildAppSpec }     from '@/modes/app/spec';
import { buildGameSpec }    from '@/modes/game/spec';

export function normaliseIdeaToSpec(idea: UserIdea, type: ProjectType): ProjectSpec {
  switch (type) {
    case 'website': return buildWebsiteSpec(parseWebsite(idea.raw));
    case 'app':     return buildAppSpec(parseApp(idea.raw));
    case 'game':    return buildGameSpec(parseGame(idea.raw));
  }
}

// ─── Shared parsers ───────────────────────────────────────────

export function extractTitle(text: string): string {
  let t = text.split(/[.,!?\n]/)[0].trim();

  // Remove leading action verbs (Russian)
  t = t.replace(/^(создай|сделай|сгенерируй|напиши|нарисуй|построй|разработай|придумай)\s+/i, '');
  // Remove leading action verbs (English)
  t = t.replace(/^(create|make|build|generate|design|develop|write|give me a?|show me a?)\s+/i, '');
  // Remove project type words if they appear at the start
  t = t.replace(/^(сайт|веб.сайт|веб-сайт|лендинг|website|web\s*site|landing\s*page|app|application|game)\s+/i, '');
  // Remove leading Russian prepositions/articles left after stripping
  t = t.replace(/^(с|со|для|про|о|об|на|по|в|во)\s+/i, '');
  // Remove trailing action verbs (Russian)
  t = t.replace(/\s+(сделай|создай|сгенерируй|напиши|построй|разработай)$/i, '');
  // Remove trailing filler (English)
  t = t.replace(/\s+(please|now|asap|quickly)$/i, '');

  t = t.trim();
  if (t.length > 0) t = t.charAt(0).toUpperCase() + t.slice(1);

  return t.slice(0, 60) || 'My Project';
}

export function generateDescription(title: string, type: string, features: string[]): string {
  if (features.length > 0) {
    return `${title} — ${features.slice(0, 2).join(', ')}.`;
  }
  const defaults: Record<string, string> = {
    website: `${title} — modern, fast, and built for results.`,
    app:     `Manage everything in one place with ${title}.`,
    game:    `Play ${title} — challenge yourself and beat your score.`,
  };
  return defaults[type] ?? `${title} — built with local-ai-builder.`;
}

export function extractColor(text: string): string {
  const low = text.toLowerCase();

  // Explicit colour names (English \b + Russian without \b)
  if (/\b(red|crimson|rose)\b|красн|алый|пурпурный/.test(low))            return '#ef4444';
  if (/\b(orange|amber|warm)\b|оранжев|янтарн/.test(low))                 return '#f97316';
  if (/\b(yellow|gold)\b|жёлт|золот/.test(low))                           return '#eab308';
  if (/\b(green|emerald|nature|eco)\b|зелён|изумрудн/.test(low))          return '#22c55e';
  if (/\b(teal|cyan|aqua)\b|бирюзов|голубой/.test(low))                   return '#14b8a6';
  if (/\b(blue|azure|sky)\b|синий|лазурн|небесн/.test(low))               return '#3b82f6';
  if (/\b(indigo|violet|purple)\b|индиго|фиолетов/.test(low))             return '#6366f1';
  if (/\b(pink|magenta|fuchsia)\b|розов|малинов/.test(low))               return '#ec4899';

  // Domain-based colour heuristics (English + Russian)
  if (/\b(finance|bank|invest|money|budget)\b|финанс|банк|инвестиц|деньг|бюджет/.test(low))      return '#3b82f6';
  if (/\b(health|medical|wellness|fitness)\b|здоровь|медицин|фитнес|велнес/.test(low))            return '#22c55e';
  if (/\b(food|restaurant|recipe|cook)\b|еда|ресторан|рецепт|кулинар/.test(low))                  return '#f97316';
  if (/\b(travel|adventure|explore)\b|путешеств|приключен|туризм/.test(low))                       return '#14b8a6';
  if (/\b(fashion|style|beauty|luxury)\b|мода|стиль|красота|люкс/.test(low))                       return '#ec4899';
  if (/\b(tech|developer|code|software|saas)\b|технолог|разработчик|программ/.test(low))           return '#6366f1';
  if (/\b(creative|design|art|studio|agency)\b|творческ|дизайн|искусств|агентств/.test(low))       return '#8b5cf6';
  if (/\b(dark|black|night|neon|retro|cyber)\b|тёмн|чёрн|ночн|неон|ретро/.test(low))              return '#a855f7';
  if (/\b(minimal|clean|simple|white)\b|минимал|простой|чистый|белый/.test(low))                   return '#64748b';

  return '#6366f1'; // default indigo
}

export function extractFeatures(text: string): string[] {
  // Pull out "with X", "including X", "that has X" phrases (English + Russian)
  const patterns = [
    /(?:with|including|featuring|has|have|support[s]?|offers?)\s+([^,.!?]+)/gi,
    /(?:ability to|can|allows?)\s+([^,.!?]+)/gi,
    /(?:с|включая|содержит|имеет|поддерживает|предлагает)\s+([^,.!?]+)/gi,
    /(?:позволяет|можно|умеет)\s+([^,.!?]+)/gi,
  ];

  const found = new Set<string>();
  for (const re of patterns) {
    let m: RegExpExecArray | null;
    while ((m = re.exec(text)) !== null) {
      const phrase = m[1].trim().slice(0, 60);
      if (phrase.split(' ').length <= 8) found.add(phrase);
    }
  }

  return [...found].slice(0, 6);
}

// ─── Website parser ───────────────────────────────────────────

import type { WebsiteSpec } from './types';

function parseWebsite(text: string): Partial<WebsiteSpec> {
  const low = text.toLowerCase();

  // Sections (English + Russian, no \b around Cyrillic)
  const sections: WebsiteSpec['sections'] = ['hero'];
  if (/\bfeatures?|benefits?|\boffer|\bcapabilit|функци|возможност|преимуществ|услуг/.test(low))     sections.push('features');
  if (/\btestimonials?|\breviews?|\bclient|\bcustomer|отзыв|клиент|покупател/.test(low))              sections.push('testimonials');
  if (/\bpric|\bplan|\btier|\bsubscri|\bcost|\bfree\b|цен|тариф|план|стоимост|подписк/.test(low))    sections.push('pricing');
  sections.push('cta', 'footer');

  // Tone (English \b + Russian without \b)
  let tone: WebsiteSpec['tone'] = 'professional';
  if (/\b(playful|fun|quirky|cute|kid|game)\b|игривый|весёлый|яркий/.test(low))            tone = 'playful';
  else if (/\b(minimal|clean|simple|elegance)\b|минималист|чистый|простой/.test(low))      tone = 'minimal';
  else if (/\b(casual|friendly|relax|chill)\b|дружелюбный|расслаблен|неформальн/.test(low)) tone = 'casual';

  const title    = extractTitle(text);
  const features = extractFeatures(text);
  return {
    title,
    description:  generateDescription(title, 'website', features),
    primaryColor: extractColor(text),
    features,
    sections,
    tone,
  };
}

// ─── App parser ───────────────────────────────────────────────

import type { AppSpec } from './types';

function parseApp(text: string): Partial<AppSpec> {
  const low = text.toLowerCase();

  // Layout (English \b + Russian without \b)
  let layout: AppSpec['layout'] = 'sidebar';
  if (/\b(topbar|header.nav|nav.bar)\b|верхняя\s*панель|шапка\s*навигация/.test(low)) layout = 'topbar';
  if (/\b(both|sidebar.*topbar|topbar.*sidebar)\b|оба|боковая.*верхняя|верхняя.*боковая/.test(low)) layout = 'both';

  // Views — mine keyword patterns (English + Russian, no \b around Cyrillic)
  const viewMap: [RegExp, string][] = [
    [/\b(dashboard)\b|дашборд|панель\s*управления/i,           'Dashboard'],
    [/\b(analytic|chart|graph|stat)\b|аналитик|статистик|график/i, 'Analytics'],
    [/\b(user|member|people)\b|пользовател|участник/i,         'Users'],
    [/\b(setting|config|prefer)\b|настройк|конфигурац/i,       'Settings'],
    [/\b(product|item|catalog)\b|продукт|товар|каталог/i,      'Products'],
    [/\b(order|purchase|transact)\b|заказ|покупк|транзакц/i,   'Orders'],
    [/\b(invoice|billing|payment)\b|счёт|выставлен|платёж/i,   'Billing'],
    [/\b(report|export)\b|отчёт|экспорт/i,                     'Reports'],
    [/\b(task|todo|kanban|board)\b|задач|список\s*дел|канбан/i, 'Tasks'],
    [/\b(message|chat|inbox)\b|сообщен|чат|входящ/i,           'Messages'],
    [/\b(calendar|schedule|event)\b|календар|расписан|событ/i, 'Calendar'],
    [/\b(finance|budget|expense)\b|финанс|бюджет|расход/i,     'Finance'],
    [/\b(inventor|stock|warehouse)\b|инвентар|склад|запас/i,   'Inventory'],
  ];

  const views = viewMap
    .filter(([re]) => re.test(low))
    .map(([, v]) => v);

  // Always have Dashboard + Settings
  if (!views.includes('Dashboard')) views.unshift('Dashboard');
  if (!views.includes('Settings'))  views.push('Settings');

  // Widgets (English \b + Russian without \b)
  const widgets: AppSpec['widgets'] = ['cards'];
  if (/\b(table|list|row|record|grid)\b|таблица|список|строка|запись|сетка/.test(low))    widgets.push('table');
  if (/\b(chart|graph|plot|analytic|metric)\b|график|диаграмм|аналитик|метрик/.test(low)) widgets.push('chart');
  if (/\b(list|feed|timeline|log)\b|лента|хронолог|журнал/.test(low))                    widgets.push('list');

  const title    = extractTitle(text);
  const features = extractFeatures(text);
  return {
    title,
    description:  generateDescription(title, 'app', features),
    primaryColor: extractColor(text),
    features,
    layout,
    views:        views.slice(0, 6),
    widgets,
  };
}

// ─── Game parser ──────────────────────────────────────────────

import type { GameSpec } from './types';

function parseGame(text: string): Partial<GameSpec> {
  const low = text.toLowerCase();

  // Genre (English \b + Russian without \b)
  let genre: GameSpec['genre'] = 'arcade';
  if (/\b(platform|jump.*platform|side.?scrol)\b|платформер|платформенн/.test(low)) genre = 'platformer';
  else if (/\b(shoot|bullet|shmup|space.?ship|invader)\b|шутер|стрелялк/.test(low)) genre = 'shooter';
  else if (/\b(puzzle|match|tile|sliding|block)\b|головоломк|пазл/.test(low))       genre = 'puzzle';
  else if (/\b(endless.?run|runner|dash|sprint)\b|раннер|бесконечн.*бег/.test(low)) genre = 'runner';
  else if (/\b(arcade|dodge|avoid|surviv)\b|аркад|уклонен/.test(low))               genre = 'arcade';

  // Player movement (English \b + Russian without \b)
  let movement: GameSpec['player']['movement'] = 'keyboard';
  if (/\b(mouse|click|cursor|point)\b|мышь|клик|курсор/.test(low))  movement = 'mouse';
  if (/\b(touch|swipe|mobile|tap)\b|касан|свайп|мобильн/.test(low)) movement = 'touch';

  // Difficulty (English \b + Russian without \b)
  let difficulty: GameSpec['difficulty'] = 'medium';
  if (/\b(easy|simple|casual|beginner|relax)\b|лёгк|простой|казуальн|начинающ/.test(low)) difficulty = 'easy';
  if (/\b(hard|difficult|challeng|brutal|expert)\b|сложн|трудн|эксперт/.test(low))        difficulty = 'hard';

  // Mechanics (English \b + Russian without \b)
  const mechanicMap: [RegExp, string][] = [
    [/\bjump\b|прыжок|прыгать/i,          'jump'],
    [/\b(shoot|bullet)\b|стрельба|стрелять/i,'shoot'],
    [/\b(dodge|avoid)\b|уклонен|избегать/i,'dodge'],
    [/\b(collect|coin)\b|собирать|монет/i, 'collect'],
    [/\bscore\b|очки|счёт/i,              'score'],
    [/\b(level|stage)\b|уровень|уровни/i, 'levels'],
    [/\b(enemy|enemies)\b|враг|враги/i,   'enemies'],
    [/\bpower.?up\b|усиление|бонус/i,     'power-ups'],
    [/\bboss\b|босс/i,                    'boss fight'],
    [/\bplatform\b|платформ/i,            'platforms'],
  ];
  const mechanics = mechanicMap
    .filter(([re]) => re.test(low))
    .map(([, m]) => m);

  if (mechanics.length === 0) mechanics.push('move', 'score');

  const title    = extractTitle(text);
  const features = extractFeatures(text);
  return {
    title,
    description:  generateDescription(title, 'game', features),
    primaryColor: extractColor(text),
    features,
    genre,
    player:       { movement, sprite: 'square' },
    mechanics,
    difficulty,
  };
}
