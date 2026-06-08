# WAP → FWC Display Fix Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Exibir as figurinhas da seção Abertura (armazenadas como `WAP-00..WAP-08`) como `FWC 00..FWC 08` em todos os pontos visíveis ao usuário, sem qualquer alteração no banco de dados.

**Architecture:** Uma função utilitária `displayTeamCode(code)` centraliza o mapeamento `'WAP' → 'FWC'` na camada de apresentação. Todos os componentes e builders de texto de compartilhamento chamam essa função. O parser de colagem recebe `normalizeTradeId` para o caminho inverso: `FWC-00..08 → WAP-00..08`. Estado interno, DB, rotas e seletores permanecem com `'WAP'`.

**Tech Stack:** React 18, TypeScript, Vitest

---

## File Map

| Ação | Arquivo | Responsabilidade |
|------|---------|-----------------|
| Criar | `src/lib/stickerDisplay.ts` | Função `displayTeamCode` |
| Criar | `src/lib/stickerDisplay.test.ts` | Testes unitários de `displayTeamCode` |
| Modificar | `src/components/StickerCardCaptionColumn.tsx` | Label `WAP` → `FWC` no card |
| Modificar | `src/components/StickerCodeGroup.tsx` | Badge do código no cabeçalho de grupo |
| Modificar | `src/components/MissingStickerTile.tsx` | Label e title no tile de faltante |
| Modificar | `src/components/SwapStickerTile.tsx` | Label e title no tile de repetida |
| Modificar | `src/lib/shareText.ts` | Tokens `WAP XX` → `FWC XX` no corpo do share |
| Modificar | `src/lib/missingShareBuilders.ts` | Tokens `WAP XX` → `FWC XX` no canvas |
| Modificar | `src/lib/shareText.test.ts` | Novos casos de teste para grupos WAP |
| Modificar | `src/lib/tradeListParse.ts` | `normalizeTradeId`: alias `FWC-00..08 → WAP` |
| Modificar | `src/lib/tradeListParse.test.ts` | Testes do alias |

---

## Task 1: Criar `stickerDisplay` utility (TDD)

**Files:**
- Create: `src/lib/stickerDisplay.test.ts`
- Create: `src/lib/stickerDisplay.ts`

- [ ] **Step 1: Escrever o teste que vai falhar**

Criar `src/lib/stickerDisplay.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { displayTeamCode } from './stickerDisplay'

describe('displayTeamCode', () => {
  it('maps WAP to FWC for display', () => {
    expect(displayTeamCode('WAP')).toBe('FWC')
  })

  it('passes through all other team codes unchanged', () => {
    expect(displayTeamCode('BRA')).toBe('BRA')
    expect(displayTeamCode('FWC')).toBe('FWC')
    expect(displayTeamCode('CC')).toBe('CC')
    expect(displayTeamCode('ESP')).toBe('ESP')
  })
})
```

- [ ] **Step 2: Confirmar que o teste falha**

```bash
npx vitest run src/lib/stickerDisplay.test.ts
```

Expected: FAIL — `Cannot find module './stickerDisplay'`

- [ ] **Step 3: Criar a implementação mínima**

Criar `src/lib/stickerDisplay.ts`:

```ts
export function displayTeamCode(code: string): string {
  return code === 'WAP' ? 'FWC' : code
}
```

- [ ] **Step 4: Confirmar que o teste passa**

```bash
npx vitest run src/lib/stickerDisplay.test.ts
```

Expected: PASS (2 tests)

- [ ] **Step 5: Commit**

```bash
git add src/lib/stickerDisplay.ts src/lib/stickerDisplay.test.ts
git commit -m "feat(display): add displayTeamCode utility (WAP→FWC)"
```

---

## Task 2: Atualizar componentes de exibição

**Files:**
- Modify: `src/components/StickerCardCaptionColumn.tsx`
- Modify: `src/components/StickerCodeGroup.tsx`
- Modify: `src/components/MissingStickerTile.tsx`
- Modify: `src/components/SwapStickerTile.tsx`

Nota: estes são componentes React sem lógica complexa. Verificação é via `typecheck` e visual no browser.

- [ ] **Step 1: Atualizar `StickerCardCaptionColumn.tsx`**

Adicionar import no topo (após os imports existentes):
```ts
import { displayTeamCode } from '../lib/stickerDisplay'
```

Linha 68 — alterar `{teamCode}` para:
```tsx
{displayTeamCode(teamCode)}
```

Linha 90 — alterar `label={displayLabel ?? teamCode}` para:
```tsx
label={displayLabel ?? displayTeamCode(teamCode)}
```

> Não alterar as condições lógicas `teamCode === "WAP"` nas linhas 83-84 — essas controlam a renderização estrutural, não são exibição.

- [ ] **Step 2: Atualizar `StickerCodeGroup.tsx`**

Adicionar import no topo:
```ts
import { displayTeamCode } from '../lib/stickerDisplay'
```

Linha 38 — alterar `{teamCode}` para:
```tsx
{displayTeamCode(teamCode)}
```

- [ ] **Step 3: Atualizar `MissingStickerTile.tsx`**

Adicionar import no topo:
```ts
import { displayTeamCode } from '../lib/stickerDisplay'
```

Linha 20 — alterar o atributo `title`:
```tsx
title={`${displayTeamCode(teamCode)} ${numLabel}`}
```

Linha 23 — alterar `{teamCode}` para:
```tsx
{displayTeamCode(teamCode)}
```

- [ ] **Step 4: Atualizar `SwapStickerTile.tsx`**

Adicionar import no topo:
```ts
import { displayTeamCode } from '../lib/stickerDisplay'
```

Linha 29 — alterar:
```ts
const label = `${displayTeamCode(teamCode)} ${numLabel}`
```

Linha 46 — alterar `{teamCode}` para:
```tsx
{displayTeamCode(teamCode)}
```

- [ ] **Step 5: Verificar tipos**

```bash
npm run typecheck
```

Expected: zero erros

- [ ] **Step 6: Commit**

```bash
git add src/components/StickerCardCaptionColumn.tsx src/components/StickerCodeGroup.tsx src/components/MissingStickerTile.tsx src/components/SwapStickerTile.tsx
git commit -m "feat(display): exibir FWC no lugar de WAP em cards e tiles"
```

---

## Task 3: Atualizar builders de texto de compartilhamento

**Files:**
- Modify: `src/lib/shareText.ts`
- Modify: `src/lib/missingShareBuilders.ts`
- Modify: `src/lib/shareText.test.ts`

- [ ] **Step 1: Adicionar os testes que vão falhar em `shareText.test.ts`**

Dentro do `describe('text share builders end with share.signature', ...)`, adicionar após o teste existente de `'swaps share'`:

```ts
it('WAP group emits FWC tokens in missing share', () => {
  const groups: MissingGroup[] = [{ teamCode: 'WAP', numbers: [1, 5, 8] }]
  const out = buildMissingShareText(
    groups,
    (c) => (c === 'WAP' ? 'Abertura' : c),
    () => '⚪',
    3,
    t(I18N_PT),
  )
  expect(out).toContain('FWC 01')
  expect(out).toContain('FWC 05')
  expect(out).toContain('FWC 08')
  expect(out).not.toContain('WAP 01')
})

it('WAP group emits FWC tokens in swaps share', () => {
  const stickers: Sticker[] = [
    { id: 'WAP-02', team_code: 'WAP', number: 2, quantity: 2 } as Sticker,
  ]
  const groups: SwapGroup[] = [{ teamCode: 'WAP', stickers }]
  const out = buildSwapsShareText(
    groups,
    (c) => (c === 'WAP' ? 'Abertura' : c),
    () => '⚪',
    1,
    t(I18N_PT),
  )
  expect(out).toContain('FWC 02')
  expect(out).not.toContain('WAP 02')
})
```

- [ ] **Step 2: Confirmar que os novos testes falham**

```bash
npx vitest run src/lib/shareText.test.ts
```

Expected: os 2 novos testes FAIL (os existentes continuam PASS)

- [ ] **Step 3: Atualizar `shareText.ts`**

Adicionar import no topo:
```ts
import { displayTeamCode } from './stickerDisplay'
```

Em `buildMissingShareBody`, linha 35 — alterar:
```ts
numbers.map(n => `${displayTeamCode(teamCode)} ${pad(n)}`).join(' · ')
```

Em `buildSwapsShareBody`, dentro do `.map()` — alterar a linha do `return`:
```ts
return `${displayTeamCode(teamCode)} ${pad(s.number)}${extra > 1 ? ` ×${extra}` : ''}`
```

- [ ] **Step 4: Confirmar que os testes passam**

```bash
npx vitest run src/lib/shareText.test.ts
```

Expected: PASS (todos os testes)

- [ ] **Step 5: Atualizar `missingShareBuilders.ts` (canvas)**

Adicionar import no topo:
```ts
import { displayTeamCode } from './stickerDisplay'
```

Linha 55 — alterar:
```ts
const preview = numbers.slice(0, 9).map(n => `${displayTeamCode(teamCode)} ${pad(n)}`).join(' · ')
```

- [ ] **Step 6: Commit**

```bash
git add src/lib/shareText.ts src/lib/missingShareBuilders.ts src/lib/shareText.test.ts
git commit -m "feat(share): emitir tokens FWC para figurinhas da Abertura no texto de share"
```

---

## Task 4: Adicionar alias no parser de colagem

**Files:**
- Modify: `src/lib/tradeListParse.ts`
- Modify: `src/lib/tradeListParse.test.ts`

- [ ] **Step 1: Adicionar os testes que vão falhar**

Em `src/lib/tradeListParse.test.ts`, dentro do `describe('parseTradeList', ...)`, adicionar após os testes existentes:

```ts
describe('FWC 00-08 alias (seção Abertura)', () => {
  it('maps FWC 00-08 tokens to WAP equivalents', () => {
    expect(parseTradeList('FWC 00 · FWC 05 · FWC 08')).toEqual(['WAP-00', 'WAP-05', 'WAP-08'])
  })

  it('does not remap FWC 09 and above', () => {
    expect(parseTradeList('FWC 09 · FWC 19')).toEqual(['FWC-09', 'FWC-19'])
  })

  it('handles mixed FWC: alias tokens alongside real catalog tokens', () => {
    expect(parseTradeList('FWC 01 · FWC 09')).toEqual(['WAP-01', 'FWC-09'])
  })
})
```

- [ ] **Step 2: Confirmar que os novos testes falham**

```bash
npx vitest run src/lib/tradeListParse.test.ts
```

Expected: 3 novos testes FAIL (os existentes continuam PASS)

- [ ] **Step 3: Adicionar `normalizeTradeId` em `tradeListParse.ts`**

Logo após a definição de `STICKER_TOKEN_RE` (linha 5), adicionar:

```ts
function normalizeTradeId(id: string): string {
  const [team, num] = id.split('-')
  if (team === 'FWC' && Number(num) <= 8) return `WAP-${num}`
  return id
}
```

Atualizar `parseTradeList` para usar `normalizeTradeId`:

```ts
export function parseTradeList(text: string): string[] {
  const matches = text.toUpperCase().matchAll(STICKER_TOKEN_RE)
  return [...matches].map(([, team, num]) => normalizeTradeId(`${team}-${num.padStart(2, '0')}`))
}
```

- [ ] **Step 4: Confirmar que os testes passam**

```bash
npx vitest run src/lib/tradeListParse.test.ts
```

Expected: PASS (todos os testes)

- [ ] **Step 5: Commit**

```bash
git add src/lib/tradeListParse.ts src/lib/tradeListParse.test.ts
git commit -m "feat(parser): mapear FWC 00-08 para WAP na importação de listas"
```

---

## Task 5: Verificação final

- [ ] **Step 1: Typecheck completo**

```bash
npm run typecheck
```

Expected: zero erros

- [ ] **Step 2: Suite de testes completa**

```bash
npm run test:ci
```

Expected: todos os testes passando

- [ ] **Step 3: Harness de agente**

```bash
npm run ai:harness
```

Seguir as recomendações de personas listadas.

- [ ] **Step 4: Push e abertura de PR**

```bash
git push -u origin fix/258-wap-to-fwc-display
```

Abrir PR com `Closes #258` na descrição.
