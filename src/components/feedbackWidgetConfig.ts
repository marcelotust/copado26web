export const SUPPORT_EMAIL = 'hello@copa26web.app'

export const FEEDBACK_CATEGORIES = ['feature', 'bug', 'comment'] as const

export type FeedbackCategory = (typeof FEEDBACK_CATEGORIES)[number]

export function buildFeedbackMailto(opts: {
  email?: string
  subject: string
  body: string
}): string {
  const params = new URLSearchParams({ subject: opts.subject, body: opts.body })
  return `mailto:${opts.email ?? SUPPORT_EMAIL}?${params.toString()}`
}
