// @ts-nocheck
import { createContext, useContext, useState, useMemo } from 'react'
import en   from './locales/en.json'
import ptBR from './locales/pt-BR.json'
import es   from './locales/es.json'

// Flatten { "conf": { "UEFA": "Europe" } } → { "conf.UEFA": "Europe" }
// Arrays are stored as-is (not flattened)
/** @param {Record<string, any>} obj @param {string} [prefix] @returns {Record<string, any>} */
function flatten(obj, prefix = '') {
  /** @type {Record<string, any>} */
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

/** @type {Record<string, Record<string, any>>} */
const LOCALES = {
  en:      flatten(en),
  'pt-BR': flatten(ptBR),
  es:      flatten(es),
}

// Raw locale data (for arrays like login.features)
const RAW = { en, 'pt-BR': ptBR, es }

// ── Locale detection ──────────────────────────────────────────────────────────

const STORAGE_KEY = 'meualbum2026_locale'

function detectLocale() {
  // Respect user's explicit choice stored in localStorage
  const saved = localStorage.getItem(STORAGE_KEY)
  if (saved && LOCALES[saved]) return saved

  // Check all browser languages, not just the first one
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

const I18nContext = createContext(/** @type {any} */ (null))

export function I18nProvider({ children }) {
  const [locale, setLocaleState] = useState(detectLocale)

  function setLocale(code) {
    localStorage.setItem(STORAGE_KEY, code)
    setLocaleState(code)
  }

  const t = useMemo(() => (/** @type {string} */ key) => {
    return LOCALES[locale]?.[key] ?? LOCALES.en[key] ?? key
  }, [locale])

  // Access raw nested values (e.g. arrays like login.features)
  function tRaw(/** @type {string} */ key) {
    const parts = key.split('.')
    let val = RAW[locale]
    for (const p of parts) val = val?.[p]
    if (val !== undefined) return val
    val = RAW.en
    for (const p of parts) val = val?.[p]
    return val
  }

  return (
    <I18nContext.Provider value={{ locale, setLocale, t, tRaw }}>
      {children}
    </I18nContext.Provider>
  )
}

export function useI18n() {
  return useContext(I18nContext)
}

export const LOCALE_META = {
  'pt-BR': { label: 'PT', flag: '🇧🇷' },
  en:      { label: 'EN', flag: '🇺🇸' },
  es:      { label: 'ES', flag: '🇪🇸' },
}
