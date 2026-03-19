'use client'

import { useCallback, useRef, useState } from 'react'
import type { AgentFile } from '@/core/agentTypes'

export interface Version {
  id:        string
  label:     string   // summary or timestamp
  files:     AgentFile[]
  createdAt: number
}

const MAX_VERSIONS = 20

export function useVersionHistory() {
  const [versions, setVersions] = useState<Version[]>([])
  const [cursor,   setCursor]   = useState(-1)  // -1 = latest
  const latestRef  = useRef<AgentFile[]>([])

  const push = useCallback((files: AgentFile[], label: string) => {
    latestRef.current = files
    const v: Version = {
      id:        crypto.randomUUID(),
      label,
      files,
      createdAt: Date.now(),
    }
    setVersions(prev => {
      const sliced = prev.slice(0, MAX_VERSIONS - 1)
      return [v, ...sliced]
    })
    setCursor(-1)
  }, [])

  const undo = useCallback(() => {
    setVersions(prev => {
      const nextCursor = cursor === -1 ? 0 : cursor + 1
      if (nextCursor >= prev.length) return prev
      setCursor(nextCursor)
      return prev
    })
  }, [cursor])

  const redo = useCallback(() => {
    setCursor(prev => {
      if (prev <= 0) return -1
      return prev - 1
    })
  }, [])

  const restore = useCallback((id: string) => {
    setVersions(prev => {
      const idx = prev.findIndex(v => v.id === id)
      if (idx >= 0) setCursor(idx)
      return prev
    })
  }, [])

  const currentFiles: AgentFile[] | null =
    cursor === -1 ? null : (versions[cursor]?.files ?? null)

  const canUndo = versions.length > 0 && cursor < versions.length - 1
  const canRedo = cursor > 0 || cursor === 0

  return { versions, push, undo, redo, restore, currentFiles, canUndo, canRedo, cursor }
}
