'use client'

import React from 'react'

interface Props {
  children: React.ReactNode
  fallbackMessage?: string
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[ErrorBoundary]', error, info.componentStack)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center h-full gap-4 p-8">
          <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-2xl">
            ⚠
          </div>
          <div className="text-center">
            <p className="text-[15px] font-medium text-white/70">
              {this.props.fallbackMessage ?? 'Произошла ошибка'}
            </p>
            <p className="text-[12px] text-white/30 mt-1 max-w-md">
              {this.state.error?.message}
            </p>
          </div>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="px-4 py-2 rounded-lg text-[13px] font-medium bg-white/10 text-white/70 hover:bg-white/15 hover:text-white transition-all border border-white/10"
          >
            Попробовать снова
          </button>
        </div>
      )
    }

    return this.props.children
  }
}
