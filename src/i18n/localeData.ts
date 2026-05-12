// Locale data + helpers. Kept separate from the React provider so the
// flattening + detection logic stays testable and the provider file stays
// focused on context wiring.

import en   from './locales/en.json'
import ptBR from './locales/pt-BR.json'
import es   from './locales/es.json'

export type Locale = 'en' | 'pt-BR' | 'es'

type LocaleData = Record<string, unknown>
type FlatLocale = Record<string, string>

// { "conf": { "UEFA": "Europe" } } → { "conf.UEFA": "Europe" }
// Arrays are left intact for `tRaw`; primitives become flat string keys.
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

export const LOCALES: Record<Locale, FlatLocale> = {
  en:      flatten(en   as LocaleData),
  'pt-BR': flatten(ptBR as LocaleData),
  es:      flatten(es   as LocaleData),
}

export const RAW: Record<Locale, LocaleData> = {
  en:      en   as LocaleData,
  'pt-BR': ptBR as LocaleData,
  es:      es   as LocaleData,
}

export const LOCALE_META: Record<Locale, { label: string; flag: string }> = {
  'pt-BR': { label: 'PT', flag: '🇧🇷' },
  en:      { label: 'EN', flag: '🇺🇸' },
  es:      { label: 'ES', flag: '🇪🇸' },
}

const STORAGE_KEY = 'meualbum2026_locale'

export function isLocale(value: string): value is Locale {
  return value === 'en' || value === 'pt-BR' || value === 'es'
}

export function detectLocale(): Locale {
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

export function persistLocale(code: Locale): void {
  localStorage.setItem(STORAGE_KEY, code)
}
