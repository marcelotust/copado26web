import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { I18nProvider } from './i18n'
import { FeedbackProvider } from './contexts/FeedbackContext'
import './index.css'
import App from './App'

const rootEl = document.getElementById('root')
if (!rootEl) throw new Error('Missing #root element in index.html')
const root = rootEl

async function bootstrap() {
  const { initSentryClient, Sentry } = await import('./lib/sentry')
  initSentryClient()
  const AppWithErrorBoundary = Sentry.withErrorBoundary(App, {
    fallback: ({ error }) => (
      <div style={{ padding: '2rem', color: '#fff', background: '#0f172a', minHeight: '100vh' }}>
        <h1 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>Algo deu errado</h1>
        <p style={{ opacity: 0.6, fontSize: '0.875rem' }}>
          {import.meta.env.DEV && error instanceof Error
            ? error.message
            : 'Erro inesperado. Tente recarregar a página.'}
        </p>
      </div>
    ),
  })

  createRoot(root).render(
    <StrictMode>
      <BrowserRouter>
        <I18nProvider>
          <FeedbackProvider>
            <AppWithErrorBoundary />
          </FeedbackProvider>
        </I18nProvider>
      </BrowserRouter>
    </StrictMode>
  )
}

void bootstrap()
