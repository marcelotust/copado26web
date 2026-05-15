import { fireEvent, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Challenge } from '../data/challenges'
import { renderWithProviders } from '../test/renderWithProviders'

vi.mock('../lib/logger', () => ({
  logger: { warn: vi.fn() },
  isShareAbort: (e: unknown) =>
    typeof e === 'object' && e !== null && (e as { name?: string }).name === 'AbortError',
}))

import ChallengeCompletedModal from './ChallengeCompletedModal'

const challenge: Challenge = {
  id: 'kickoff', icon: '⚽', title: 'Primeiros Passos',
  description: 'Cole 10 figurinhas.', difficulty: 'easy',
  albumTotal: true, requiredQty: 10,
}

describe('ChallengeCompletedModal', () => {
  beforeEach(() => {
    vi.unstubAllGlobals()
  })

  it('renders nothing when challenge is null', () => {
    const { container } = renderWithProviders(
      <ChallengeCompletedModal challenge={null} onDismiss={() => {}} />,
    )
    expect(container.firstChild).toBeNull()
  })

  it('renders title, description and icon when a challenge is passed', () => {
    renderWithProviders(<ChallengeCompletedModal challenge={challenge} onDismiss={() => {}} />)
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByText('Primeiros Passos')).toBeInTheDocument()
    expect(screen.getByText('Cole 10 figurinhas.')).toBeInTheDocument()
    expect(screen.getByText('⚽')).toBeInTheDocument()
  })

  it('invokes onDismiss when the close button is clicked', () => {
    const onDismiss = vi.fn()
    renderWithProviders(<ChallengeCompletedModal challenge={challenge} onDismiss={onDismiss} />)
    fireEvent.click(screen.getByRole('button', { name: /fechar|close/i }))
    expect(onDismiss).toHaveBeenCalled()
  })

  it('uses navigator.share when available', async () => {
    const share = vi.fn().mockResolvedValue(undefined)
    vi.stubGlobal('navigator', { ...navigator, share, clipboard: { writeText: vi.fn() } })

    renderWithProviders(<ChallengeCompletedModal challenge={challenge} onDismiss={() => {}} />)
    fireEvent.click(screen.getAllByRole('button')[1])

    await waitFor(() => {
      expect(share).toHaveBeenCalledWith(expect.objectContaining({ text: expect.any(String) }))
    })
  })

  it('falls back to clipboard when share API is not available', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    vi.stubGlobal('navigator', { ...navigator, share: undefined, clipboard: { writeText } })

    renderWithProviders(<ChallengeCompletedModal challenge={challenge} onDismiss={() => {}} />)
    fireEvent.click(screen.getAllByRole('button')[1])

    await waitFor(() => {
      expect(writeText).toHaveBeenCalled()
      expect(screen.getByText(/Copiado/)).toBeInTheDocument()
    })
  })

  it('falls back to WhatsApp when clipboard also fails', async () => {
    const writeText = vi.fn().mockRejectedValue(new Error('clipboard unavailable'))
    vi.stubGlobal('navigator', { ...navigator, share: undefined, clipboard: { writeText } })
    const open = vi.fn()
    vi.stubGlobal('open', open)

    renderWithProviders(<ChallengeCompletedModal challenge={challenge} onDismiss={() => {}} />)
    fireEvent.click(screen.getAllByRole('button')[1])

    await waitFor(() => {
      expect(open).toHaveBeenCalledWith(
        expect.stringContaining('https://wa.me/?text='),
        '_blank',
      )
    })
  })

  it('does not error when share is aborted by the user', async () => {
    const abortErr = Object.assign(new Error('aborted'), { name: 'AbortError' })
    const share = vi.fn().mockRejectedValue(abortErr)
    vi.stubGlobal('navigator', { ...navigator, share, clipboard: { writeText: vi.fn() } })

    renderWithProviders(<ChallengeCompletedModal challenge={challenge} onDismiss={() => {}} />)
    fireEvent.click(screen.getAllByRole('button')[1])

    await waitFor(() => {
      expect(share).toHaveBeenCalled()
    })
    // Did not crash and did not fall through to clipboard.
    expect(screen.queryByText(/Copiado/)).not.toBeInTheDocument()
  })
})
