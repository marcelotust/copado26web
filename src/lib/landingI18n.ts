import type { LandingFeature } from '../data/landingContent'

export function landingFeatureKey(feature: LandingFeature, field: 'iconLabel' | 'title' | 'desc' | 'detail'): string {
  return `landing.features.${feature.id}.${field}`
}

export function landingPrivacyKey(id: string, field: 'iconLabel' | 'text'): string {
  return `landing.privacy.items.${id}.${field}`
}

export function landingStatLabelKey(id: string): string {
  return `landing.stats.${id}.label`
}
