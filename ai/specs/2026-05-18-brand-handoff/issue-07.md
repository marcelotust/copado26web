## Contexto

Handoff seção 07 (`/tmp/handoff/meualbum2026/project/Handoff Pack.html` linhas 795-1066).

Estado atual: **não existe** `src/lib/challengeCardLayout.ts` — o manifesto do handoff diz "refatora 4 tipos" mas é **criação** de arquivo novo.

**Depende de:**
- #1 (selo SVG)
- #2 (tokens)
- #6 (helpers `drawShareHeader` / `drawShareFooter` compartilhados)

## Escopo

Criar `src/lib/challengeCardLayout.ts`, tipos:
```ts
type ChallengeCardVariant = 'fan' | 'lineup' | 'cascade' | 'cluster';
```

- **`fan`** — 4-6 stickers em leque escuro.
- **`lineup`** — 3 stickers em linha colorida.
- **`cascade`** — 7-10 stickers em cascata.
- **`cluster`** (default) — hero + back/mid row + "+N" pill, escala 2 → 30+.

Reusar `drawShareHeader` / `drawShareFooter` de #6.

Integrar com novo `generateChallengeSharePng` (análogo a `milestoneSharePng`).

i18n dos labels "Completei o desafio «X»" em `src/i18n/locales/*.json`.

## Acceptance criteria

- Vitest snapshots dos 4 layouts.
- Visual diff contra `Handoff Pack.html` seção 07.
- Cluster com N=2, 6, 12, 30+ todos visualmente corretos.

## Verificação

- `npm run test:ci src/lib/challenge*`.
- e2e do challenge share termina com `SHARE_SIGNATURE` (cobre junto com #5).
