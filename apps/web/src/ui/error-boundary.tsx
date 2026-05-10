import { Component, type ErrorInfo, type ReactNode } from 'react'

type State = { error: Error | null }

export class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('ErrorBoundary caught:', error, info)
  }

  handleReset = () => {
    this.setState({ error: null })
    window.location.href = '/'
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex h-full items-center justify-center p-4">
          <div className="w-[min(92vw,420px)] rounded-2xl bg-gray-900/90 p-6 text-center ring-1 ring-red-500/30">
            <div className="mb-2 text-2xl font-bold text-red-400">Something broke</div>
            <pre className="mb-4 max-h-40 overflow-auto rounded bg-black/40 p-2 text-left text-xs text-gray-300">
              {this.state.error.message}
            </pre>
            <button
              onClick={this.handleReset}
              className="rounded-lg bg-yellow-400 px-4 py-2 font-bold text-gray-900 hover:bg-yellow-300"
            >
              Back to home
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
