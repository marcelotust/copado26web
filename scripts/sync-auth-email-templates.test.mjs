import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  buildMailerPayload,
  mailerPayloadDiffers,
  parseAuthEmailTemplateConfig,
} from './sync-auth-email-templates.mjs'

const sampleConfig = `
[auth.email.template.magic_link]
subject = "Entrar no Meu Álbum 2026"
content_path = "./templates/magic-link.html"

[auth.email.template.confirmation]
subject = "Confirme sua conta — Meu Álbum 2026"
content_path = "./templates/confirm-signup.html"
`

test('parseAuthEmailTemplateConfig reads subject and content_path', () => {
  const parsed = parseAuthEmailTemplateConfig(sampleConfig)
  assert.equal(parsed.length, 2)
  assert.equal(parsed[0].name, 'magic_link')
  assert.equal(parsed[0].subject, 'Entrar no Meu Álbum 2026')
  assert.equal(parsed[0].contentPath, './templates/magic-link.html')
  assert.equal(parsed[1].name, 'confirmation')
})

test('buildMailerPayload maps to Management API keys', () => {
  const payload = buildMailerPayload([
    { name: 'magic_link', subject: 'A', html: '<p>magic</p>' },
    { name: 'confirmation', subject: 'B', html: '<p>confirm</p>' },
  ])
  assert.equal(payload.mailer_subjects_magic_link, 'A')
  assert.equal(payload.mailer_templates_magic_link_content, '<p>magic</p>')
  assert.equal(payload.mailer_subjects_confirmation, 'B')
  assert.equal(payload.mailer_templates_confirmation_content, '<p>confirm</p>')
})

test('buildMailerPayload rejects unknown template names', () => {
  assert.throws(
    () => buildMailerPayload([{ name: 'invite', subject: 'X', html: '<p>x</p>' }]),
    /No Management API mapping/,
  )
})

test('mailerPayloadDiffers detects content changes only for managed keys', () => {
  const next = {
    mailer_subjects_magic_link: 'A',
    mailer_templates_magic_link_content: '<p>1</p>',
  }
  assert.equal(mailerPayloadDiffers(next, { ...next }), false)
  assert.equal(
    mailerPayloadDiffers(next, { ...next, mailer_templates_magic_link_content: '<p>2</p>' }),
    true,
  )
  assert.equal(mailerPayloadDiffers(next, {}), true)
})
