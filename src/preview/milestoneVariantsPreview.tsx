import { useEffect, useRef } from 'react'
import ReactDOM from 'react-dom/client'
import { drawMilestoneCard } from '../lib/milestoneCardCanvas'
import type { CardBackground } from '../lib/brand/cardBackgrounds'
import type { MilestoneDrawInput } from '../lib/milestoneCardTypes'

// Defense-in-depth: this preview is dev-only. The HTML entry is not in
// `rollupOptions.input` (so `npm run build` does not emit it), `vercel.json`
// redirects `/milestone-preview.html` to `/`, and the runtime guard below
// bails before mounting if somehow loaded in a non-dev bundle.
if (!import.meta.env.DEV) {
  document.body.innerHTML =
    '<p style="font-family:system-ui;color:#94a3b8;padding:32px">Preview disponível apenas em dev.</p>'
  throw new Error('milestone preview is dev-only')
}

const t = (key: string): string => {
  const dict: Record<string, string> = {
    'share.signature':
      'Cola o teu álbum em meualbum2026.app — é grátis,\ne dá pra trocar sobras com a galera direto pelo zap.',
    'share.scanCta': 'Aponta a câmera pra entrar no app',
  }
  return dict[key] ?? key
}

const copy = { tagline: 'Copa do Mundo FIFA 2026', t }

const VARIANTS: MilestoneDrawInput[] = [
  {
    variant: 'pct',
    pct: 50,
    headline: '50% do álbum!',
    subline: 'Continue colando — falta pouco!',
    copy,
  },
  {
    variant: 'team-complete',
    teamCode: 'BRA',
    flag: '🇧🇷',
    name: 'Brasil',
    headline: 'Time completo! 🎉',
    copy,
  },
  {
    variant: 'foil',
    teamCode: 'FWC',
    flag: '🏆',
    stickerNumber: 7,
    stickerName: 'Trofeu Histórico',
    headline: 'Foil rara desbloqueada!',
    subline: 'Raridade conquistada',
    copy,
  },
  {
    variant: 'generic',
    eyebrow: 'Marco especial',
    hero: 'Algo épico aconteceu',
    sub: 'Continue colando figurinhas',
    subtitle: 'Detalhes na home',
    copy,
  },
]

const BACKGROUNDS: ReadonlyArray<{ key: CardBackground; label: string }> = [
  { key: 'stars',    label: 'Stars (atual)' },
  { key: 'beams',    label: 'Stadium beams' },
  { key: 'halftone', label: 'Halftone foil' },
]

function CardCanvas({ input }: { input: MilestoneDrawInput }) {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    drawMilestoneCard(ctx, input)
  }, [input])
  return (
    <canvas
      ref={ref}
      width={1080}
      height={1920}
      style={{
        width: 270,
        height: 480,
        background: '#020617',
        borderRadius: 12,
        border: '1px solid rgba(148,163,184,0.18)',
      }}
    />
  )
}

// eslint-disable-next-line react/no-multi-comp -- dev-only preview, both components are local
function App() {
  return (
    <div
      style={{
        background: '#0b1224',
        color: '#e2e8f0',
        fontFamily: 'system-ui, sans-serif',
        minHeight: '100vh',
        padding: 32,
      }}
    >
      <header style={{ marginBottom: 24 }}>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>
          Milestone share — variants × backgrounds
        </h1>
        <p style={{ margin: '4px 0 0', color: '#94a3b8', fontSize: 13 }}>
          1080×1920 portrait cards rendered to canvas. Visual diff for handoff seção 06.
        </p>
      </header>

      <table
        style={{
          borderCollapse: 'separate',
          borderSpacing: 24,
          margin: '0 auto',
        }}
      >
        <thead>
          <tr>
            <th style={{ width: 160, textAlign: 'left', color: '#94a3b8', fontWeight: 600 }}>
              Variant ↓ / Background →
            </th>
            {BACKGROUNDS.map((b) => (
              <th key={b.key} style={{ color: '#cbd5e1', fontWeight: 600, fontSize: 13 }}>
                {b.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {VARIANTS.map((v) => (
            <tr key={v.variant}>
              <th style={{ textAlign: 'left', color: '#cbd5e1', fontWeight: 600, verticalAlign: 'top' }}>
                {v.variant}
              </th>
              {BACKGROUNDS.map((bg) => (
                <td key={bg.key} style={{ padding: 0 }}>
                  <CardCanvas input={{ ...v, background: bg.key } as MilestoneDrawInput} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

ReactDOM.createRoot(document.getElementById('preview-root')!).render(<App />)
