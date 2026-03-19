import { describe, it, expect } from 'vitest'

// Copy of the extractJSON logic from route.ts for testing
interface AgentResponse {
  stage: string
  summary: string
  entryPoint?: string
  files: { path: string; content: string }[]
}

function isValidResponse(obj: unknown): obj is AgentResponse {
  if (!obj || typeof obj !== 'object') return false
  const r = obj as Record<string, unknown>
  return (
    typeof r.stage === 'string' &&
    typeof r.summary === 'string' &&
    Array.isArray(r.files) &&
    (r.files as unknown[]).every((f: unknown) =>
      f && typeof f === 'object' &&
      typeof (f as Record<string, unknown>).path === 'string' &&
      typeof (f as Record<string, unknown>).content === 'string'
    )
  )
}

function extractJSON(text: string): AgentResponse | null {
  const attempts = [
    () => JSON.parse(text),
    () => JSON.parse(text.replace(/^```[a-z]*\n?/im, '').replace(/```\s*$/m, '').trim()),
    () => {
      const s = text.indexOf('{')
      const e = text.lastIndexOf('}')
      return s !== -1 && e > s ? JSON.parse(text.slice(s, e + 1)) : null
    },
  ]
  for (const attempt of attempts) {
    try { const p = attempt(); if (isValidResponse(p)) return p } catch { /* next */ }
  }
  return null
}

const VALID: AgentResponse = {
  stage: 'complete',
  summary: 'Test app\n- Feature 1',
  entryPoint: 'index.html',
  files: [{ path: 'index.html', content: '<!DOCTYPE html><html></html>' }],
}

describe('extractJSON', () => {
  it('parses valid JSON directly', () => {
    const result = extractJSON(JSON.stringify(VALID))
    expect(result).not.toBeNull()
    expect(result!.stage).toBe('complete')
    expect(result!.files).toHaveLength(1)
  })

  it('strips markdown code fences', () => {
    const wrapped = '```json\n' + JSON.stringify(VALID) + '\n```'
    const result = extractJSON(wrapped)
    expect(result).not.toBeNull()
  })

  it('extracts JSON from surrounding text', () => {
    const text = 'Here is the result:\n' + JSON.stringify(VALID) + '\nDone.'
    const result = extractJSON(text)
    expect(result).not.toBeNull()
    expect(result!.files[0].path).toBe('index.html')
  })

  it('returns null for completely invalid input', () => {
    expect(extractJSON('not json at all')).toBeNull()
    expect(extractJSON('')).toBeNull()
    expect(extractJSON('{}')).toBeNull()
  })

  it('returns null when files array is missing', () => {
    const bad = JSON.stringify({ stage: 'complete', summary: 'x' })
    expect(extractJSON(bad)).toBeNull()
  })

  it('returns null when a file is missing content', () => {
    const bad = JSON.stringify({
      stage: 'complete', summary: 'x',
      files: [{ path: 'index.html' }],  // no content
    })
    expect(extractJSON(bad)).toBeNull()
  })
})
