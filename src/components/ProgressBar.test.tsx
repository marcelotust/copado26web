import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import ProgressBar from './ProgressBar'

describe('ProgressBar', () => {
  it('renders collected/total counts', () => {
    render(<ProgressBar collected={30} total={120} />)

    expect(screen.getByText('30')).toBeInTheDocument()
    expect(screen.getByText('/120')).toBeInTheDocument()
  })

  it('shows 25% when 30 of 120 stickers collected', () => {
    render(<ProgressBar collected={30} total={120} />)

    expect(screen.getByText('25%')).toBeInTheDocument()
  })

  it('renders 0% and 0/total when collected is 0', () => {
    render(<ProgressBar collected={0} total={120} />)

    expect(screen.getByText('0')).toBeInTheDocument()
    expect(screen.getByText('0%')).toBeInTheDocument()
  })

  it('renders 100% when collection is complete', () => {
    render(<ProgressBar collected={120} total={120} />)

    expect(screen.getByText('100%')).toBeInTheDocument()
  })

  it('renders 0% gracefully when total is 0', () => {
    render(<ProgressBar collected={0} total={0} />)

    expect(screen.getByText('0%')).toBeInTheDocument()
  })

  it('applies the percentage as inline width style on the fill bar', () => {
    const { container } = render(<ProgressBar collected={50} total={100} />)

    const fill = container.querySelector('.bg-gradient-to-r') as HTMLElement
    expect(fill).not.toBeNull()
    expect(fill.style.width).toBe('50%')
  })
})
