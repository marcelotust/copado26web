/**
 * PostHog product metrics checks — edit thresholds here.
 * Definitions: docs/mvp-activation-retention.md
 * Events: src/lib/telemetry/events.ts
 */
export default {
  /** PostHog $environment filter; null = excluir só localhost (SPA pode não setar $environment) */
  environment: null,
  /** Skip alert checks when cohort/signups below this (low traffic) */
  minSample: 5,
  /** Rolling window for activation rate */
  activationDays: 7,

  alerts: [
    {
      id: 'activation_rate',
      name: 'Taxa de ativação (login → primeira figurinha)',
      severity: 'P2',
      area: 'activation',
      labels: ['metrics', 'product', 'activation'],
      min: 0.15,
      minSampleKey: 'signups',
      doc: 'docs/mvp-activation-retention.md',
    },
    {
      id: 'd1_retention',
      name: 'Retorno D1 (cohort de ontem)',
      severity: 'P1',
      area: 'retention',
      labels: ['metrics', 'product', 'retention'],
      min: 0.1,
      minSampleKey: 'cohort_size',
      doc: 'docs/mvp-activation-retention.md',
    },
    {
      id: 'd7_retention',
      name: 'Retorno D7 (cohort de 8 dias atrás)',
      severity: 'P2',
      area: 'retention',
      labels: ['metrics', 'product', 'retention'],
      min: 0.05,
      minSampleKey: 'cohort_size',
      doc: 'docs/mvp-activation-retention.md',
    },
  ],

  digest: {
    /** Report covers the previous UTC calendar day */
    featureEvents: [
      'nav_tab_selected',
      'sticker_quantity_changed',
      'stickers_shared',
      'milestone_shared',
      'challenge_completed',
      'trade_link_generated',
      'trade_link_copied',
      'trade_match_viewed',
      'export_csv_completed',
      'onboarding_completed',
    ],
    churnEvents: ['reset_album_confirmed', 'auth_signed_out'],
    topTabsLimit: 8,
    topFeaturesLimit: 12,
    topChallengesLimit: 15,
  },
}
