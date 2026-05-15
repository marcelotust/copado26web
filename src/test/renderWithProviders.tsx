import { render, type RenderOptions } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import type { ReactElement, ReactNode } from 'react'
import { I18nProvider } from '../i18n'
import { FeedbackProvider } from '../contexts/FeedbackContext'

type Options = RenderOptions & {
  route?: string
  withFeedback?: boolean
}

export function renderWithProviders(ui: ReactElement, options: Options = {}) {
  const { route = '/', withFeedback = true, ...renderOptions } = options

  function Wrapper({ children }: { children: ReactNode }) {
    const inner = withFeedback
      ? <FeedbackProvider>{children}</FeedbackProvider>
      : children
    return (
      <MemoryRouter initialEntries={[route]}>
        <I18nProvider>{inner}</I18nProvider>
      </MemoryRouter>
    )
  }

  return render(ui, { wrapper: Wrapper, ...renderOptions })
}
