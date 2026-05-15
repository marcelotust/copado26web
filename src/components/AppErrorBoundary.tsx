import { Component, type ErrorInfo, type ReactNode } from 'react'

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
        <div style={{ padding: '2rem', color: '#fff', background: '#0f172a', minHeight: '100vh' }}>
          <h1 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>Algo deu errado</h1>
          <p style={{ opacity: 0.6, fontSize: '0.875rem' }}>
            {import.meta.env.DEV ? this.state.error.message : 'Erro inesperado. Tente recarregar a página.'}
          </p>
        </div>
      )
    }

    return this.props.children
  }
}
