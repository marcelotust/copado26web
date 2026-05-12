import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { I18nProvider } from './i18n'
import { FeedbackProvider } from './components/FeedbackProvider'
import './index.css'
import App from './App'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <I18nProvider>
        <FeedbackProvider>
          <App />
        </FeedbackProvider>
      </I18nProvider>
    </BrowserRouter>
  </StrictMode>
)
