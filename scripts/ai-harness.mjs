#!/usr/bin/env node
import { spawnSync } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const args = new Set(process.argv.slice(2))
const run = args.has('--run')
const all = args.has('--all')
const json = args.has('--json')

const placeholderEnv = {
  VITE_SUPABASE_URL: process.env.VITE_SUPABASE_URL ?? 'https://placeholder.supabase.co',
  VITE_SUPABASE_ANON_KEY: process.env.VITE_SUPABASE_ANON_KEY ?? 'placeholder-anon-key',
}

const ignoredPathPrefixes = ['node_modules/', 'dist/', 'supabase/.temp/']

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

const PERSONA_META = {
  'product-spec-writer': { claudeCommand: '/spec' },
  'frontend-product-engineer': { claudeCommand: '/frontend' },
  'supabase-security-reviewer': { claudeCommand: '/supabase-review' },
  'telemetry-privacy-reviewer': { claudeCommand: '/telemetry-review' },
  'qa-release-reviewer': { claudeCommand: '/qa-release' },
  'repo-architect': { claudeCommand: '/architect' },
}

const MAJOR_GROUPS = ['app-source', 'supabase-migration', 'telemetry-observability', 'e2e']

function recommendPersonas(files, groups) {
  const personas = new Map()

  function add(id, reason, priority = 50) {
    const existing = personas.get(id)
    if (!existing || priority < existing.priority) {
      personas.set(id, {
        id,
        path: `ai/agents/${id}.md`,
        reason,
        priority,
        claudeCommand: PERSONA_META[id]?.claudeCommand,
      })
    }
  }

  const hasGroup = (name) => (groups[name]?.length ?? 0) > 0
  const majorGroupCount = MAJOR_GROUPS.filter(hasGroup).length

  if (hasGroup('supabase-migration')) {
    add('supabase-security-reviewer', 'Supabase migration changed — review RLS, grants, SECURITY DEFINER, and rollback notes.', 10)
  }

  if (hasGroup('telemetry-observability')) {
    add(
      'telemetry-privacy-reviewer',
      'Telemetry, logging, or analytics surface changed — verify consent flow and no-PII taxonomy.',
      10,
    )
  }

  if (hasGroup('e2e')) {
    add('qa-release-reviewer', 'Playwright coverage or E2E config changed — pick the smallest reliable proof set.', 20)
  }

  for (const file of files) {
    if (/^ai\/specs\/(?!_template\/)/.test(file)) {
      add('product-spec-writer', 'Active spec folder changed — keep spec, tasks, and verification aligned.', 15)
    }

    if (/^src\/(pages|components)\/.*\.(tsx)$/.test(file)) {
      add('frontend-product-engineer', 'UI page or component changed — preserve app patterns, i18n, and mobile layout.', 25)
    }

    if (/^src\/(hooks|state)\/.*\.(ts|tsx)$/.test(file)) {
      add('frontend-product-engineer', 'Client state or hooks changed — check blast radius across consumers.', 30)
    }

    if (/^(src\/lib\/supabase|src\/hooks\/useAuth|src\/components\/auth\/|src\/pages\/(Login|Signup))/.test(file)) {
      add('supabase-security-reviewer', 'Auth or Supabase client boundary changed — verify anon-safe env and redirect allowlist.', 12)
    }

    if (/^src\/i18n\/locales\/.*\.json$/.test(file)) {
      add('frontend-product-engineer', 'User-facing copy changed — confirm all locales stay in sync.', 35)
    }
  }

  if (majorGroupCount >= 2) {
    add('repo-architect', 'Change spans multiple layers — map boundaries and sequencing before merge.', 5)
  }

  if (hasGroup('app-source') && hasGroup('telemetry-observability')) {
    add('telemetry-privacy-reviewer', 'App behavior and telemetry changed together — confirm event shape after UI work.', 8)
  }

  if (hasGroup('app-source') && hasGroup('supabase-migration')) {
    add('supabase-security-reviewer', 'App and database changed together — confirm client only uses anon-safe access paths.', 8)
  }

  return [...personas.values()].sort((a, b) => a.priority - b.priority)
}

export function classify(files) {
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

    if (/^docs\/|^ai\/|^\.claude\/|^README\.md$|^AGENTS\.md$/.test(file)) {
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

  const groupMap = Object.fromEntries([...groups.entries()].map(([name, values]) => [name, unique(values)]))

  return {
    files,
    groups: groupMap,
    gates,
    manual: unique(manual),
    personas: recommendPersonas(files, groupMap),
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

  if (report.personas?.length > 0) {
    console.log('\nRecommended personas:')
    for (const item of report.personas) {
      const invoke = item.claudeCommand ? ` (Claude: ${item.claudeCommand})` : ''
      console.log(`- ${item.id} — ${item.path}${invoke}`)
      console.log(`  ${item.reason}`)
    }
    console.log('\nInvoke before declaring done (Cursor: Task; Codex/others: paste the persona path).')
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

const isMain = process.argv[1] === fileURLToPath(import.meta.url)

if (isMain) {
  const report = classify(changedFiles())
  printReport(report)
  if (run) runGates(report.gates)
}
