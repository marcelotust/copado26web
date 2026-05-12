const STORAGE_KEY = 'meualbum2026_analytics_consent'

export function getAnalyticsConsent() {
  return localStorage.getItem(STORAGE_KEY)
}

/** @param {boolean} granted */
export function setAnalyticsConsent(granted) {
  localStorage.setItem(STORAGE_KEY, granted ? 'granted' : 'denied')
}

export function hasAnalyticsConsent() {
  return getAnalyticsConsent() === 'granted'
}

export function needsAnalyticsConsentPrompt() {
  return getAnalyticsConsent() === null
}
