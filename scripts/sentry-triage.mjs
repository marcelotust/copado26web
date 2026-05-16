#!/usr/bin/env node

const args = new Set(process.argv.slice(2))
const dryRun = args.has('--dry-run')

const config = {
  sentryApiBase: process.env.SENTRY_API_BASE ?? 'https://sentry.io/api/0',
  sentryOrg: process.env.SENTRY_ORG,
  sentryProject: process.env.SENTRY_PROJECT,
  sentryToken: process.env.SENTRY_AUTH_TOKEN,
  sentryQuery: process.env.SENTRY_QUERY ?? 'is:unresolved environment:production',
  sentryStatsPeriod: process.env.SENTRY_STATS_PERIOD ?? '24h',
  sentryIssueLimit: Number(process.env.SENTRY_ISSUE_LIMIT ?? 50),
  minSeverity: process.env.SENTRY_MIN_SEVERITY ?? 'P2',
  githubRepo: process.env.GITHUB_REPOSITORY,
  githubToken: process.env.GITHUB_TOKEN ?? process.env.GH_TOKEN,
}

const severityRank = { P0: 0, P1: 1, P2: 2, P3: 3 }

const noisePatterns = [
  /localhost/i,
  /127\.0\.0\.1/i,
  /@vite\/client/i,
  /@react-refresh/i,
  /Failed to fetch dynamically imported module: http:\/\/(localhost|127\.0\.0\.1)/i,
  /text\/html.*valid JavaScript MIME type/i,
]

const transientPatterns = [
  /socket closed/i,
  /heartbeat timeout/i,
  /channel error: transport failure/i,
  /InvalidJWTToken: Token has expired/i,
]

const areaRules = [
  [/src\/hooks\/useAuth|auth/i, 'auth'],
  [/src\/state\/useStickers|src\/state\/Stickers|stickers|album/i, 'album'],
  [/src\/components\/Settings|settings/i, 'settings'],
  [/src\/i18n|I18n/i, 'i18n'],
  [/src\/lib\/supabase|Supabase|InvalidJWTToken/i, 'supabase'],
  [/src\/lib\/telemetry|sentry|posthog/i, 'observability'],
]

main().catch((err) => {
  console.error(err instanceof Error ? err.message : String(err))
  process.exitCode = 1
})

async function main() {
  validateConfig()

  const issues = await listSentryIssues()
  console.log(`Found ${issues.length} unresolved Sentry issues for ${config.sentryOrg}/${config.sentryProject}`)

  let created = 0
  let existing = 0
  let ignored = 0

  for (const issue of issues) {
    const latestEvent = await getLatestSentryEvent(issue.id)
    const triage = classify(issue, latestEvent)

    if (triage.ignore) {
      ignored += 1
      console.log(`ignore ${issue.shortId ?? issue.id}: ${triage.reason}`)
      continue
    }

    if (!isAtLeastSeverity(triage.severity, config.minSeverity)) {
      ignored += 1
      console.log(`ignore ${issue.shortId ?? issue.id}: below ${config.minSeverity} (${triage.severity})`)
      continue
    }

    const existingIssue = dryRun ? null : await findGitHubIssue(issue.id)
    if (existingIssue) {
      existing += 1
      console.log(`exists ${issue.shortId ?? issue.id}: #${existingIssue.number}`)
      continue
    }

    const githubIssue = buildGitHubIssue(issue, latestEvent, triage)
    if (dryRun) {
      console.log(`dry-run create: ${githubIssue.title}`)
      continue
    }

    await ensureLabels(githubIssue.labels)
    const createdIssue = await createGitHubIssue(githubIssue)
    created += 1
    console.log(`created ${issue.shortId ?? issue.id}: #${createdIssue.number}`)
  }

  console.log(`Sentry triage complete: created=${created} existing=${existing} ignored=${ignored}`)
}

function validateConfig() {
  const required = ['sentryOrg', 'sentryProject', 'sentryToken']
  if (!dryRun) required.push('githubRepo', 'githubToken')

  const missing = required
    .filter((key) => !config[key])
    .map(envNameForConfigKey)

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`)
  }

  if (!(config.minSeverity in severityRank)) {
    throw new Error(`Invalid SENTRY_MIN_SEVERITY: ${config.minSeverity}`)
  }
}

async function listSentryIssues() {
  const params = new URLSearchParams({
    query: config.sentryQuery,
    statsPeriod: config.sentryStatsPeriod,
    limit: String(config.sentryIssueLimit),
  })
  return sentryFetch(`/projects/${config.sentryOrg}/${config.sentryProject}/issues/?${params}`)
}

async function getLatestSentryEvent(issueId) {
  try {
    return await sentryFetch(`/organizations/${config.sentryOrg}/issues/${issueId}/events/latest/`)
  } catch (err) {
    console.warn(`Could not fetch latest event for ${issueId}: ${err.message}`)
    return null
  }
}

async function sentryFetch(path) {
  const response = await fetch(`${config.sentryApiBase}${path}`, {
    headers: {
      Authorization: `Bearer ${config.sentryToken}`,
      Accept: 'application/json',
    },
  })
  return parseJsonResponse(response, `Sentry ${path}`)
}

async function githubFetch(path, options = {}) {
  const response = await fetch(`https://api.github.com${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${config.githubToken}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      ...(options.headers ?? {}),
    },
  })
  return parseJsonResponse(response, `GitHub ${path}`)
}

async function parseJsonResponse(response, label) {
  const text = await response.text()
  const payload = text ? JSON.parse(text) : {}
  if (!response.ok) {
    const message = payload.message ? `: ${payload.message}` : ''
    throw new Error(`${label} failed (${response.status})${message}`)
  }
  return payload
}

function classify(issue, latestEvent) {
  const title = issue.title ?? ''
  const eventText = eventSearchText(latestEvent)
  const combined = `${title}\n${eventText}`

  if (noisePatterns.some((pattern) => pattern.test(combined))) {
    return { ignore: true, reason: 'local dev/HMR noise' }
  }

  if (transientPatterns.some((pattern) => pattern.test(combined))) {
    return { ignore: true, reason: 'transient realtime/auth transport noise' }
  }

  const count = Number(issue.count ?? 0)
  const userCount = Number(issue.userCount ?? 0)
  const level = String(issue.level ?? '').toLowerCase()
  const severity = severityFor({ count, userCount, level })
  const area = detectArea(combined)

  return {
    ignore: false,
    severity,
    area,
    reason: `${count} events across ${userCount} users`,
  }
}

function severityFor({ count, userCount, level }) {
  if (level === 'fatal') return 'P0'
  if (userCount >= 10 || count >= 100) return 'P0'
  if (userCount >= 3 || count >= 10) return 'P1'
  if (userCount >= 2 || count >= 2) return 'P2'
  return 'P3'
}

function isAtLeastSeverity(actual, minimum) {
  return severityRank[actual] <= severityRank[minimum]
}

function detectArea(text) {
  const match = areaRules.find(([pattern]) => pattern.test(text))
  return match?.[1] ?? 'frontend'
}

function eventSearchText(event) {
  if (!event) return ''
  const frames = inAppFrames(event)
  const breadcrumbs = event.entries
    ?.find((entry) => entry.type === 'breadcrumbs')
    ?.data
    ?.values
    ?.slice(-5)
    ?.map((crumb) => `${crumb.category ?? ''} ${crumb.message ?? ''}`)
    ?.join('\n') ?? ''

  return [
    event.title,
    event.message,
    event.environment,
    frames.map(formatFrame).join('\n'),
    breadcrumbs,
  ].filter(Boolean).join('\n')
}

function inAppFrames(event) {
  const exception = event?.entries
    ?.find((entry) => entry.type === 'exception')
    ?.data
    ?.values
    ?.[0]
  const frames = exception?.stacktrace?.frames ?? []
  return frames.filter((frame) => {
    const path = frame.filename ?? frame.absPath ?? ''
    return frame.inApp || path.includes('/src/')
  }).slice(-8)
}

function formatFrame(frame) {
  const path = frame.filename ?? frame.absPath ?? '?'
  return `at ${frame.function ?? '?'} ${path}:${frame.lineNo ?? '?'}:${frame.colNo ?? '?'}`
}

function buildGitHubIssue(issue, latestEvent, triage) {
  const title = truncate(`[Sentry][${triage.severity}] ${issue.shortId ?? issue.id}: ${issue.title}`, 120)
  const sentryUrl = sentryIssueUrl(issue)
  const stack = inAppFrames(latestEvent).map(formatFrame).join('\n') || 'No in-app stack frames found.'
  const body = [
    '## Sentry',
    '',
    `- Sentry Issue ID: ${issue.id}`,
    `- Short ID: ${issue.shortId ?? 'n/a'}`,
    `- Severity: ${triage.severity}`,
    `- Area: ${triage.area}`,
    `- Level: ${issue.level ?? 'n/a'}`,
    `- Events: ${issue.count ?? 0}`,
    `- Users: ${issue.userCount ?? 0}`,
    `- First seen: ${issue.firstSeen ?? 'n/a'}`,
    `- Last seen: ${issue.lastSeen ?? 'n/a'}`,
    `- Link: ${sentryUrl}`,
    '',
    '## Latest In-App Stack',
    '',
    '```text',
    stack,
    '```',
    '',
    '## Initial Triage',
    '',
    `This issue passed the automated threshold (${triage.reason}) and was not classified as local development or transient transport noise.`,
    '',
    '<!-- sentry-triage-managed -->',
    `<!-- sentry-issue-id:${issue.id} -->`,
  ].join('\n')

  return {
    title,
    body,
    labels: ['sentry', 'bug', `severity:${triage.severity}`, `area:${triage.area}`],
  }
}

function sentryIssueUrl(issue) {
  const projectId = issue.project?.id
  const params = projectId ? `?project=${projectId}` : ''
  return `https://sentry.io/organizations/${config.sentryOrg}/issues/${issue.id}/${params}`
}

async function findGitHubIssue(sentryIssueId) {
  const query = new URLSearchParams({
    q: `repo:${config.githubRepo} is:issue is:open in:body "sentry-issue-id:${sentryIssueId}"`,
  })
  const result = await githubFetch(`/search/issues?${query}`)
  return result.items?.[0] ?? null
}

function envNameForConfigKey(key) {
  return {
    sentryOrg: 'SENTRY_ORG',
    sentryProject: 'SENTRY_PROJECT',
    sentryToken: 'SENTRY_AUTH_TOKEN',
    githubRepo: 'GITHUB_REPOSITORY',
    githubToken: 'GITHUB_TOKEN',
  }[key] ?? key.replace(/[A-Z]/g, (char) => `_${char}`).toUpperCase()
}

async function ensureLabels(labels) {
  for (const label of labels) {
    try {
      await githubFetch(`/repos/${config.githubRepo}/labels/${encodeURIComponent(label)}`)
    } catch {
      await createLabel(label)
    }
  }
}

async function createLabel(name) {
  const color = name.startsWith('severity:')
    ? severityColor(name.split(':')[1])
    : name.startsWith('area:')
      ? 'bfd4f2'
      : name === 'sentry'
        ? '362d59'
        : 'd73a4a'

  try {
    await githubFetch(`/repos/${config.githubRepo}/labels`, {
      method: 'POST',
      body: JSON.stringify({ name, color }),
    })
  } catch (err) {
    if (!/already_exists|already exists|Validation Failed/i.test(err.message)) throw err
  }
}

function severityColor(severity) {
  if (severity === 'P0') return 'b60205'
  if (severity === 'P1') return 'd93f0b'
  if (severity === 'P2') return 'fbca04'
  return 'cfd3d7'
}

async function createGitHubIssue(issue) {
  return githubFetch(`/repos/${config.githubRepo}/issues`, {
    method: 'POST',
    body: JSON.stringify(issue),
  })
}

function truncate(value, maxLength) {
  if (value.length <= maxLength) return value
  return `${value.slice(0, maxLength - 1)}...`
}
