import { createContext, useContext, useState, useMemo, type ReactNode } from 'react'
import {
  LOCALES,
  RAW,
  detectLocale,
  persistLocale,
  type Locale,
} from './localeData'

export { LOCALE_META } from './localeData'
export type { Locale } from './localeData'

export type I18nContextValue = {
  locale: Locale
  setLocale: (code: Locale) => void
  t: (key: string) => string
  tRaw: (key: string) => unknown
}

const I18nContext = createContext<I18nContextValue | null>(null)

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(detectLocale)

  function setLocale(code: Locale) {
    persistLocale(code)
    setLocaleState(code)
  }

  const t = useMemo(
    () => (key: string): string => LOCALES[locale]?.[key] ?? LOCALES.en[key] ?? key,
    [locale],
  )

  function tRaw(key: string): unknown {
    const parts = key.split('.')
    let val: unknown = RAW[locale]
    for (const p of parts) val = (val as Record<string, unknown> | null | undefined)?.[p]
    if (val !== undefined) return val
    val = RAW.en
    for (const p of parts) val = (val as Record<string, unknown> | null | undefined)?.[p]
    return val
  }

  return (
    <I18nContext.Provider value={{ locale, setLocale, t, tRaw }}>
      {children}
    </I18nContext.Provider>
  )
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error('useI18n must be used inside <I18nProvider>')
  return ctx
}
