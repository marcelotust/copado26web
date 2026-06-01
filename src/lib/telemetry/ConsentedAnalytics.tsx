import { Analytics, type BeforeSendEvent } from '@vercel/analytics/react'
import { scrubUrl } from './urlScrub'

/**
 * Single Vercel Analytics mount with a `beforeSend` that scrubs trade
 * payloads, nicknames and Supabase auth tokens out of the URL before any
 * pageview or custom event is dispatched. Wraps `@vercel/analytics/react`
 * so the rule lives in one place and can't be forgotten on a new mount.
 */
function beforeSend(event: BeforeSendEvent): BeforeSendEvent {
  return { ...event, url: scrubUrl(event.url) }
}

export default function ConsentedAnalytics() {
  return <Analytics beforeSend={beforeSend} />
}
