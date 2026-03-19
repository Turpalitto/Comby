import { describe, it, expect } from 'vitest'

// Test the JSON extraction logic from generateFiles.ts (apps/local-engine)
interface GeneratedFile { path: string; content: string }

function extractFiles(raw: string): GeneratedFile[] {
  const cleaned = raw
    .replace(/^```[a-z]*\n?/im, '')
    .replace(/```\s*$/m, '')
    .trim()

  try {
    const parsed = JSON.parse(cleaned)
    if (Array.isArray(parsed.files)) return parsed.files
  } catch { /* try bracket search */ }

  const s = cleaned.indexOf('{')
  const e = cleaned.lastIndexOf('}')
  if (s !== -1 && e > s) {
    try {
      const parsed = JSON.parse(cleaned.slice(s, e + 1))
      if (Array.isArray(parsed.files)) return parsed.files
    } catch { /* fall through */ }
  }

  throw new Error('Could not extract files from LLM response')
}

const VALID_RESPONSE = JSON.stringify({
  files: [
    { path: 'index.html', content: '<!DOCTYPE html><html><body>Hello</body></html>' },
    { path: 'style.css',  content: 'body { margin: 0; }' },
  ]
})

describe('generateFiles — extractFiles', () => {
  it('extracts files from valid JSON', () => {
    const files = extractFiles(VALID_RESPONSE)
    expect(files).toHaveLength(2)
    expect(files[0].path).toBe('index.html')
    expect(files[1].path).toBe('style.css')
  })

  it('strips markdown fences before parsing', () => {
    const wrapped = '```json\n' + VALID_RESPONSE + '\n```'
    const files = extractFiles(wrapped)
    expect(files).toHaveLength(2)
  })

  it('extracts from text with surrounding content', () => {
    const text = 'Here are the files:\n' + VALID_RESPONSE + '\nEnd.'
    const files = extractFiles(text)
    expect(files).toHaveLength(2)
  })

  it('throws on invalid input', () => {
    expect(() => extractFiles('not json')).toThrow()
    expect(() => extractFiles('')).toThrow()
  })

  it('preserves file content exactly', () => {
    const content = '<!DOCTYPE html><html><body><script>const x = 1;</script></body></html>'
    const raw = JSON.stringify({ files: [{ path: 'index.html', content }] })
    const files = extractFiles(raw)
    expect(files[0].content).toBe(content)
  })
})
