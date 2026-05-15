import { fireEvent, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Milestone } from '../hooks/useMilestoneDetector'
import { renderWithProviders } from '../test/renderWithProviders'

const drawMilestoneCard = vi.fn()
const milestoneCardToBlob = vi.fn().mockResolvedValue(new Blob(['x'], { type: 'image/png' }))
vi.mock('../lib/milestoneCardCanvas', () => ({
  drawMilestoneCard: (...a: unknown[]) => drawMilestoneCard(...a),
  milestoneCardToBlob: (...a: unknown[]) => milestoneCardToBlob(...a),
}))

const shareOrDownloadPng = vi.fn().mockResolvedValue(undefined)
vi.mock('../lib/milestoneSharePng', () => ({
  shareOrDownloadPng: (...a: unknown[]) => shareOrDownloadPng(...a),
}))

const trackMock = vi.fn()
vi.mock('../lib/telemetry', () => ({
  AnalyticsEvent: { MILESTONE_SHARED: 'milestone_shared' },
  telemetry: { track: (...a: unknown[]) => trackMock(...a) },
}))

import MilestoneModal from './MilestoneModal'

const albumMilestone: Milestone = { kind: 'album', pct: 50 }
const teamMilestone: Milestone = {
  kind: 'team', teamCode: 'BRA', flag: '🇧🇷', name: 'Brasil',
}

describe('MilestoneModal', () => {
  beforeEach(() => {
    drawMilestoneCard.mockClear()
    milestoneCardToBlob.mockClear()
    shareOrDownloadPng.mockClear()
    trackMock.mockClear()
    // jsdom does not implement canvas 2d context; the modal short-circuits when
    // getContext returns null, so stub a sentinel object.
    HTMLCanvasElement.prototype.getContext = vi.fn(() => ({}) as never)
  })

  it('renders nothing when milestone is null', () => {
    const { container } = renderWithProviders(
      <MilestoneModal milestone={null} onDismiss={() => {}} />,
    )
    expect(container.firstChild).toBeNull()
  })

  it('renders a dialog and paints the canvas for an album milestone', async () => {
    renderWithProviders(<MilestoneModal milestone={albumMilestone} onDismiss={() => {}} />)
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    await waitFor(() => expect(drawMilestoneCard).toHaveBeenCalled())
    const input = drawMilestoneCard.mock.calls[0][1] as { kind: string; pct: number }
    expect(input.kind).toBe('album')
    expect(input.pct).toBe(50)
  })

  it('renders a team milestone with the right card input', async () => {
    renderWithProviders(<MilestoneModal milestone={teamMilestone} onDismiss={() => {}} />)
    await waitFor(() => expect(drawMilestoneCard).toHaveBeenCalled())
    const input = drawMilestoneCard.mock.calls[0][1] as Record<string, unknown>
    expect(input).toMatchObject({ kind: 'team', teamCode: 'BRA', flag: '🇧🇷', name: 'Brasil' })
  })

  it('invokes onDismiss when the close button is clicked', () => {
    const onDismiss = vi.fn()
    renderWithProviders(<MilestoneModal milestone={albumMilestone} onDismiss={onDismiss} />)
    fireEvent.click(screen.getAllByRole('button')[0])
    expect(onDismiss).toHaveBeenCalled()
  })

  it('shares the milestone via share helper and emits telemetry', async () => {
    renderWithProviders(<MilestoneModal milestone={albumMilestone} onDismiss={() => {}} />)
    // Second button = share (close is first per source order).
    fireEvent.click(screen.getAllByRole('button')[1])

    await waitFor(() => {
      expect(milestoneCardToBlob).toHaveBeenCalled()
      expect(shareOrDownloadPng).toHaveBeenCalled()
      expect(trackMock).toHaveBeenCalledWith('milestone_shared', expect.objectContaining({
        kind: 'album', pct: 50,
      }))
    })
  })

  it('emits team_code (not pct) for team milestones', async () => {
    renderWithProviders(<MilestoneModal milestone={teamMilestone} onDismiss={() => {}} />)
    fireEvent.click(screen.getAllByRole('button')[1])
    await waitFor(() => {
      expect(trackMock).toHaveBeenCalledWith('milestone_shared', expect.objectContaining({
        kind: 'team', team_code: 'BRA',
      }))
    })
  })
})
