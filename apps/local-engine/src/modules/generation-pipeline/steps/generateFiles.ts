import type { FilePlan, GeneratedFile, GeneratedProject, ProjectSpec } from "@combi/shared";
import * as fs from "fs/promises";
import * as path from "path";

// ── System prompt for file generation ──────────────────────────

function buildSystemPrompt(spec: ProjectSpec): string {
  return `You are an expert developer. Generate complete, production-quality code files for a ${spec.kind} project.

Project: ${spec.name}
Summary: ${spec.summary}
Features: ${spec.features.join(", ")}
Constraints: ${spec.constraints.join(", ")}

Rules:
- Generate REAL, complete, working code — no stubs, no TODOs
- For HTML files: include all CSS in <style> and all JS in <script>
- Use Tailwind CSS via CDN for styling
- For games: use Canvas API with requestAnimationFrame
- All generated code must run in a browser without a build step
- Output ONLY valid JSON in this format:
{
  "files": [
    { "path": "index.html", "content": "<!DOCTYPE html>..." },
    { "path": "style.css", "content": "..." }
  ]
}`;
}

function buildUserPrompt(spec: ProjectSpec, filePlan: FilePlan): string {
  const fileList = filePlan.files
    .map(f => `  - ${f.path}: ${f.purpose}`)
    .join("\n");

  return `Generate all files for this ${spec.kind} project.

Files to generate:
${fileList}

Project spec: ${JSON.stringify(spec, null, 2)}

Respond with JSON only — no markdown, no code fences.`;
}

// ── LLM call via Gemini REST API ───────────────────────────────

async function callGemini(system: string, user: string): Promise<string> {
  const apiKey = process.env.GOOGLE_AI_API_KEY;
  if (!apiKey) throw new Error("GOOGLE_AI_API_KEY not configured");

  const model = "gemini-2.5-flash";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: system }] },
      contents: [{ role: "user", parts: [{ text: user }] }],
      generationConfig: { maxOutputTokens: 32000, temperature: 0.7 },
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Gemini error ${res.status}: ${err.slice(0, 300)}`);
  }

  const json = await res.json();
  return json.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
}

// ── JSON extraction ─────────────────────────────────────────────

function extractFiles(raw: string): GeneratedFile[] {
  // Strip markdown fences if present
  const cleaned = raw
    .replace(/^```[a-z]*\n?/im, "")
    .replace(/```\s*$/m, "")
    .trim();

  // Try direct parse
  try {
    const parsed = JSON.parse(cleaned);
    if (Array.isArray(parsed.files)) return parsed.files;
  } catch { /* try bracket search */ }

  // Search for JSON object
  const s = cleaned.indexOf("{");
  const e = cleaned.lastIndexOf("}");
  if (s !== -1 && e > s) {
    try {
      const parsed = JSON.parse(cleaned.slice(s, e + 1));
      if (Array.isArray(parsed.files)) return parsed.files;
    } catch { /* fall through */ }
  }

  throw new Error("Could not extract files from LLM response");
}

// ── Write files to disk ─────────────────────────────────────────

async function writeFiles(workspacePath: string, files: GeneratedFile[]): Promise<void> {
  await fs.mkdir(workspacePath, { recursive: true });
  await Promise.all(
    files.map(async (file) => {
      const fullPath = path.join(workspacePath, file.path);
      await fs.mkdir(path.dirname(fullPath), { recursive: true });
      await fs.writeFile(fullPath, file.content, "utf-8");
    })
  );
}

// ── Step ────────────────────────────────────────────────────────

export class GenerateFilesStep {
  async execute(spec: ProjectSpec, filePlan: FilePlan): Promise<GeneratedProject> {
    const workspacePath = `projects/${filePlan.rootDir}`;

    console.log(`[GenerateFilesStep] Generating ${filePlan.files.length} files for "${spec.name}"...`);

    const system = buildSystemPrompt(spec);
    const user   = buildUserPrompt(spec, filePlan);

    // Attempt with retry
    let lastErr: unknown;
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const raw   = await callGemini(system, user);
        const files = extractFiles(raw);

        console.log(`[GenerateFilesStep] Got ${files.length} files from LLM`);

        // Write to disk
        await writeFiles(workspacePath, files);

        return {
          workspacePath,
          generatedFiles: files.map(f => f.path),
          files,
        };
      } catch (err) {
        lastErr = err;
        console.warn(`[GenerateFilesStep] Attempt ${attempt} failed:`, err);
      }
    }

    throw new Error(`GenerateFilesStep failed after retries: ${lastErr}`);
  }
}
