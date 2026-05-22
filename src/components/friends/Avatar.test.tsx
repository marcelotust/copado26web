import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import Avatar from './Avatar'

describe('Avatar', () => {
  it('renders initials from display_name', () => {
    render(<Avatar userId='abc-123' displayName='Rafael Pereira' size='md' />)
    expect(screen.getByText('RP')).toBeInTheDocument()
  })

  it('renders single initial for one-word name', () => {
    render(<Avatar userId='abc-123' displayName='Rafael' size='md' />)
    expect(screen.getByText('R')).toBeInTheDocument()
  })

  it('renders ? for empty display name', () => {
    render(<Avatar userId='abc-123' displayName='' size='md' />)
    expect(screen.getByText('?')).toBeInTheDocument()
  })

  it('derives deterministic color class from userId', () => {
    const { container: c1 } = render(<Avatar userId='user-1' displayName='A' />)
    const { container: c2 } = render(<Avatar userId='user-1' displayName='A' />)
    // Both renders of same userId produce same className
    expect(c1.firstElementChild?.className).toBe(c2.firstElementChild?.className)
  })

  it('renders img when avatarUrl is provided', () => {
    render(<Avatar userId='u' displayName='Test' avatarUrl='https://example.com/avatar.jpg' />)
    expect(screen.getByRole('img')).toBeInTheDocument()
  })
})
