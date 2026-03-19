import type { GeneratedProject, PreviewConfig, PreviewMode } from '@/core/types';
import type { AgentFile } from '@/core/agentTypes';

export class PreviewManager {
  private activeUrl: string | null = null;

  getConfig(project: GeneratedProject): PreviewConfig {
    const mode: PreviewMode = 'iframe';
    return {
      mode,
      entryFile: project.filePlan.entryPoint,
      projectId: project.id,
    };
  }

  /** Build a blob URL from the project's entry file. Revokes the previous one. */
  buildPreviewUrl(project: GeneratedProject): string {
    this.revoke();
    const entry = project.files.find(f => f.path === project.filePlan.entryPoint);
    if (!entry) return '';
    const blob = new Blob([entry.content], { type: 'text/html' });
    this.activeUrl = URL.createObjectURL(blob);
    return this.activeUrl;
  }

  /** Build a blob URL directly from an HTML string. */
  buildFromHtml(html: string): string {
    this.revoke();
    const blob = new Blob([html], { type: 'text/html' });
    this.activeUrl = URL.createObjectURL(blob);
    return this.activeUrl;
  }

  /**
   * Multi-file preview: собирает CSS и JS файлы и инжектит их
   * в entry HTML. Если entry HTML не найден — возвращает первый HTML-файл.
   */
  buildFromFiles(files: AgentFile[], entryPoint?: string): string {
    this.revoke();

    // Находим entry HTML файл
    let entryFile = entryPoint
      ? files.find(f => f.path === entryPoint)
      : undefined;
    if (!entryFile) {
      entryFile = files.find(f => f.path.endsWith('.html'));
    }
    if (!entryFile) {
      // Нет HTML — возвращаем пустую страницу
      return this.buildFromHtml('<html><body><p>No HTML file found</p></body></html>');
    }

    let html = entryFile.content;

    // Собираем все CSS-файлы (кроме entry)
    const cssFiles = files.filter(f =>
      f.path.endsWith('.css') && f.path !== entryFile!.path
    );

    // Собираем все JS-файлы (кроме entry)
    const jsFiles = files.filter(f =>
      (f.path.endsWith('.js') || f.path.endsWith('.ts')) &&
      f.path !== entryFile!.path
    );

    // Инжектим CSS перед </head>
    if (cssFiles.length > 0) {
      const cssBlock = cssFiles
        .map(f => `/* ── ${f.path} ── */\n${f.content}`)
        .join('\n\n');
      const styleTag = `<style>\n${cssBlock}\n</style>`;

      if (html.includes('</head>')) {
        html = html.replace('</head>', `${styleTag}\n</head>`);
      } else if (html.includes('<body')) {
        html = html.replace('<body', `${styleTag}\n<body`);
      } else {
        html = styleTag + '\n' + html;
      }
    }

    // Инжектим JS перед </body>
    if (jsFiles.length > 0) {
      const jsBlock = jsFiles
        .map(f => `// ── ${f.path} ──\n${f.content}`)
        .join('\n\n');
      const scriptTag = `<script>\n${jsBlock}\n</script>`;

      if (html.includes('</body>')) {
        html = html.replace('</body>', `${scriptTag}\n</body>`);
      } else {
        html += '\n' + scriptTag;
      }
    }

    // Заменяем ссылки на локальные файлы (link href="style.css" → inline)
    // Обрабатываем <link rel="stylesheet" href="...">
    html = html.replace(
      /<link\s+[^>]*href=["']([^"']+\.css)["'][^>]*>/gi,
      (match, href) => {
        const cssFile = files.find(f => f.path === href || f.path.endsWith('/' + href));
        if (cssFile) {
          return `<style>/* ${href} */\n${cssFile.content}\n</style>`;
        }
        return match;
      }
    );

    // Обрабатываем <script src="...">
    html = html.replace(
      /<script\s+[^>]*src=["']([^"']+\.(js|ts))["'][^>]*>\s*<\/script>/gi,
      (match, src) => {
        const jsFile = files.find(f => f.path === src || f.path.endsWith('/' + src));
        if (jsFile) {
          return `<script>/* ${src} */\n${jsFile.content}\n</script>`;
        }
        return match;
      }
    );

    const blob = new Blob([html], { type: 'text/html' });
    this.activeUrl = URL.createObjectURL(blob);
    return this.activeUrl;
  }

  /** Release the current blob URL to avoid memory leaks. */
  revoke(): void {
    if (this.activeUrl) {
      URL.revokeObjectURL(this.activeUrl);
      this.activeUrl = null;
    }
  }
}

// Singleton for the shell — one manager per session
export const previewManager = new PreviewManager();
