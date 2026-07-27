import { Component, type ErrorInfo, type ReactNode } from 'react'
import { RefreshCw, TriangleAlert } from 'lucide-react'
import { Button } from './Button'

interface Props {
  children: ReactNode
}

interface State {
  error: Error | null
}

/**
 * Catches render errors so a bug cannot leave a blank screen.
 *
 * This matters more than usual here: installed to the Home Screen there is no
 * address bar, so a white page has no way out short of force-quitting. The
 * recovery path deliberately offers reload before anything destructive, and
 * never touches stored data — a render bug is not a reason to lose a year of
 * training history.
 *
 * A class is the only way to implement this in React.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // No reporting service by design; the console is the only sink available.
    console.error('Arohan crashed while rendering', error, info.componentStack)
  }

  render() {
    const { error } = this.state
    if (!error) return this.props.children

    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-5 bg-canvas px-6 text-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber/12 text-amber">
          <TriangleAlert className="h-7 w-7" />
        </span>

        <div className="max-w-sm">
          <h1 className="text-title text-ink">Something went wrong</h1>
          <p className="mt-2 text-body leading-relaxed text-muted">
            Arohan hit an error while drawing this screen. Your data is untouched — it is all
            still stored on this device.
          </p>
        </div>

        <Button
          size="lg"
          icon={<RefreshCw className="h-5 w-5" />}
          onClick={() => window.location.reload()}
        >
          Reload Arohan
        </Button>

        <details className="w-full max-w-sm text-left">
          <summary className="cursor-pointer text-caption text-faint">Technical detail</summary>
          <pre className="mt-2 overflow-x-auto rounded-xl bg-sunken p-3 text-micro leading-relaxed text-muted">
            {error.message}
          </pre>
        </details>
      </div>
    )
  }
}
