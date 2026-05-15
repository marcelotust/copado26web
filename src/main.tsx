import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { I18nProvider } from './i18n'
import { FeedbackProvider } from './contexts/FeedbackContext'
import './index.css'
import App from './App'
import AppErrorBoundary from './components/AppErrorBoundary'

const rootEl = document.getElementById('root')
if (!rootEl) throw new Error('Missing #root element in index.html')
const root = rootEl

createRoot(root).render(
  <StrictMode>
    <BrowserRouter>
      <I18nProvider>
        <FeedbackProvider>
          <AppErrorBoundary>
            <App />
          </AppErrorBoundary>
        </FeedbackProvider>
      </I18nProvider>
    </BrowserRouter>
  </StrictMode>
)

function initSentryWhenIdle(): void {
  void import('./lib/sentry')
    .then(({ initSentryClient }) => initSentryClient())
    .catch(() => {
      /* noop */
    })
}

if ('requestIdleCallback' in window) {
  window.requestIdleCallback(initSentryWhenIdle)
} else {
  setTimeout(initSentryWhenIdle, 2_000)
}
