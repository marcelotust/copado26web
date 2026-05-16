import assert from 'node:assert/strict'
import test from 'node:test'
import { classify } from './ai-harness.mjs'

test('migration recommends supabase-security-reviewer', () => {
  const report = classify(['supabase/migrations/20260516000000_test.sql'])
  const ids = report.personas.map((p) => p.id)
  assert.ok(ids.includes('supabase-security-reviewer'))
})

test('telemetry + app source recommends repo-architect and both specialists', () => {
  const report = classify([
    'src/lib/telemetry/events.ts',
    'src/pages/AlbumPage.tsx',
  ])
  const ids = report.personas.map((p) => p.id)
  assert.ok(ids.includes('telemetry-privacy-reviewer'))
  assert.ok(ids.includes('frontend-product-engineer'))
  assert.ok(ids.includes('repo-architect'))
})

test('spec folder recommends product-spec-writer', () => {
  const report = classify(['ai/specs/2026-05-16-demo/spec.md'])
  const ids = report.personas.map((p) => p.id)
  assert.ok(ids.includes('product-spec-writer'))
})

test('e2e change recommends qa-release-reviewer', () => {
  const report = classify(['e2e/public/guest.spec.ts'])
  const ids = report.personas.map((p) => p.id)
  assert.ok(ids.includes('qa-release-reviewer'))
})

test('non-specialized docs change recommends no personas', () => {
  const report = classify(['docs/repo-setup.md'])
  assert.equal(report.personas.length, 0)
})
