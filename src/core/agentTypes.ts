export type AgentStage = 'thinking' | 'generating' | 'fixing' | 'complete' | 'error'

export interface AgentFile {
  path: string
  content: string
}

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  files?: AgentFile[]
  stage?: AgentStage
  model?: string
  ts: number
}

export interface AgentResponse {
  stage: AgentStage
  summary: string
  files: AgentFile[]
  entryPoint: string
  error?: string
  _model?: string
}
