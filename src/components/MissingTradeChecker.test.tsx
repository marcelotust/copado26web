import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { I18nProvider } from '../i18n'
import MissingTradeChecker from './MissingTradeChecker'

const { applyTradeMock, trackMock } = vi.hoisted(() => ({
  applyTradeMock: vi.fn(),
  trackMock: vi.fn(),
}))

vi.mock('../state/stickersStore', () => ({
  useApplyTrade: () => applyTradeMock,
  useCatalogOrder: () => [],
}))

vi.mock('../lib/telemetry', () => ({
  telemetry: { track: trackMock },
  AnalyticsEvent: {
    TRADE_RECORDED: 'trade_recorded',
    QR_ALBUM_SCANNED: 'qr_album_scanned',
    QR_ALBUM_GENERATED: 'qr_album_generated',
  },
}))

// Decoding correctness is covered by albumBitmap.test.ts — here we stub a
// successful decode so the scan-into-checker wiring can be exercised.
vi.mock('../lib/albumBitmap', () => ({
  decodeAlbumBitmap: () => ({ status: 'ok', swaps: ['BRA-01'], missing: ['ARG-05'] }),
}))

vi.mock('./AlbumQRModal', () => ({ default: () => null }))
vi.mock('./AlbumQRScanner', () => ({
  default: ({ onDecode }: { onDecode: (raw: string) => void }) => (
    <button type='button' onClick={() => onDecode('mab:stub')}>mockscan</button>
  ),
}))

function renderChecker() {
  return render(
    <I18nProvider>
      <MissingTradeChecker
        missingIds={new Set(['BRA-01', 'ESP-12'])}
        swapIds={new Set(['ARG-05'])}
        validTeamCodes={new Set(['BRA', 'ESP', 'ARG'])}
        teamFlag={() => ''}
      />
    </I18nProvider>,
  )
}

describe('MissingTradeChecker — register trade', () => {
  beforeEach(() => {
    applyTradeMock.mockReset().mockResolvedValue([])
    trackMock.mockReset()
  })

  it('applies +1 to received and -1 to given, with a PII-free telemetry payload', async () => {
    const user = userEvent.setup()
    renderChecker()

    // Friend's duplicate list: contains a sticker I'm missing (BRA-01 → +1)
    // and one of my duplicates that they need (ARG-05 → -1).
    await user.type(
      screen.getByRole('textbox'),
      'tenho 2 repetidas para trocar\nBRA 01 · ARG 05',
    )
    await user.click(screen.getByRole('button', { name: /analis|analyze/i }))
    await user.click(screen.getByRole('button', { name: /troquei todas|traded all|intercambié todos/i }))
    await user.click(screen.getByRole('button', { name: /registrar|record trade/i }))

    // Confirmation appears once the trade is applied.
    await screen.findByRole('status')

    expect(applyTradeMock).toHaveBeenCalledWith(['BRA-01'], ['ARG-05'])

    expect(trackMock).toHaveBeenCalledTimes(1)
    const [eventName, props] = trackMock.mock.calls[0]!
    expect(eventName).toBe('trade_recorded')
    expect(Object.keys(props).sort()).toEqual([
      'given_count', 'list_kind', 'received_count', 'source',
    ])
    expect(props).toMatchObject({
      received_count: 1,
      given_count: 1,
      source: 'paste',
      list_kind: 'swaps',
    })
    // No sticker ids or pasted text must leak into analytics.
    const serialized = JSON.stringify(props)
    expect(serialized).not.toContain('BRA-01')
    expect(serialized).not.toContain('ARG-05')
    expect(serialized).not.toContain('repetidas')
  })

  it('fills the match from a scanned QR and records source qr', async () => {
    const user = userEvent.setup()
    renderChecker()

    await user.click(screen.getByRole('button', { name: /scan friend|escanear qr|escanear qr del/i }))
    await user.click(screen.getByRole('button', { name: /mockscan/i }))
    await user.click(screen.getByRole('button', { name: /troquei todas|traded all|intercambié todos/i }))
    await user.click(screen.getByRole('button', { name: /registrar|record trade/i }))
    await screen.findByRole('status')

    // Friend's spare BRA-01 (I'm missing it) → +1; their gap ARG-05 (my spare) → -1.
    expect(applyTradeMock).toHaveBeenCalledWith(['BRA-01'], ['ARG-05'])
    const tradeCall = trackMock.mock.calls.find(c => c[0] === 'trade_recorded')
    expect(tradeCall?.[1]).toMatchObject({ source: 'qr', received_count: 1, given_count: 1 })
  })

  it('does not apply anything when nothing is selected', async () => {
    const user = userEvent.setup()
    renderChecker()
    await user.type(screen.getByRole('textbox'), 'BRA 01 · ARG 05')
    await user.click(screen.getByRole('button', { name: /analis|analyze/i }))

    // Register button is disabled until the user selects items.
    expect(screen.getByRole('button', { name: /registrar|record trade/i })).toBeDisabled()
    expect(applyTradeMock).not.toHaveBeenCalled()
  })
})
