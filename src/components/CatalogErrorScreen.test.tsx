import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import CatalogErrorScreen from './CatalogErrorScreen'
import { I18nProvider } from '../i18n'

function renderWithI18n(ui: React.ReactElement) {
  return render(<I18nProvider>{ui}</I18nProvider>)
}

describe('CatalogErrorScreen', () => {
  beforeEach(() => {
    // Default: online
    Object.defineProperty(navigator, 'onLine', { configurable: true, value: true })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('shows catalog error message when online', () => {
    renderWithI18n(<CatalogErrorScreen error={new Error('fetch failed')} />)

    expect(screen.getByText(/could not load the album/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument()
  })

  it('shows offline message when navigator.onLine is false', () => {
    Object.defineProperty(navigator, 'onLine', { configurable: true, value: false })

    renderWithI18n(<CatalogErrorScreen error={null} />)

    expect(screen.getByText(/you're offline/i)).toBeInTheDocument()
    expect(screen.getByText(/internet connection/i)).toBeInTheDocument()
  })

  it('does not expose error.message in production', () => {
    vi.stubEnv('PROD', true)

    renderWithI18n(<CatalogErrorScreen error={new Error('secret db error')} />)

    expect(screen.queryByText('secret db error')).not.toBeInTheDocument()
  })
})
