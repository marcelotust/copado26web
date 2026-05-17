#!/usr/bin/env node

import { readFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..')
const supabaseDir = join(repoRoot, 'supabase')
const configPath = join(supabaseDir, 'config.toml')

const args = new Set(process.argv.slice(2))
const dryRun = args.has('--dry-run')
const checkEnv = args.has('--check-env')
const skipUnchanged = args.has('--skip-unchanged')

/** config.toml section name → Management API auth config keys */
const MAILER_API_KEYS = {
  magic_link: {
    subject: 'mailer_subjects_magic_link',
    content: 'mailer_templates_magic_link_content',
  },
  confirmation: {
    subject: 'mailer_subjects_confirmation',
    content: 'mailer_templates_confirmation_content',
  },
}

const config = {
  accessToken: process.env.SUPABASE_ACCESS_TOKEN,
  projectRef: process.env.SUPABASE_PROJECT_REF ?? process.env.SUPABASE_PROJECT_ID,
  apiBase: (process.env.SUPABASE_MANAGEMENT_API_BASE ?? 'https://api.supabase.com/v1').replace(/\/$/, ''),
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : String(err))
  process.exitCode = 1
})

async function main() {
  if (checkEnv) {
    printEnvStatus()
    process.exit(missingEnvVars().length ? 1 : 0)
  }

  const missing = missingEnvVars()
  if (missing.length && !dryRun) {
    throw new Error(`Missing: ${missing.join(', ')} (use --dry-run to preview locally)`)
  }

  const templates = await loadTemplatesFromConfig()
  const payload = buildMailerPayload(templates)

  if (dryRun) {
    printDryRunSummary(templates, payload)
    return
  }

  const remote = skipUnchanged ? await fetchRemoteMailerConfig() : null
  if (remote && !mailerPayloadDiffers(payload, remote)) {
    console.log('Supabase auth email templates already match repo; skipping PATCH.')
    return
  }

  await patchAuthConfig(payload)
  console.log(`Updated ${templates.length} auth email template(s) on project ${config.projectRef}.`)
}

function missingEnvVars() {
  const missing = []
  if (!config.accessToken) missing.push('SUPABASE_ACCESS_TOKEN')
  if (!config.projectRef) missing.push('SUPABASE_PROJECT_REF')
  return missing
}

function printEnvStatus() {
  const missing = missingEnvVars()
  for (const key of ['SUPABASE_ACCESS_TOKEN', 'SUPABASE_PROJECT_REF']) {
    const ok = !missing.includes(key)
    console.log(`${key}: ${ok ? 'set' : 'missing'}`)
  }
  console.log(`config: ${configPath}`)
}

/**
 * Minimal parser for [auth.email.template.<name>] blocks in supabase/config.toml.
 * @returns {Array<{ name: string, subject: string, contentPath: string, html: string }>}
 */
export function parseAuthEmailTemplateConfig(configText) {
  const sections = new Map()
  let current = null

  for (const rawLine of configText.split('\n')) {
    const line = rawLine.trim()
    if (!line || line.startsWith('#')) continue

    const sectionMatch = line.match(/^\[auth\.email\.template\.([a-z_]+)\]$/)
    if (sectionMatch) {
      current = sectionMatch[1]
      sections.set(current, { name: current, subject: '', contentPath: '' })
      continue
    }

    if (!current) continue
    const entry = sections.get(current)
    const subjectMatch = line.match(/^subject\s*=\s*"(.*)"\s*$/)
    if (subjectMatch) {
      entry.subject = subjectMatch[1]
      continue
    }
    const pathMatch = line.match(/^content_path\s*=\s*"(.*)"\s*$/)
    if (pathMatch) entry.contentPath = pathMatch[1]
  }

  return [...sections.values()].filter((s) => s.subject && s.contentPath)
}

export function buildMailerPayload(templates) {
  const payload = {}
  for (const template of templates) {
    const keys = MAILER_API_KEYS[template.name]
    if (!keys) {
      throw new Error(
        `No Management API mapping for auth.email.template.${template.name}. ` +
          `Add it to MAILER_API_KEYS in scripts/sync-auth-email-templates.mjs`,
      )
    }
    payload[keys.subject] = template.subject
    payload[keys.content] = template.html
  }
  return payload
}

export function mailerPayloadDiffers(nextPayload, remoteConfig) {
  for (const [key, value] of Object.entries(nextPayload)) {
    if ((remoteConfig[key] ?? '') !== value) return true
  }
  return false
}

function resolveTemplatePath(contentPath) {
  const relative = contentPath.replace(/^\.\//, '')
  return resolve(supabaseDir, relative)
}

async function loadTemplatesFromConfig() {
  const configText = await readFile(configPath, 'utf8')
  const parsed = parseAuthEmailTemplateConfig(configText)
  if (!parsed.length) {
    throw new Error(`No [auth.email.template.*] blocks found in ${configPath}`)
  }

  const templates = []
  for (const entry of parsed) {
    const filePath = resolveTemplatePath(entry.contentPath)
    const html = await readFile(filePath, 'utf8')
    templates.push({ ...entry, filePath, html })
  }
  return templates
}

function printDryRunSummary(templates, payload) {
  console.log('dry-run — auth email templates to PATCH:')
  for (const template of templates) {
    const keys = MAILER_API_KEYS[template.name]
    console.log(`  ${template.name}`)
    console.log(`    file: ${template.filePath}`)
    console.log(`    ${keys.subject}: ${template.subject}`)
    console.log(`    ${keys.content}: ${template.html.length} chars (sha256 ${sha256(template.html).slice(0, 12)}…)`)
  }
  console.log(`payload keys: ${Object.keys(payload).join(', ')}`)
  if (missingEnvVars().length) {
    console.log(`env: missing ${missingEnvVars().join(', ')} (required for live sync)`)
  }
}

function sha256(text) {
  return createHash('sha256').update(text, 'utf8').digest('hex')
}

async function fetchRemoteMailerConfig() {
  const url = `${config.apiBase}/projects/${config.projectRef}/config/auth`
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${config.accessToken}` },
  })
  if (!res.ok) {
    const body = await res.text()
    throw new Error(`GET auth config failed (${res.status}): ${body.slice(0, 500)}`)
  }
  const data = await res.json()
  const mailerOnly = {}
  for (const [key, value] of Object.entries(data)) {
    if (key.startsWith('mailer_subjects_') || key.startsWith('mailer_templates_')) {
      mailerOnly[key] = value
    }
  }
  return mailerOnly
}

async function patchAuthConfig(payload) {
  const url = `${config.apiBase}/projects/${config.projectRef}/config/auth`
  const res = await fetch(url, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${config.accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })
  if (!res.ok) {
    const body = await res.text()
    throw new Error(`PATCH auth config failed (${res.status}): ${body.slice(0, 500)}`)
  }
}
