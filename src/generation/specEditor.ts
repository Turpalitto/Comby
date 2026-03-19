/**
 * SpecEditor — applies parsed EditOperations to a ProjectSpec.
 * Returns a new spec (immutable). Never mutates the original.
 */

import type { ProjectSpec, WebsiteSpec, AppSpec, GameSpec } from '@/core/types';
import type { EditOperation } from './editParser';

export function applyEdits(spec: ProjectSpec, ops: EditOperation[]): ProjectSpec {
  let current = structuredClone(spec) as ProjectSpec;

  for (const op of ops) {
    current = applyOne(current, op);
  }

  return current;
}

function applyOne(spec: ProjectSpec, op: EditOperation): ProjectSpec {
  // ── Universal ──────────────────────────────────────────────
  if (op.kind === 'change_color') {
    return { ...spec, primaryColor: op.color };
  }

  // ── Website ────────────────────────────────────────────────
  if (spec.type === 'website') {
    return applyWebsite(spec, op);
  }

  // ── App ───────────────────────────────────────────────────
  if (spec.type === 'app') {
    return applyApp(spec, op);
  }

  // ── Game ──────────────────────────────────────────────────
  if (spec.type === 'game') {
    return applyGame(spec, op);
  }

  return spec;
}

// ─── Website editor ───────────────────────────────────────────

function applyWebsite(spec: WebsiteSpec, op: EditOperation): WebsiteSpec {
  switch (op.kind) {
    case 'add_section': {
      if (spec.sections.includes(op.section)) return spec;
      // Insert before 'cta'/'footer' to keep logical order
      const ordered: WebsiteSpec['sections'] = [
        'hero', 'features', 'testimonials', 'pricing', 'cta', 'footer',
      ];
      const newSections = ordered.filter(
        s => s === op.section || spec.sections.includes(s),
      );
      return { ...spec, sections: newSections };
    }

    case 'remove_section': {
      const keep: WebsiteSpec['sections'][number][] = ['hero', 'cta'];
      if (keep.includes(op.section)) return spec; // can't remove core sections
      return { ...spec, sections: spec.sections.filter(s => s !== op.section) };
    }

    case 'change_tone':
      return { ...spec, tone: op.tone };

    default:
      return spec;
  }
}

// ─── App editor ───────────────────────────────────────────────

function applyApp(spec: AppSpec, op: EditOperation): AppSpec {
  switch (op.kind) {
    case 'add_view': {
      if (spec.views.includes(op.view)) return spec;
      return { ...spec, views: [...spec.views, op.view] };
    }

    case 'remove_view': {
      if (op.view === 'Dashboard') return spec; // always keep
      return { ...spec, views: spec.views.filter(v => v !== op.view) };
    }

    case 'add_widget': {
      if (spec.widgets.includes(op.widget)) return spec;
      return { ...spec, widgets: [...spec.widgets, op.widget] };
    }

    case 'change_layout':
      return { ...spec, layout: op.layout };

    default:
      return spec;
  }
}

// ─── Game editor ──────────────────────────────────────────────

function applyGame(spec: GameSpec, op: EditOperation): GameSpec {
  switch (op.kind) {
    case 'change_difficulty':
      return { ...spec, difficulty: op.difficulty };

    case 'change_genre':
      return { ...spec, genre: op.genre };

    case 'add_mechanic': {
      if (spec.mechanics.includes(op.mechanic)) return spec;
      return { ...spec, mechanics: [...spec.mechanics, op.mechanic] };
    }

    default:
      return spec;
  }
}
