import { useState, useEffect, useCallback, useRef } from 'react'
import type { ChatMessage, AgentFile } from '@/core/agentTypes'

// ─── Types ─────────────────────────────────────────────────────

export interface SavedProject {
  id:         string
  name:       string
  messages:   ChatMessage[]
  files:      AgentFile[]
  activeFile: string | null
  updatedAt:  number
  createdAt:  number
}

export interface ProjectMeta {
  id:        string
  name:      string
  updatedAt: number
  createdAt: number
  fileCount: number
  msgCount:  number
}

// ─── Hook ──────────────────────────────────────────────────────

export function useProjects() {
  const [projects, setProjects] = useState<ProjectMeta[]>([])
  const [loading, setLoading] = useState(true)
  const savingRef = useRef(false)

  // Загрузить список проектов с сервера, fallback на localStorage
  const loadProjects = useCallback(async () => {
    try {
      const res = await fetch('/api/projects')
      if (res.ok) {
        const data: ProjectMeta[] = await res.json()
        setProjects(data)
        setLoading(false)
        return
      }
    } catch { /* fallback to localStorage */ }

    // Fallback: localStorage
    try {
      const raw = localStorage.getItem('combi_projects_meta')
      if (raw) setProjects(JSON.parse(raw))
    } catch { /* ignore */ }
    setLoading(false)
  }, [])

  useEffect(() => { loadProjects() }, [loadProjects])

  // Сохранить проект
  const saveProject = useCallback(async (
    id: string,
    name: string,
    messages: ChatMessage[],
    files: AgentFile[],
    activeFile: string | null,
  ) => {
    // Предотвращаем одновременные сохранения
    if (savingRef.current) return
    savingRef.current = true

    const project: SavedProject = {
      id,
      name: name || 'Без названия',
      messages,
      files,
      activeFile,
      updatedAt: Date.now(),
      createdAt: Date.now(),
    }

    // Сохраняем на сервер
    try {
      await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(project),
      })
    } catch {
      // Fallback: localStorage
      try {
        localStorage.setItem(`combi_project_${id}`, JSON.stringify(project))

        // Обновить мета-список в localStorage
        const meta: ProjectMeta = {
          id, name: project.name,
          updatedAt: project.updatedAt, createdAt: project.createdAt,
          fileCount: files.length, msgCount: messages.length,
        }
        const existing = JSON.parse(localStorage.getItem('combi_projects_meta') ?? '[]') as ProjectMeta[]
        const idx = existing.findIndex(p => p.id === id)
        if (idx >= 0) existing[idx] = meta; else existing.unshift(meta)
        localStorage.setItem('combi_projects_meta', JSON.stringify(existing))
      } catch { /* ignore */ }
    }

    // Обновить локальный стейт
    setProjects(prev => {
      const meta: ProjectMeta = {
        id, name: project.name,
        updatedAt: project.updatedAt, createdAt: project.createdAt,
        fileCount: files.length, msgCount: messages.length,
      }
      const filtered = prev.filter(p => p.id !== id)
      return [meta, ...filtered]
    })

    savingRef.current = false
  }, [])

  // Загрузить полный проект
  const loadProject = useCallback(async (id: string): Promise<SavedProject | null> => {
    // Сервер
    try {
      const res = await fetch(`/api/projects/${id}`)
      if (res.ok) return await res.json()
    } catch { /* fallback */ }

    // localStorage
    try {
      const raw = localStorage.getItem(`combi_project_${id}`)
      if (raw) return JSON.parse(raw)
    } catch { /* ignore */ }

    return null
  }, [])

  // Удалить проект
  const deleteProject = useCallback(async (id: string) => {
    try {
      await fetch(`/api/projects/${id}`, { method: 'DELETE' })
    } catch { /* fallback */ }

    try { localStorage.removeItem(`combi_project_${id}`) } catch { /* ignore */ }

    setProjects(prev => prev.filter(p => p.id !== id))
  }, [])

  return { projects, loading, saveProject, loadProject, deleteProject }
}
