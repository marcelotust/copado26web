import { createContext, useContext, useState, useMemo, type ReactNode } from 'react'
import en   from './locales/en.json'
import ptBR from './locales/pt-BR.json'
import es   from './locales/es.json'

export type Locale = 'en' | 'pt-BR' | 'es'

type LocaleData = Record<string, unknown>
type FlatLocale  = Record<string, string>

// Flatten { "conf": { "UEFA": "Europe" } } → { "conf.UEFA": "Europe" }
// Arrays and primitives are stored as-is (arrays aren't flattened).
function flatten(obj: LocaleData, prefix = ''): FlatLocale {
  const acc: FlatLocale = {}
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key
    if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      Object.assign(acc, flatten(value as LocaleData, fullKey))
    } else if (typeof value === 'string') {
      acc[fullKey] = value
    }
  }
  return acc
}

const LOCALES: Record<Locale, FlatLocale> = {
  en:      flatten(en   as LocaleData),
  'pt-BR': flatten(ptBR as LocaleData),
  es:      flatten(es   as LocaleData),
}

const RAW: Record<Locale, LocaleData> = {
  en:      en   as LocaleData,
  'pt-BR': ptBR as LocaleData,
  es:      es   as LocaleData,
}

// ── Locale detection ──────────────────────────────────────────────────────────

const STORAGE_KEY = 'meualbum2026_locale'

function isLocale(value: string): value is Locale {
  return value === 'en' || value === 'pt-BR' || value === 'es'
}

function detectLocale(): Locale {
  const saved = localStorage.getItem(STORAGE_KEY)
  if (saved && isLocale(saved)) return saved

  const langs = navigator.languages?.length ? navigator.languages : [navigator.language || '']
  for (const lang of langs) {
    const l = lang.toLowerCase()
    if (l.startsWith('pt')) return 'pt-BR'
    if (l.startsWith('es')) return 'es'
    if (l.startsWith('en')) return 'en'
  }
  return 'pt-BR'
}

// ── Context ───────────────────────────────────────────────────────────────────

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
    localStorage.setItem(STORAGE_KEY, code)
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

export const LOCALE_META: Record<Locale, { label: string; flag: string }> = {
  'pt-BR': { label: 'PT', flag: '🇧🇷' },
  en:      { label: 'EN', flag: '🇺🇸' },
  es:      { label: 'ES', flag: '🇪🇸' },
}
