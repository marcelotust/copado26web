import { describe, expect, it } from 'vitest'
import { formatMessage } from './formatMessage'

describe('formatMessage', () => {
  it('replaces placeholders', () => {
    expect(formatMessage('Hello {{name}}', { name: 'World' })).toBe('Hello World')
  })
})
