import { Component, type ErrorInfo, type ReactNode } from 'react'
import ServerErrorPage from '../pages/ServerErrorPage'

type AppErrorBoundaryProps = {
  children: ReactNode
}

type AppErrorBoundaryState = {
  error: Error | null
}

export default class AppErrorBoundary extends Component<AppErrorBoundaryProps, AppErrorBoundaryState> {
  override state: AppErrorBoundaryState = { error: null }

  static getDerivedStateFromError(error: Error): AppErrorBoundaryState {
    return { error }
  }

  override componentDidCatch(error: Error, info: ErrorInfo): void {
    import('../lib/sentry')
      .then(({ initSentryClient, Sentry }) => {
        initSentryClient()
        Sentry.captureException(error, { extra: { componentStack: info.componentStack } })
      })
      .catch(() => {
        /* noop */
      })
  }

  override render() {
    if (this.state.error) {
      return (
        <ServerErrorPage
          detail={import.meta.env.DEV ? this.state.error.message : undefined}
        />
      )
    }

    return this.props.children
  }
}
