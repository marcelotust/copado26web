#!/usr/bin/env node

import { execSync } from 'node:child_process'
import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import checksConfig from '../docs/metricas/checks.mjs'

const args = new Set(process.argv.slice(2))
const dryRun = args.has('--dry-run')
const digestOnly = args.has('--digest-only')
const alertsOnly = args.has('--alerts-only')

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..')

const config = {
  posthogHost: (process.env.POSTHOG_HOST || 'https://us.posthog.com').replace(/\/$/, ''),
  posthogProjectId: process.env.POSTHOG_PROJECT_ID,
  posthogToken: process.env.POSTHOG_PERSONAL_API_KEY ?? process.env.POSTHOG_API_KEY,
  githubRepo: process.env.GITHUB_REPOSITORY,
  githubToken: process.env.GITHUB_TOKEN ?? process.env.GH_TOKEN,
  commitDigest: process.env.POSTHOG_COMMIT_DIGEST === 'true',
  checks: checksConfig,
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : String(err))
  process.exitCode = 1
})

async function main() {
  validateConfig()

  const envClause = buildEnvClause(config.checks.environment)
  const reportDate = yesterdayUtcDate()
  const digestSections = []

  console.log(`PostHog metrics check — report date (UTC): ${reportDate}`)

  if (!alertsOnly) {
    const digest = await buildDigest({ envClause, reportDate })
    digestSections.push(digest.markdown)
    const digestPath = join(repoRoot, 'docs/metricas', `${reportDate}.md`)
    if (dryRun) {
      console.log(`dry-run digest: ${digestPath}`)
    } else {
      await mkdir(dirname(digestPath), { recursive: true })
      await writeFile(digestPath, digest.markdown, 'utf8')
      console.log(`wrote ${digestPath}`)
      if (config.commitDigest) {
        commitDigestFile(digestPath, reportDate)
      }
    }
  }

  if (!digestOnly) {
    await runAlerts({ envClause, reportDate })
  }

  console.log('PostHog metrics check complete')
}

function validateConfig() {
  const missingPosthog = []
  if (!config.posthogProjectId) missingPosthog.push('POSTHOG_PROJECT_ID')
  if (!config.posthogToken) missingPosthog.push('POSTHOG_PERSONAL_API_KEY')
  if (missingPosthog.length) {
    throw new Error(`Missing: ${missingPosthog.join(', ')}`)
  }

  if (!dryRun && !digestOnly) {
    const missingGithub = []
    if (!config.githubRepo) missingGithub.push('GITHUB_REPOSITORY')
    if (!config.githubToken) missingGithub.push('GITHUB_TOKEN')
    if (missingGithub.length) {
      throw new Error(`Missing: ${missingGithub.join(', ')}`)
    }
  }
}

function buildEnvClause(environment) {
  if (environment) {
    const env = escapeSqlLiteral(environment)
    return `AND (properties.$environment = '${env}' OR properties.environment = '${env}')`
  }
  return `AND (
    properties.$host IS NULL
    OR (
      properties.$host NOT LIKE '%localhost%'
      AND properties.$host NOT LIKE '%127.0.0.1%'
    )
  )`
}

function escapeSqlLiteral(value) {
  return String(value).replace(/'/g, "''")
}

async function runAlerts({ envClause, reportDate }) {
  const { minSample, activationDays, alerts } = config.checks
  let created = 0
  let updated = 0
  let skipped = 0
  let ok = 0

  for (const alert of alerts) {
    const metrics = await fetchAlertMetrics(alert.id, { envClause, activationDays })
    const sample = Number(metrics[alert.minSampleKey] ?? 0)
    const rate = Number(metrics.rate ?? 0)

    if (sample < minSample) {
      skipped += 1
      console.log(`skip ${alert.id}: sample ${sample} < minSample ${minSample}`)
      continue
    }

    const passed = rate >= alert.min
    if (passed) {
      ok += 1
      console.log(`ok ${alert.id}: ${formatPct(rate)} (min ${formatPct(alert.min)}, n=${sample})`)
      continue
    }

    const issuePayload = buildAlertIssue(alert, { rate, sample, metrics, reportDate })
    if (dryRun) {
      console.log(`dry-run alert: ${issuePayload.title}`)
      continue
    }

    const existing = await findGitHubIssue(alert.id)
    if (existing) {
      await commentGitHubIssue(existing.number, buildAlertComment(alert, { rate, sample, metrics, reportDate }))
      updated += 1
      console.log(`updated ${alert.id}: #${existing.number}`)
    } else {
      await ensureLabels(issuePayload.labels)
      const createdIssue = await createGitHubIssue(issuePayload)
      created += 1
      console.log(`created ${alert.id}: #${createdIssue.number}`)
    }
  }

  console.log(`Alerts: ok=${ok} created=${created} updated=${updated} skipped=${skipped}`)
}

async function fetchAlertMetrics(alertId, { envClause, activationDays }) {
  if (alertId === 'activation_rate') {
    const row = await hogqlOneRow(`
      SELECT
        uniqExactIf(person_id, event = 'auth_signed_in') AS signups,
        uniqExactIf(
          person_id,
          event = 'sticker_quantity_changed'
            AND (
              properties.is_first_sticker_change = true
              OR properties.is_first_sticker_change = 'true'
            )
        ) AS activated
      FROM events
      WHERE timestamp >= now() - INTERVAL ${activationDays} DAY
        ${envClause}
    `, 'activation_rate_7d')
    const signups = Number(row.signups ?? 0)
    const activated = Number(row.activated ?? 0)
    return {
      signups,
      activated,
      rate: signups > 0 ? activated / signups : 0,
    }
  }

  if (alertId === 'd1_retention') {
    const row = await hogqlOneRow(`
      WITH
        cohort AS (
          SELECT DISTINCT person_id
          FROM events
          WHERE event = 'auth_signed_in'
            AND toDate(timestamp) = toDate(now() - INTERVAL 1 DAY)
            ${envClause}
        ),
        returned AS (
          SELECT DISTINCT e.person_id
          FROM events e
          INNER JOIN cohort c ON e.person_id = c.person_id
          WHERE toDate(e.timestamp) = toDate(now())
            AND e.event NOT LIKE '$%'
            ${envClause}
        )
      SELECT
        (SELECT count() FROM cohort) AS cohort_size,
        (SELECT count() FROM returned) AS returned_users
    `, 'd1_retention')
    const cohortSize = Number(row.cohort_size ?? 0)
    const returned = Number(row.returned_users ?? 0)
    return {
      cohort_size: cohortSize,
      returned_users: returned,
      rate: cohortSize > 0 ? returned / cohortSize : 0,
    }
  }

  if (alertId === 'd7_retention') {
    const row = await hogqlOneRow(`
      WITH
        cohort AS (
          SELECT DISTINCT person_id
          FROM events
          WHERE event = 'auth_signed_in'
            AND toDate(timestamp) = toDate(now() - INTERVAL 8 DAY)
            ${envClause}
        ),
        returned AS (
          SELECT DISTINCT e.person_id
          FROM events e
          INNER JOIN cohort c ON e.person_id = c.person_id
          WHERE toDate(e.timestamp) >= toDate(now() - INTERVAL 7 DAY)
            AND toDate(e.timestamp) <= toDate(now() - INTERVAL 1 DAY)
            AND e.event NOT LIKE '$%'
            ${envClause}
        )
      SELECT
        (SELECT count() FROM cohort) AS cohort_size,
        (SELECT count() FROM returned) AS returned_users
    `, 'd7_retention')
    const cohortSize = Number(row.cohort_size ?? 0)
    const returned = Number(row.returned_users ?? 0)
    return {
      cohort_size: cohortSize,
      returned_users: returned,
      rate: cohortSize > 0 ? returned / cohortSize : 0,
    }
  }

  throw new Error(`Unknown alert id: ${alertId}`)
}

async function buildDigest({ envClause, reportDate }) {
  const { digest } = config.checks
  const dateFilter = `AND toDate(timestamp) = toDate(now() - INTERVAL 1 DAY)`

  const tabs = await hogqlRows(`
    SELECT
      coalesce(properties.tab, '(unknown)') AS tab,
      uniqExact(person_id) AS users,
      count() AS events
    FROM events
    WHERE event = 'nav_tab_selected'
      ${dateFilter}
      ${envClause}
    GROUP BY tab
    ORDER BY users DESC
    LIMIT ${digest.topTabsLimit}
  `, 'digest_top_tabs')

  const featureList = digest.featureEvents.map((e) => `'${escapeSqlLiteral(e)}'`).join(', ')
  const features = await hogqlRows(`
    SELECT
      event,
      uniqExact(person_id) AS users,
      count() AS events
    FROM events
    WHERE event IN (${featureList})
      ${dateFilter}
      ${envClause}
    GROUP BY event
    ORDER BY users DESC
    LIMIT ${digest.topFeaturesLimit}
  `, 'digest_top_features')

  const challenges = await hogqlRows(`
    SELECT
      coalesce(properties.challenge_id, '(unknown)') AS challenge_id,
      coalesce(properties.difficulty, '(unknown)') AS difficulty,
      uniqExact(person_id) AS users,
      count() AS events
    FROM events
    WHERE event = 'challenge_completed'
      ${dateFilter}
      ${envClause}
    GROUP BY challenge_id, difficulty
    ORDER BY users DESC
    LIMIT ${digest.topChallengesLimit}
  `, 'digest_top_challenges')

  const churnList = digest.churnEvents.map((e) => `'${escapeSqlLiteral(e)}'`).join(', ')
  const churn = await hogqlRows(`
    SELECT
      event,
      uniqExact(person_id) AS users,
      count() AS events
    FROM events
    WHERE event IN (${churnList})
      ${dateFilter}
      ${envClause}
    GROUP BY event
    ORDER BY events DESC
  `, 'digest_churn')

  const signins = await hogqlOneRow(`
    SELECT uniqExact(person_id) AS users
    FROM events
    WHERE event = 'auth_signed_in'
      ${dateFilter}
      ${envClause}
  `, 'digest_signins')

  const lines = [
    `# Métricas de produto — ${reportDate}`,
    '',
    `_Gerado automaticamente por \`npm run posthog:metrics-check\`. Apenas usuários com consentimento de analytics._`,
    '',
    `## Resumo (${reportDate}, UTC)`,
    '',
    `- Logins (\`auth_signed_in\`): **${signins.users ?? 0}** usuários únicos`,
    '',
    '## Abas mais usadas (`nav_tab_selected`)',
    '',
    formatTable(['Aba', 'Usuários', 'Eventos'], tabs, ['tab', 'users', 'events']),
    '',
    '## Features / eventos (ranking do dia)',
    '',
    formatTable(['Evento', 'Usuários', 'Eventos'], features, ['event', 'users', 'events']),
    '',
    '## Challenges completados',
    '',
    formatTable(
      ['Challenge', 'Dificuldade', 'Usuários', 'Eventos'],
      challenges,
      ['challenge_id', 'difficulty', 'users', 'events'],
    ),
    '',
    '## Sinais de churn',
    '',
    formatTable(['Evento', 'Usuários', 'Eventos'], churn, ['event', 'users', 'events']),
    '',
    '## Alertas configurados',
    '',
    'Ver limiares em `docs/metricas/checks.mjs`. Issues abertas com label `metrics`.',
    '',
    '## Referências',
    '',
    '- `docs/mvp-activation-retention.md`',
    '- `src/lib/telemetry/events.ts`',
    '',
    '<!-- posthog-metrics-digest -->',
  ]

  return { markdown: lines.join('\n') }
}

function formatTable(headers, rows, keys) {
  if (!rows.length) return '_Sem dados no período._\n'
  const head = `| ${headers.join(' | ')} |`
  const sep = `| ${headers.map(() => '---').join(' | ')} |`
  const body = rows.map((row) => {
    const cells = keys.map((key) => String(row[key] ?? 0))
    return `| ${cells.join(' | ')} |`
  })
  return [head, sep, ...body].join('\n') + '\n'
}

function buildAlertIssue(alert, { rate, sample, metrics, reportDate }) {
  const title = truncate(`[Metrics][${alert.severity}] ${alert.name}: ${formatPct(rate)}`, 120)
  const body = buildAlertBody(alert, { rate, sample, metrics, reportDate, intro: true })
  return {
    title,
    body,
    labels: [...alert.labels, `severity:${alert.severity}`, `area:${alert.area}`],
  }
}

function buildAlertComment(alert, ctx) {
  return buildAlertBody(alert, { ...ctx, intro: false })
}

function buildAlertBody(alert, { rate, sample, metrics, reportDate, intro }) {
  const lines = [
    intro ? '## Métrica abaixo do limiar' : '## Atualização automática',
    '',
    `- Check ID: \`${alert.id}\``,
    `- Data do relatório: ${reportDate} (UTC)`,
    `- Valor: **${formatPct(rate)}** (limiar: ≥ ${formatPct(alert.min)})`,
    `- Amostra: ${sample}`,
    `- Detalhes: \`${JSON.stringify(metrics)}\``,
    '',
    '## Definição',
    '',
    `Ver \`${alert.doc}\`.`,
    '',
    '## Nota LGPD',
    '',
    'Métricas incluem apenas usuários que aceitaram analytics.',
    '',
    '<!-- posthog-metrics-managed -->',
    `<!-- metrics-check-id:${alert.id} -->`,
    `<!-- metrics-period:${reportDate} -->`,
  ]
  return lines.join('\n')
}

async function hogqlOneRow(query, name) {
  const rows = await hogqlRows(query, name)
  return rows[0] ?? {}
}

async function hogqlRows(query, name) {
  const normalized = query.replace(/\s+/g, ' ').trim()
  const payload = await posthogQuery(normalized, name)
  const columns = payload.columns ?? []
  const results = payload.results ?? []
  return results.map((row) => {
    const out = {}
    columns.forEach((col, index) => {
      out[col] = row[index]
    })
    return out
  })
}

async function posthogQuery(query, name) {
  const url = `${config.posthogHost}/api/projects/${config.posthogProjectId}/query/`
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${config.posthogToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name,
      refresh: 'force_blocking',
      query: {
        kind: 'HogQLQuery',
        query,
      },
    }),
  })

  const text = await response.text()
  let payload = {}
  try {
    payload = text ? JSON.parse(text) : {}
  } catch {
    throw new Error(`PostHog ${name}: invalid JSON (${response.status})`)
  }

  if (!response.ok) {
    const detail = payload.detail ?? payload.type ?? text.slice(0, 200)
    throw new Error(`PostHog ${name} failed (${response.status}): ${detail}`)
  }

  if (payload.query_status && payload.query_status.complete === false) {
    throw new Error(`PostHog ${name}: query still running (async not supported here)`)
  }

  return payload
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
  const text = await response.text()
  const payload = text ? JSON.parse(text) : {}
  if (!response.ok) {
    const message = payload.message ? `: ${payload.message}` : ''
    throw new Error(`GitHub ${path} failed (${response.status})${message}`)
  }
  return payload
}

async function findGitHubIssue(checkId) {
  const query = new URLSearchParams({
    q: `repo:${config.githubRepo} is:issue is:open in:body "metrics-check-id:${checkId}"`,
  })
  const result = await githubFetch(`/search/issues?${query}`)
  return result.items?.[0] ?? null
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
      : name === 'metrics'
        ? '0e8a16'
        : name === 'product'
          ? '1d76db'
          : 'cfd3d7'

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

async function commentGitHubIssue(number, body) {
  await githubFetch(`/repos/${config.githubRepo}/issues/${number}/comments`, {
    method: 'POST',
    body: JSON.stringify({ body }),
  })
}

function commitDigestFile(digestPath, reportDate) {
  const relative = digestPath.replace(`${repoRoot}/`, '')
  execSync('git config user.name "github-actions[bot]"', { cwd: repoRoot })
  execSync('git config user.email "41898282+github-actions[bot]@users.noreply.github.com"', { cwd: repoRoot })
  execSync(`git add "${relative}"`, { cwd: repoRoot })
  try {
    execSync(`git commit -m "chore(metrics): daily PostHog digest ${reportDate}"`, {
      cwd: repoRoot,
      stdio: 'inherit',
    })
    execSync('git push', { cwd: repoRoot, stdio: 'inherit' })
  } catch (err) {
    if (/nothing to commit/i.test(String(err.stderr ?? err.stdout ?? err.message))) {
      console.log('digest unchanged, skip commit')
      return
    }
    throw err
  }
}

function yesterdayUtcDate() {
  const d = new Date()
  d.setUTCDate(d.getUTCDate() - 1)
  return d.toISOString().slice(0, 10)
}

function formatPct(value) {
  return `${(Number(value) * 100).toFixed(1)}%`
}

function truncate(value, maxLength) {
  if (value.length <= maxLength) return value
  return `${value.slice(0, maxLength - 1)}...`
}
