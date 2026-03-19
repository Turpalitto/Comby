import { describe, it, expect } from 'vitest'
import { ALL_MODELS, getModel } from '../providers'

describe('providers — model registry', () => {
  it('ALL_MODELS is non-empty', () => {
    expect(ALL_MODELS.length).toBeGreaterThan(0)
  })

  it('every model has required fields', () => {
    for (const m of ALL_MODELS) {
      expect(m.key,      `${m.key} missing key`).toBeTruthy()
      expect(m.label,    `${m.key} missing label`).toBeTruthy()
      expect(m.modelId,  `${m.key} missing modelId`).toBeTruthy()
      expect(m.provider, `${m.key} missing provider`).toBeTruthy()
    }
  })

  it('getModel returns correct model by key', () => {
    const m = getModel('gemini-flash')
    expect(m.key).toBe('gemini-flash')
    expect(m.provider).toBe('google')
  })

  it('getModel falls back to first model for unknown key', () => {
    const m = getModel('nonexistent-model-xyz')
    expect(m).toBe(ALL_MODELS[0])
  })

  it('each provider key is one of the valid providers', () => {
    const valid = new Set(['google', 'mistral', 'groq', 'cerebras', 'openrouter'])
    for (const m of ALL_MODELS) {
      expect(valid.has(m.provider), `${m.key} has invalid provider: ${m.provider}`).toBe(true)
    }
  })

  it('google models use Gemini model IDs', () => {
    const googleModels = ALL_MODELS.filter(m => m.provider === 'google')
    for (const m of googleModels) {
      expect(m.modelId).toMatch(/gemini/i)
    }
  })

  it('no duplicate model keys', () => {
    const keys = ALL_MODELS.map(m => m.key)
    const unique = new Set(keys)
    expect(unique.size).toBe(keys.length)
  })
})
