## Contexto

Handoff seção 06 (`/tmp/handoff/meualbum2026/project/Handoff Pack.html` linhas 516-794).

Estado atual: `src/lib/milestoneCardLayout.ts` desenha 1080×1920 mas sem variação por tipo. O handoff define **3 especialistas + 1 genérico** (fallback).

**Depende de:**
- #1 (selo SVG)
- #2 (tokens)

## Escopo

`src/lib/milestoneCardLayout.ts`, tipos:
```ts
type MilestoneCardVariant = 'pct' | 'team-complete' | 'foil' | 'generic';
```

- **`pct`** — grid 30 mini-stickers, números %.
- **`team-complete`** — 12 mini-stickers da seleção, todos colados.
- **`foil`** — figurinha rara grande centralizada + halo foil.
- **`generic`** — estrela ★ + slots `eyebrow / hero / sub / subtitle` para qualquer marco novo (default).

Todos com:
- **Header**: selo + wordmark (helper compartilhado `drawShareHeader`).
- **Footer**: QR `meualbum2026.app` + tagline em texto (helper `drawShareFooter`).

Refatorar `milestoneCardCanvas.ts` e `milestoneSharePng.ts` conforme assinatura nova. Atualizar `milestoneDetection.ts` se mapping de variant mudar.

## Acceptance criteria

- Vitest cobre os 4 layouts (snapshot dos PNGs com tolerância).
- Visual diff manual contra `Handoff Pack.html` seção 06.
- QR escaneia para `meualbum2026.app` (gerar com lib `qrcode` runtime, ECC M, 110px no card).

## Verificação

- `npm run test:ci src/lib/milestone*`.
- Geração de PNG end-to-end via PageObject no `e2e/authenticated`.

## Notas

- Helpers `drawShareHeader` / `drawShareFooter` ficam **exportados** — issue #7 (`challengeCardLayout`) consome os mesmos.
- Memory `[[album_panini_wc2026_structure]]`: respeitar ordem canônica de grupos quando renderizar `team-complete`.
