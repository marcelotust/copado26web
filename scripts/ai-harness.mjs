#!/usr/bin/env node
import { spawnSync } from 'node:child_process'
import path from 'node:path'

const args = new Set(process.argv.slice(2))
const run = args.has('--run')
const all = args.has('--all')
const json = args.has('--json')

const placeholderEnv = {
  VITE_SUPABASE_URL: process.env.VITE_SUPABASE_URL ?? 'https://placeholder.supabase.co',
  VITE_SUPABASE_ANON_KEY: process.env.VITE_SUPABASE_ANON_KEY ?? 'placeholder-anon-key',
}

const ignoredPathPrefixes = ['node_modules/', 'dist/', '.claude/', 'supabase/.temp/']

function execText(command, options = {}) {
  const result = spawnSync(command, {
    shell: true,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    ...options,
  })
  if (result.status !== 0) return ''
  return result.stdout.trim()
}

function splitLines(text) {
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
}

function unique(values) {
  return [...new Set(values)].sort()
}

function changedFiles() {
  if (all) return splitLines(execText('git ls-files'))

  const files = [
    ...splitLines(execText('git diff --name-only --diff-filter=ACMRTUXB HEAD')),
    ...splitLines(execText('git diff --cached --name-only --diff-filter=ACMRTUXB')),
    ...splitLines(execText('git ls-files --others --exclude-standard')),
  ]

  const upstream = execText('git rev-parse --abbrev-ref --symbolic-full-name @{u} 2>/dev/null')
  if (upstream) {
    files.push(...splitLines(execText(`git diff --name-only --diff-filter=ACMRTUXB ${upstream}...HEAD`)))
  }

  return unique(files).filter((file) => !ignoredPathPrefixes.some((prefix) => file.startsWith(prefix)))
}

function gate(id, command, reason, env = {}) {
  return { id, command, reason, env }
}

function classify(files) {
  const gates = []
  const manual = []
  const groups = new Map()

  function addGroup(name, file) {
    const values = groups.get(name) ?? []
    values.push(file)
    groups.set(name, values)
  }

  function addGate(nextGate) {
    if (!gates.some((existing) => existing.id === nextGate.id)) gates.push(nextGate)
  }

  for (const file of files) {
    const ext = path.extname(file)

    if (/^src\/.*\.(ts|tsx)$/.test(file)) {
      addGroup('app-source', file)
      addGate(gate('lint', 'npm run lint', 'TypeScript/React source changed.'))
      addGate(gate('typecheck', 'npm run typecheck', 'Type contracts may have changed.'))
      addGate(gate('test-ci', 'npm run test:ci', 'Unit/component behavior may have changed.'))
    }

    if (/^(src|public|index\.html|vite\.config\.js|tsconfig\.json|postcss\.config\.js|vercel\.json|package(-lock)?\.json)/.test(file)) {
      addGroup('build-surface', file)
      addGate(gate('build', 'npm run build', 'Bundle, PWA, env, or package surface changed.', placeholderEnv))
    }

    if (/^(e2e\/|playwright\.config\.ts|docs\/e2e\.md)/.test(file)) {
      addGroup('e2e', file)
      addGate(gate('e2e-public', 'npm run test:e2e:public', 'Public Playwright coverage or config changed.', placeholderEnv))
    }

    if (/^supabase\/migrations\/.*\.sql$/.test(file)) {
      addGroup('supabase-migration', file)
      manual.push('Review Supabase migration for RLS, grants, SECURITY DEFINER, search_path, Realtime exposure, and rollback/follow-up notes.')
    }

    if (/^(src\/lib\/telemetry\/|src\/hooks\/useAnalyticsConsent|src\/lib\/logger|src\/lib\/sentry|scripts\/.*(posthog|sentry|metrics)|docs\/metricas\/|docs\/mvp-activation-retention|docs\/mvp-quality-and-observability)/.test(file)) {
      addGroup('telemetry-observability', file)
      manual.push('Validate analytics/logging changes against consent and no-PII taxonomy docs.')
    }

    if (/^docs\/|^ai\/|^README\.md$|^AGENTS\.md$/.test(file)) {
      addGroup('docs-ai', file)
      manual.push('Review docs for drift against current source paths, commands, and product scope.')
    }

    if (/^scripts\/.*\.mjs$/.test(file)) {
      addGroup('node-script', file)
      addGate(gate(`node-check:${file}`, `node --check ${file}`, `Node script syntax changed: ${file}.`))
    }

    if (ext === '.json' && !file.startsWith('docs/audits/_') && !file.startsWith('node_modules/')) {
      addGroup('json', file)
      addGate(gate(`json-parse:${file}`, `node -e "JSON.parse(require('fs').readFileSync('${file.replace(/'/g, "'\\''")}','utf8'))"`, `JSON changed: ${file}.`))
    }
  }

  return {
    files,
    groups: Object.fromEntries([...groups.entries()].map(([name, values]) => [name, unique(values)])),
    gates,
    manual: unique(manual),
  }
}

function printReport(report) {
  if (json) {
    console.log(JSON.stringify(report, null, 2))
    return
  }

  console.log(`AI harness analyzed ${report.files.length} changed file(s).`)

  if (report.files.length === 0) {
    console.log('No changed files detected. Use --all to classify the full repository.')
    return
  }

  console.log('\nFile groups:')
  for (const [name, files] of Object.entries(report.groups)) {
    console.log(`- ${name}: ${files.length}`)
  }

  console.log('\nRecommended gates:')
  if (report.gates.length === 0) {
    console.log('- None inferred from changed files.')
  } else {
    for (const item of report.gates) {
      console.log(`- ${item.command} (${item.reason})`)
    }
  }

  if (report.manual.length > 0) {
    console.log('\nManual checks:')
    for (const item of report.manual) console.log(`- ${item}`)
  }

  if (!run && report.gates.length > 0) {
    console.log('\nRun recommended gates with: npm run ai:harness -- --run')
  }
}

function runGates(gates) {
  for (const item of gates) {
    console.log(`\n$ ${item.command}`)
    const result = spawnSync(item.command, {
      shell: true,
      stdio: 'inherit',
      env: { ...process.env, ...item.env },
    })
    if (result.status !== 0) {
      console.error(`\nGate failed: ${item.command}`)
      process.exit(result.status ?? 1)
    }
  }
}

const report = classify(changedFiles())
printReport(report)
if (run) runGates(report.gates)
