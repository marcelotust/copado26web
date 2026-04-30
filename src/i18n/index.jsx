import { createContext, useContext, useState, useMemo } from 'react'
import en    from './locales/en.json'
import ptBR  from './locales/pt-BR.json'
import es    from './locales/es.json'

// Flatten { "conf": { "UEFA": "Europe" } } → { "conf.UEFA": "Europe" }
/** @param {Record<string, any>} obj @param {string} [prefix] @returns {Record<string, string>} */
function flatten(obj, prefix = '') {
  /** @type {Record<string, string>} */
  const acc = {}
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key
    if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      Object.assign(acc, flatten(value, fullKey))
    } else {
      acc[fullKey] = value
    }
  }
  return acc
}

/** @type {Record<string, Record<string, string>>} */
const LOCALES = {
  en:     flatten(en),
  'pt-BR': flatten(ptBR),
  es:     flatten(es),
}

// ── Locale detection ──────────────────────────────────────────────────────────

export function detectLocale() {
  const lang = (navigator.languages?.[0] || navigator.language || 'en').toLowerCase()
  if (lang.startsWith('pt')) return 'pt-BR'
  if (lang.startsWith('es')) return 'es'
  return 'en'
}

// ── Context ───────────────────────────────────────────────────────────────────

const I18nContext = createContext(/** @type {any} */ (null))

export function I18nProvider({ children }) {
  const [locale, setLocale] = useState(detectLocale)

  const t = useMemo(() => (/** @type {string} */ key) => {
    return LOCALES[locale]?.[key] ?? LOCALES.en[key] ?? key
  }, [locale])

  return (
    <I18nContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </I18nContext.Provider>
  )
}

export function useI18n() {
  return useContext(I18nContext)
}

export const LOCALE_META = {
  en:      { label: 'EN', flag: '🇺🇸' },
  'pt-BR': { label: 'PT', flag: '🇧🇷' },
  es:      { label: 'ES', flag: '🇪🇸' },
}
