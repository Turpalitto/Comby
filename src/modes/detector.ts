import type { ProjectType, UserIdea, ITypeDetector } from '@/core/types';

// ─── Signal tables ────────────────────────────────────────────

interface SignalRule {
  pattern: RegExp;
  weight:  number;
  label:   string;
}

const WEBSITE_RULES: SignalRule[] = [
  // Strong explicit signals
  { pattern: /\b(landing\s*page|homepage|home\s*page)\b/i,          weight: 10, label: 'landing page'   },
  { pattern: /\bportfolio\b/i,                                       weight: 10, label: 'portfolio'      },
  { pattern: /\b(website|web\s*site)\b/i,                            weight:  9, label: 'website'        },
  { pattern: /\bblog\b/i,                                            weight:  8, label: 'blog'           },
  { pattern: /\bshowcase\b/i,                                        weight:  7, label: 'showcase'       },
  // Medium signals
  { pattern: /\b(agency|studio|freelance)\b/i,                       weight:  6, label: 'agency'         },
  { pattern: /\b(saas|startup|product\s*page)\b/i,                   weight:  6, label: 'saas/startup'   },
  { pattern: /\b(personal\s*site|about\s*me|cv|resume)\b/i,          weight:  7, label: 'personal site'  },
  { pattern: /\b(hero|features?|testimonials?|pricing|cta)\b/i,      weight:  5, label: 'landing section'},
  // Weak signals
  { pattern: /\b(company|business|brand|marketing)\b/i,              weight:  3, label: 'business'       },
  { pattern: /\b(present|showcase|display|show)\b/i,                 weight:  2, label: 'present'        },
  { pattern: /\b(photographer|designer|artist|writer|musician)\b/i,  weight:  5, label: 'creative pro'   },
  // ── Russian keywords (no \b — doesn't work with Cyrillic in JS) ─
  { pattern: /(сайт|веб.сайт|вебсайт)/i,                            weight:  9, label: 'website'        },
  { pattern: /(лендинг|посадочная\s*страница|главная\s*страница)/i,  weight: 10, label: 'landing page'   },
  { pattern: /портфолио/i,                                           weight: 10, label: 'portfolio'      },
  { pattern: /блог/i,                                                weight:  8, label: 'blog'           },
  { pattern: /(агентство|студия|фриланс)/i,                          weight:  6, label: 'agency'         },
  { pattern: /(стартап|продуктовая\s*страница)/i,                    weight:  6, label: 'saas/startup'   },
  { pattern: /(личный\s*сайт|резюме|портфель)/i,                     weight:  7, label: 'personal site'  },
  { pattern: /(компания|бизнес|бренд|маркетинг)/i,                   weight:  3, label: 'business'       },
  { pattern: /(фотограф|дизайнер|художник|писатель|музыкант)/i,      weight:  5, label: 'creative pro'   },
  { pattern: /(функции|преимущества|тарифы|отзывы)/i,                weight:  5, label: 'landing section'},
  { pattern: /(подключающий|представляющий|демонстрирующий)/i,       weight:  4, label: 'present'        },
];

const APP_RULES: SignalRule[] = [
  // Strong
  { pattern: /\bdashboard\b/i,                                       weight: 10, label: 'dashboard'      },
  { pattern: /\b(web\s*app|webapp)\b/i,                              weight: 10, label: 'web app'        },
  { pattern: /\badmin\s*(panel|interface|area)?\b/i,                 weight:  9, label: 'admin panel'    },
  { pattern: /\b(crm|erp|cms)\b/i,                                   weight:  9, label: 'CRM/ERP'        },
  { pattern: /\bkanban\b/i,                                          weight:  9, label: 'kanban'         },
  { pattern: /\b(todo|to-do|task\s*manager)\b/i,                     weight:  8, label: 'task manager'   },
  // Medium
  { pattern: /\b(tracker|monitor|analytics?)\b/i,                    weight:  7, label: 'tracker'        },
  { pattern: /\b(manager|management|manage)\b/i,                     weight:  6, label: 'manager'        },
  { pattern: /\b(tool|app|application|platform)\b/i,                 weight:  5, label: 'tool/app'       },
  { pattern: /\b(sidebar|topbar|navbar|table|data\s*grid)\b/i,       weight:  5, label: 'app UI'         },
  // Weak
  { pattern: /\b(user|users|login|auth|account)\b/i,                 weight:  3, label: 'user management'},
  { pattern: /\b(report|reports|chart|graph|metrics)\b/i,            weight:  4, label: 'reporting'      },
  { pattern: /\b(inventory|stock|order|invoice)\b/i,                 weight:  6, label: 'business tool'  },
  { pattern: /\b(schedule|calendar|booking|appointment)\b/i,         weight:  6, label: 'scheduling'     },
  { pattern: /\bfinance|budget|expense|accounting\b/i,               weight:  6, label: 'finance app'    },
  // ── Russian keywords (no \b — doesn't work with Cyrillic in JS) ─
  { pattern: /(дашборд|панель\s*управления)/i,                       weight: 10, label: 'dashboard'      },
  { pattern: /(веб.приложение|вебапп)/i,                             weight: 10, label: 'web app'        },
  { pattern: /(админ.панель|панель\s*администратора)/i,              weight:  9, label: 'admin panel'    },
  { pattern: /канбан/i,                                              weight:  9, label: 'kanban'         },
  { pattern: /(менеджер\s*задач|список\s*дел|туду)/i,                weight:  8, label: 'task manager'   },
  { pattern: /(трекер|мониторинг|аналитика)/i,                       weight:  7, label: 'tracker'        },
  { pattern: /(менеджер|управление|система\s*управления)/i,          weight:  6, label: 'manager'        },
  { pattern: /(инструмент|приложение|платформа)/i,                   weight:  5, label: 'tool/app'       },
  { pattern: /(пользователи|участники|аккаунт)/i,                    weight:  3, label: 'user management'},
  { pattern: /(отчёты|графики|метрики|статистика)/i,                 weight:  4, label: 'reporting'      },
  { pattern: /(инвентарь|склад|заказы|счета)/i,                      weight:  6, label: 'business tool'  },
  { pattern: /(расписание|календарь|бронирование|запись)/i,          weight:  6, label: 'scheduling'     },
  { pattern: /(финансы|бюджет|расходы|бухгалтерия)/i,                weight:  6, label: 'finance app'    },
];

const GAME_RULES: SignalRule[] = [
  // Strong
  { pattern: /\b(game|gaming)\b/i,                                   weight: 12, label: 'game'           },
  { pattern: /\b(platformer|platform\s*game)\b/i,                    weight: 11, label: 'platformer'     },
  { pattern: /\b(shooter|shoot\s*em\s*up|shmup)\b/i,                 weight: 11, label: 'shooter'        },
  { pattern: /\b(arcade)\b/i,                                        weight: 10, label: 'arcade'         },
  { pattern: /\b(puzzle\s*game|match.3)\b/i,                         weight: 10, label: 'puzzle game'    },
  { pattern: /\b(endless\s*runner|runner\s*game)\b/i,                weight: 10, label: 'runner'         },
  // Medium
  { pattern: /\b(player|players?)\b/i,                               weight:  6, label: 'player'         },
  { pattern: /\b(enemy|enemies|boss|obstacle)\b/i,                   weight:  8, label: 'enemy'          },
  { pattern: /\b(jump|shoot|dodge|collect|spawn)\b/i,                weight:  6, label: 'game action'    },
  { pattern: /\b(level|levels?|stage|stages?)\b/i,                   weight:  5, label: 'levels'         },
  { pattern: /\b(score|leaderboard|highscore)\b/i,                   weight:  6, label: 'score'          },
  { pattern: /\b(health|lives?|hp|power.?up)\b/i,                    weight:  6, label: 'game mechanic'  },
  // Weak
  { pattern: /\b(pixel|sprite|canvas|2d)\b/i,                        weight:  4, label: 'game tech'      },
  { pattern: /\b(fun|play(able)?|playthrough)\b/i,                   weight:  2, label: 'play'           },
  { pattern: /\b(neon|retro|8.?bit|chiptune)\b/i,                    weight:  4, label: 'game aesthetic' },
  // ── Russian keywords (no \b — doesn't work with Cyrillic in JS) ─
  { pattern: /(игра|игровой|игрушка)/i,                              weight: 12, label: 'game'           },
  { pattern: /(платформер|платформенная\s*игра)/i,                   weight: 11, label: 'platformer'     },
  { pattern: /(шутер|стрелялка|космический\s*корабль)/i,             weight: 11, label: 'shooter'        },
  { pattern: /(аркада|аркадная\s*игра)/i,                            weight: 10, label: 'arcade'         },
  { pattern: /(головоломка|пазл|матч.3)/i,                           weight: 10, label: 'puzzle game'    },
  { pattern: /(раннер|бесконечный\s*бег|бегун)/i,                    weight: 10, label: 'runner'         },
  { pattern: /(игрок|персонаж)/i,                                    weight:  6, label: 'player'         },
  { pattern: /(враг|враги|босс|препятствие)/i,                       weight:  8, label: 'enemy'          },
  { pattern: /(прыжок|стрельба|уклонение|сбор|спавн)/i,              weight:  6, label: 'game action'    },
  { pattern: /(уровень|уровни|этап|стадия)/i,                        weight:  5, label: 'levels'         },
  { pattern: /(очки|рекорд|таблица\s*лидеров)/i,                     weight:  6, label: 'score'          },
  { pattern: /(здоровье|жизни|усиление|бонус)/i,                     weight:  6, label: 'game mechanic'  },
  { pattern: /(пиксель|спрайт|2д)/i,                                 weight:  4, label: 'game tech'      },
  { pattern: /(неон|ретро|8.?бит)/i,                                 weight:  4, label: 'game aesthetic' },
];

// ─── Types ────────────────────────────────────────────────────

export interface DetectionResult {
  type:       ProjectType;
  confidence: number;           // 0–1
  scores:     Record<ProjectType, number>;
  signals:    string[];         // human-readable triggers
}

// ─── Core detector ────────────────────────────────────────────

export class TypeDetector implements ITypeDetector {
  /** Returns just the ProjectType (satisfies ITypeDetector interface) */
  detect(idea: UserIdea): ProjectType {
    return this.analyse(idea.raw).type;
  }

  /** Full analysis — scores, confidence, signals */
  analyse(text: string): DetectionResult {
    const ws = score(text, WEBSITE_RULES);
    const as = score(text, APP_RULES);
    const gs = score(text, GAME_RULES);

    const scores: Record<ProjectType, number> = {
      website: ws.total,
      app:     as.total,
      game:    gs.total,
    };

    const max = Math.max(ws.total, as.total, gs.total);

    // Default to 'website' when nothing matches
    let type: ProjectType = 'website';
    if (max === 0) {
      type = 'website';
    } else if (gs.total === max) {
      type = 'game';
    } else if (as.total === max) {
      type = 'app';
    } else {
      type = 'website';
    }

    // Confidence: how dominant is the winner?
    const second = [ws.total, as.total, gs.total]
      .filter(s => s !== max)
      .reduce((a, b) => Math.max(a, b), 0);

    const gap = max - second;
    const confidence = max === 0
      ? 0.5   // no signals → default with low confidence
      : Math.min(1, 0.5 + gap / Math.max(max, 1) * 0.5);

    // Collect human-readable signal labels
    const winnerSignals =
      type === 'game'    ? gs.signals :
      type === 'app'     ? as.signals :
                           ws.signals;

    return { type, confidence, scores, signals: winnerSignals };
  }
}

// ─── Helpers ─────────────────────────────────────────────────

function score(
  text: string,
  rules: SignalRule[],
): { total: number; signals: string[] } {
  let total = 0;
  const signals: string[] = [];

  for (const rule of rules) {
    if (rule.pattern.test(text)) {
      total += rule.weight;
      if (!signals.includes(rule.label)) signals.push(rule.label);
    }
  }

  return { total, signals };
}

// ─── Singleton ────────────────────────────────────────────────
export const typeDetector = new TypeDetector();
