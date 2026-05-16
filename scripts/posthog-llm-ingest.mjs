#!/usr/bin/env node
/**
 * Manual ingest of Claude Code session logs into PostHog LLM Analytics.
 * Delegates parsing/sending to the PostHog Claude Code plugin (Python).
 *
 * Env (ingest — project API key, not the personal key used by posthog-metrics-check):
 *   POSTHOG_API_KEY          — phc_* project key (falls back to VITE_POSTHOG_KEY / .env.local)
 *   POSTHOG_HOST             — ingest host (default https://us.i.posthog.com)
 *   POSTHOG_LLMA_PRIVACY_MODE — true to redact prompt/tool content
 *
 * Verify/query (same as scripts/posthog-metrics-check.mjs):
 *   POSTHOG_PERSONAL_API_KEY, POSTHOG_PROJECT_ID, POSTHOG_HOST (API host)
 */

import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { homedir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..')
const STATUS_FILE = join(homedir(), '.claude', 'posthog-llma-status.json')
const args = process.argv.slice(2)

main()

function main() {
  try {
    if (args[0] === '--status') {
      printStatus()
      return
    }
    if (args[0] === '--check-env') {
      printEnvCheck()
      return
    }

    applyIngestEnv()
    const ingestScript = resolvePluginIngestScript()
    if (!ingestScript) {
      console.error(
        'PostHog Claude Code plugin not found. Install with: claude plugin install posthog',
      )
      process.exitCode = 1
      return
    }

    if (!process.env.POSTHOG_API_KEY) {
      console.error(
        'POSTHOG_API_KEY is required (same phc_* key as VITE_POSTHOG_KEY — see docs/claude-code-llm-analytics.md)',
      )
      process.exitCode = 1
      return
    }

    execFileSync('python3', [ingestScript, ...args], {
      stdio: 'inherit',
      cwd: repoRoot,
      env: process.env,
    })
  } catch (err) {
    console.error(err instanceof Error ? err.message : String(err))
    process.exitCode = 1
  }
}

function applyIngestEnv() {
  loadDotenvLocal()

  if (!process.env.POSTHOG_API_KEY) {
    const key = process.env.VITE_POSTHOG_KEY ?? readEnvLocal('VITE_POSTHOG_KEY')
    if (key) process.env.POSTHOG_API_KEY = key
  }

  if (!process.env.POSTHOG_HOST) {
    const host = process.env.VITE_POSTHOG_HOST ?? readEnvLocal('VITE_POSTHOG_HOST')
    if (host) process.env.POSTHOG_HOST = host
  }

  if (!process.env.POSTHOG_HOST) {
    process.env.POSTHOG_HOST = 'https://us.i.posthog.com'
  }
}

function loadDotenvLocal() {
  const path = join(repoRoot, '.env.local')
  if (!existsSync(path)) return
  const text = readFileSync(path, 'utf8')
  for (const line of text.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq === -1) continue
    const key = trimmed.slice(0, eq).trim()
    const value = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, '')
    if (key && process.env[key] === undefined) {
      process.env[key] = value
    }
  }
}

function readEnvLocal(key) {
  const path = join(repoRoot, '.env.local')
  if (!existsSync(path)) return undefined
  const match = readFileSync(path, 'utf8').match(new RegExp(`^${key}=(.*)$`, 'm'))
  if (!match) return undefined
  return match[1].trim().replace(/^["']|["']$/g, '')
}

function resolvePluginIngestScript() {
  const installed = join(homedir(), '.claude', 'plugins', 'installed_plugins.json')
  if (existsSync(installed)) {
    try {
      const data = JSON.parse(readFileSync(installed, 'utf8'))
      const entries = data?.plugins?.['posthog@claude-plugins-official']
      const installPath = Array.isArray(entries) ? entries[0]?.installPath : undefined
      if (installPath) {
        const script = join(installPath, 'scripts', 'llma_cc_ingest.py')
        if (existsSync(script)) return script
      }
    } catch {
      // fall through to cache scan
    }
  }

  const cacheRoot = join(
    homedir(),
    '.claude',
    'plugins',
    'cache',
    'claude-plugins-official',
    'posthog',
  )
  if (!existsSync(cacheRoot)) return null

  const versions = readdirSync(cacheRoot)
    .filter((name) => existsSync(join(cacheRoot, name, 'scripts', 'llma_cc_ingest.py')))
    .sort()
  if (versions.length === 0) return null
  return join(cacheRoot, versions[versions.length - 1], 'scripts', 'llma_cc_ingest.py')
}

function printStatus() {
  if (!existsSync(STATUS_FILE)) {
    console.log('No ingestion status file yet (~/.claude/posthog-llma-status.json).')
    console.log('Run a Claude Code session with POSTHOG_LLMA_CC_ENABLED=true, or:')
    console.log('  npm run posthog:llm-ingest')
    return
  }

  try {
    const status = JSON.parse(readFileSync(STATUS_FILE, 'utf8'))
    console.log(JSON.stringify(status, null, 2))
    if (status.status === 'ok') {
      console.log('\nIngestion live — last send succeeded.')
    } else if (status.status === 'error') {
      console.log('\nLast send failed — check POSTHOG_API_KEY and POSTHOG_HOST.')
      process.exitCode = 1
    }
  } catch (err) {
    console.error(`Could not read status file: ${err instanceof Error ? err.message : err}`)
    process.exitCode = 1
  }
}

function printEnvCheck() {
  applyIngestEnv()
  const ingestScript = resolvePluginIngestScript()
  const apiKey = process.env.POSTHOG_API_KEY
  const enabled = process.env.POSTHOG_LLMA_CC_ENABLED

  console.log('Claude Code LLM Analytics — env check\n')
  console.log(`  POSTHOG_LLMA_CC_ENABLED=${enabled ?? '(not set — auto hook disabled)'}`)
  console.log(`  POSTHOG_API_KEY=${apiKey ? `${apiKey.slice(0, 8)}…` : '(not set)'}`)
  console.log(`  POSTHOG_HOST=${process.env.POSTHOG_HOST ?? '(not set)'}`)
  console.log(
    `  POSTHOG_LLMA_PRIVACY_MODE=${process.env.POSTHOG_LLMA_PRIVACY_MODE ?? '(not set, defaults false)'}`,
  )
  console.log(
    `  Plugin ingest script=${ingestScript ?? '(not found — run: claude plugin install posthog)'}`,
  )
  console.log(`  Status file=${existsSync(STATUS_FILE) ? STATUS_FILE : '(none yet)'}`)
  console.log(
    '\nMetrics check (HogQL) uses POSTHOG_PERSONAL_API_KEY + POSTHOG_PROJECT_ID — see docs/metricas/README.md',
  )
}
