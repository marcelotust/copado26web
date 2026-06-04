# Paste Import (Panini Format) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a textarea in Settings where users can paste the Panini app export format (`BRA 1, 2\nMEX 5`) to import their sticker collection.

**Architecture:** New pure-function library `albumPaste.ts` handles parsing and merge logic. A standalone component `SettingsImportPasteSection` mirrors the CSV import UX (preview → confirm). The component is inserted into `SettingsPage` below the existing CSV import button.

**Tech Stack:** React 18, TypeScript, Vitest, Tailwind CSS, existing `SimpleDialog`/`ConfirmModal` components, `useCatalogSnapshot` + `useReplaceAllQuantities` hooks.

---

## File Map

| Action | Path | Responsibility |
|---|---|---|
| Create | `src/lib/albumPaste.ts` | Parser, lookup builder, additive merge |
| Create | `src/lib/albumPaste.test.ts` | Unit tests for all pure functions |
| Create | `src/components/SettingsImportPasteSection.tsx` | UI component |
| Modify | `src/i18n/locales/pt-BR.json` | Add `settings.importPaste*` keys |
| Modify | `src/pages/SettingsPage.tsx` | Render new component |

---

## Task 1: Parser library (`albumPaste.ts`)

**Files:**
- Create: `src/lib/albumPaste.ts`

- [ ] **Step 1.1: Create `src/lib/albumPaste.ts`**

```ts
import type { CatalogSticker } from '../types/database'

/** team_code → sticker_number → sticker_id */
export type PasteLookup = Map<string, Map<number, string>>

export type ParsePasteResult = {
  found: Map<string, number>
  unknownCodes: string[]
}

export function buildPasteLookup(catalog: Map<string, CatalogSticker>): PasteLookup {
  const lookup: PasteLookup = new Map()
  for (const sticker of catalog.values()) {
    let byNumber = lookup.get(sticker.team_code)
    if (!byNumber) {
      byNumber = new Map()
      lookup.set(sticker.team_code, byNumber)
    }
    byNumber.set(sticker.number, sticker.id)
  }
  return lookup
}

export function parsePasteText(text: string, lookup: PasteLookup): ParsePasteResult {
  const found = new Map<string, number>()
  const unknownCodes: string[] = []
  const seenUnknown = new Set<string>()

  for (const raw of text.split('\n')) {
    const line = raw.trim()
    if (!line) continue

    const spaceIdx = line.search(/\s/)
    if (spaceIdx === -1) continue

    const teamCode = line.slice(0, spaceIdx).toUpperCase()
    const rest = line.slice(spaceIdx + 1)
    const numbers = rest
      .split(/[\s,]+/)
      .filter(Boolean)
      .map(Number)
      .filter(n => Number.isInteger(n) && n > 0)

    if (numbers.length === 0) continue

    const byNumber = lookup.get(teamCode)
    if (!byNumber) {
      if (!seenUnknown.has(teamCode)) {
        seenUnknown.add(teamCode)
        unknownCodes.push(teamCode)
      }
      continue
    }

    for (const n of numbers) {
      const id = byNumber.get(n)
      if (id) found.set(id, 1)
    }
  }

  return { found, unknownCodes }
}

export function applyPasteAdditive(
  existing: Map<string, number>,
  found: Map<string, number>,
): Map<string, number> {
  const result = new Map(existing)
  for (const id of found.keys()) {
    result.set(id, Math.max(result.get(id) ?? 0, 1))
  }
  return result
}
```

---

## Task 2: Unit tests (`albumPaste.test.ts`)

**Files:**
- Create: `src/lib/albumPaste.test.ts`

- [ ] **Step 2.1: Create `src/lib/albumPaste.test.ts`**

```ts
import { describe, expect, it } from 'vitest'
import type { CatalogSticker } from '../types/database'
import { buildPasteLookup, parsePasteText, applyPasteAdditive } from './albumPaste'

function sampleCatalog(): Map<string, CatalogSticker> {
  const stickers: CatalogSticker[] = [
    { id: 'BRA-01', team_code: 'BRA', number: 1, player_name: 'Player A', is_special: false, sort_order: 1 },
    { id: 'BRA-02', team_code: 'BRA', number: 2, player_name: 'Player B', is_special: false, sort_order: 2 },
    { id: 'MEX-05', team_code: 'MEX', number: 5, player_name: null, is_special: false, sort_order: 3 },
    { id: 'FWC-04', team_code: 'FWC', number: 4, player_name: null, is_special: true, sort_order: 4 },
  ]
  return new Map(stickers.map(s => [s.id, s]))
}

describe('buildPasteLookup', () => {
  it('indexes stickers by team_code and number', () => {
    const lookup = buildPasteLookup(sampleCatalog())
    expect(lookup.get('BRA')?.get(1)).toBe('BRA-01')
    expect(lookup.get('MEX')?.get(5)).toBe('MEX-05')
    expect(lookup.get('FWC')?.get(4)).toBe('FWC-04')
  })
})

describe('parsePasteText', () => {
  it('parses standard Panini format with commas', () => {
    const lookup = buildPasteLookup(sampleCatalog())
    const result = parsePasteText('BRA 1, 2\nMEX 5', lookup)
    expect(result.found.has('BRA-01')).toBe(true)
    expect(result.found.has('BRA-02')).toBe(true)
    expect(result.found.has('MEX-05')).toBe(true)
    expect(result.unknownCodes).toEqual([])
  })

  it('handles space-separated numbers (no commas)', () => {
    const lookup = buildPasteLookup(sampleCatalog())
    const result = parsePasteText('BRA 1 2', lookup)
    expect(result.found.has('BRA-01')).toBe(true)
    expect(result.found.has('BRA-02')).toBe(true)
  })

  it('ignores blank lines', () => {
    const lookup = buildPasteLookup(sampleCatalog())
    const result = parsePasteText('\nBRA 1\n\n', lookup)
    expect(result.found.size).toBe(1)
  })

  it('collects unknown team codes as warnings without failing', () => {
    const lookup = buildPasteLookup(sampleCatalog())
    const result = parsePasteText('BRA 1\nXXX 3\nYYY 5', lookup)
    expect(result.found.has('BRA-01')).toBe(true)
    expect(result.unknownCodes).toEqual(['XXX', 'YYY'])
  })

  it('does not duplicate unknown code warnings', () => {
    const lookup = buildPasteLookup(sampleCatalog())
    const result = parsePasteText('XXX 1\nXXX 2', lookup)
    expect(result.unknownCodes).toEqual(['XXX'])
  })

  it('returns empty found when no recognizable stickers', () => {
    const lookup = buildPasteLookup(sampleCatalog())
    const result = parsePasteText('XXX 1, 2', lookup)
    expect(result.found.size).toBe(0)
  })

  it('ignores numbers not in catalog for a known team', () => {
    const lookup = buildPasteLookup(sampleCatalog())
    const result = parsePasteText('BRA 1, 99', lookup)
    expect(result.found.has('BRA-01')).toBe(true)
    expect(result.found.size).toBe(1)
  })

  it('sets quantity to 1 for each found sticker', () => {
    const lookup = buildPasteLookup(sampleCatalog())
    const result = parsePasteText('BRA 1', lookup)
    expect(result.found.get('BRA-01')).toBe(1)
  })
})

describe('applyPasteAdditive', () => {
  it('sets new stickers to quantity 1', () => {
    const existing = new Map<string, number>()
    const found = new Map([['BRA-01', 1], ['BRA-02', 1]])
    const result = applyPasteAdditive(existing, found)
    expect(result.get('BRA-01')).toBe(1)
    expect(result.get('BRA-02')).toBe(1)
  })

  it('preserves existing quantity when higher than 1', () => {
    const existing = new Map<string, number>([['BRA-01', 3]])
    const found = new Map([['BRA-01', 1]])
    const result = applyPasteAdditive(existing, found)
    expect(result.get('BRA-01')).toBe(3)
  })

  it('keeps stickers not in found at their existing quantity', () => {
    const existing = new Map<string, number>([['MEX-05', 2]])
    const found = new Map([['BRA-01', 1]])
    const result = applyPasteAdditive(existing, found)
    expect(result.get('MEX-05')).toBe(2)
    expect(result.get('BRA-01')).toBe(1)
  })

  it('does not mutate the existing map', () => {
    const existing = new Map<string, number>([['BRA-01', 1]])
    const found = new Map([['BRA-02', 1]])
    applyPasteAdditive(existing, found)
    expect(existing.has('BRA-02')).toBe(false)
  })
})
```

- [ ] **Step 2.2: Run tests and confirm they pass**

```bash
npx vitest run src/lib/albumPaste.test.ts --reporter=verbose
```

Expected: all 13 tests pass, no failures.

- [ ] **Step 2.3: Commit**

```bash
git add src/lib/albumPaste.ts src/lib/albumPaste.test.ts
git commit -m "feat(settings): parser para importação por cola lista Panini"
```

---

## Task 3: i18n keys

**Files:**
- Modify: `src/i18n/locales/pt-BR.json` — insert after `"importErrorNetwork"` line (line 388)

- [ ] **Step 3.1: Add paste import keys to pt-BR.json**

Find the block ending at:
```json
    "importErrorNetwork": "Não foi possível salvar no servidor. Verifique a conexão e tente de novo.",
    "savePointsTitle":
```

Replace with:
```json
    "importErrorNetwork": "Não foi possível salvar no servidor. Verifique a conexão e tente de novo.",
    "importPasteLabel": "Colar lista da Panini",
    "importPastePlaceholder": "Cole aqui a lista exportada pelo app da Panini\nEx: BRA 1, 2\n    MEX 5, 7",
    "importPasteButton": "Importar lista",
    "importPasteErrorEmpty": "Nenhuma figurinha reconhecida no texto colado.",
    "importPastePreviewTitle": "Revisar importação",
    "importPasteFound": "{{n}} figurinhas encontradas",
    "importPasteUnknownCodes": "Códigos não reconhecidos: {{codes}}",
    "importPasteModeAdditive": "Adicionar ao meu álbum",
    "importPasteModeAdditiveDesc": "Só marca as figurinhas que você ainda não tem. Nada é removido.",
    "importPasteModeReplace": "Substituir tudo",
    "importPasteModeReplaceDesc": "Seu álbum atual será substituído: listadas ficam com 1, demais com 0.",
    "importPasteConfirmTitle": "Aplicar importação?",
    "importPasteConfirmDescAdditive": "As figurinhas listadas serão adicionadas ao seu álbum. Continuar?",
    "importPasteConfirmDescReplace": "Seu álbum atual será sobrescrito. Não dá para desfazer automaticamente. Continuar?",
    "importPasteImporting": "Importando…",
    "importPasteConfirmYes": "Sim, importar",
    "importPasteConfirmNo": "Voltar",
    "importPasteErrorNetwork": "Não foi possível salvar no servidor. Verifique a conexão e tente de novo.",
    "savePointsTitle":
```

- [ ] **Step 3.2: Run typecheck to confirm no i18n breakage**

```bash
npm run typecheck
```

Expected: no errors.

- [ ] **Step 3.3: Commit**

```bash
git add src/i18n/locales/pt-BR.json
git commit -m "feat(settings): chaves i18n para importação por colar lista"
```

---

## Task 4: UI component (`SettingsImportPasteSection.tsx`)

**Files:**
- Create: `src/components/SettingsImportPasteSection.tsx`

- [ ] **Step 4.1: Create `src/components/SettingsImportPasteSection.tsx`**

```tsx
import { useState } from 'react'
import { useI18n } from '../i18n'
import { buildPasteLookup, parsePasteText, applyPasteAdditive } from '../lib/albumPaste'
import { diffQuantityMaps } from '../lib/albumCsv'
import { useCatalogSnapshot, useReplaceAllQuantities } from '../state/stickersStore'
import SimpleDialog from './SimpleDialog'
import ConfirmModal from './ConfirmModal'
import { useFeedback } from '../contexts/FeedbackContext'
import { reportError } from '../lib/logger'
import { AnalyticsEvent, telemetry } from '../lib/telemetry'

type ImportMode = 'additive' | 'replace'

export default function SettingsImportPasteSection() {
  const { t } = useI18n()
  const feedback = useFeedback()
  const { catalog, quantities } = useCatalogSnapshot()
  const replaceAll = useReplaceAllQuantities()

  const [text, setText] = useState('')
  const [parseError, setParseError] = useState<string | null>(null)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [importing, setImporting] = useState(false)
  const [found, setFound] = useState<Map<string, number> | null>(null)
  const [unknownCodes, setUnknownCodes] = useState<string[]>([])
  const [mode, setMode] = useState<ImportMode>('additive')

  function buildMergedMap(f: Map<string, number>, m: ImportMode): Map<string, number> {
    return m === 'additive' ? applyPasteAdditive(quantities, f) : f
  }

  function onImport() {
    setParseError(null)
    const lookup = buildPasteLookup(catalog)
    const result = parsePasteText(text, lookup)
    if (result.found.size === 0) {
      setParseError(t('settings.importPasteErrorEmpty'))
      return
    }
    setFound(result.found)
    setUnknownCodes(result.unknownCodes)
    setPreviewOpen(true)
  }

  async function runImport() {
    if (!found) return
    const mergedMap = buildMergedMap(found, mode)
    const diff = diffQuantityMaps(quantities, mergedMap)
    setImporting(true)
    try {
      await replaceAll(mergedMap)
      telemetry.track(AnalyticsEvent.ALBUM_IMPORTED, {
        source: 'paste',
        import_mode: mode,
        found: found.size,
        unknown_count: unknownCodes.length,
        changed: diff.changedIds,
        added: diff.unitsAdded,
        removed: diff.unitsRemoved,
      })
      setConfirmOpen(false)
      setPreviewOpen(false)
      setFound(null)
      setUnknownCodes([])
      setText('')
    } catch (err) {
      reportError('paste import failed', err, { feature: 'settings', action: 'import_paste' })
      setParseError(t('settings.importPasteErrorNetwork'))
      feedback.error('feedback.importFailed')
    } finally {
      setImporting(false)
    }
  }

  const previewDiff = found ? diffQuantityMaps(quantities, buildMergedMap(found, mode)) : null

  return (
    <section className='flex flex-col gap-2'>
      <p className='text-xs text-slate-400'>{t('settings.importPasteLabel')}</p>
      <textarea
        value={text}
        onChange={e => { setText(e.target.value); setParseError(null) }}
        placeholder={t('settings.importPastePlaceholder')}
        rows={5}
        className='w-full rounded-lg bg-slate-700 text-white text-sm p-3 resize-none placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500'
      />
      <button
        type='button'
        onClick={onImport}
        disabled={!text.trim()}
        className='px-4 py-3 rounded-lg bg-slate-700 hover:bg-slate-600 text-white text-left transition-colors disabled:opacity-50'
      >
        {t('settings.importPasteButton')}
      </button>
      {parseError && <p className='text-amber-400 text-sm'>{parseError}</p>}

      <SimpleDialog
        isOpen={previewOpen}
        title={t('settings.importPastePreviewTitle')}
        onClose={() => { if (importing) return; setPreviewOpen(false) }}
      >
        <p>{t('settings.importPasteFound').replace('{{n}}', String(found?.size ?? 0))}</p>
        {unknownCodes.length > 0 && (
          <p className='mt-1 text-amber-400 text-sm'>
            {t('settings.importPasteUnknownCodes').replace('{{codes}}', unknownCodes.join(', '))}
          </p>
        )}
        {previewDiff && (
          <ul className='list-disc pl-5 space-y-1 mt-3 text-sm'>
            <li>{t('settings.importDiffChanged').replace('{{n}}', String(previewDiff.changedIds))}</li>
            <li>{t('settings.importDiffAdded').replace('{{n}}', String(previewDiff.unitsAdded))}</li>
            <li>{t('settings.importDiffRemoved').replace('{{n}}', String(previewDiff.unitsRemoved))}</li>
          </ul>
        )}

        <div className='mt-4 flex flex-col gap-3'>
          {(['additive', 'replace'] as ImportMode[]).map(m => (
            <label key={m} className='flex items-start gap-3 cursor-pointer'>
              <input
                type='radio'
                name='import-mode'
                checked={mode === m}
                onChange={() => setMode(m)}
                className='mt-0.5 accent-emerald-500'
              />
              <span>
                <span className='text-white font-medium text-sm block'>
                  {t(m === 'additive' ? 'settings.importPasteModeAdditive' : 'settings.importPasteModeReplace')}
                </span>
                <span className='text-slate-400 text-xs block'>
                  {t(m === 'additive' ? 'settings.importPasteModeAdditiveDesc' : 'settings.importPasteModeReplaceDesc')}
                </span>
              </span>
            </label>
          ))}
        </div>

        <div className='mt-6 flex flex-col gap-2'>
          <button
            type='button'
            disabled={importing}
            onClick={() => setPreviewOpen(false)}
            className='py-2.5 rounded-xl font-semibold text-sm bg-slate-700 hover:bg-slate-600 text-white'
          >
            {t('settings.importCancel')}
          </button>
          <button
            type='button'
            disabled={importing}
            onClick={() => { setPreviewOpen(false); setConfirmOpen(true) }}
            className='py-2.5 rounded-xl font-semibold text-sm bg-emerald-600 hover:bg-emerald-500 text-white'
          >
            {t('settings.importContinue')}
          </button>
        </div>
      </SimpleDialog>

      <ConfirmModal
        isOpen={confirmOpen}
        title={t('settings.importPasteConfirmTitle')}
        description={t(mode === 'additive'
          ? 'settings.importPasteConfirmDescAdditive'
          : 'settings.importPasteConfirmDescReplace')}
        confirmLabel={importing ? t('settings.importPasteImporting') : t('settings.importPasteConfirmYes')}
        cancelLabel={t('settings.importPasteConfirmNo')}
        loading={importing}
        variant='default'
        onConfirm={runImport}
        onCancel={() => { if (!importing) setConfirmOpen(false) }}
      />
    </section>
  )
}
```

- [ ] **Step 4.2: Run typecheck**

```bash
npm run typecheck
```

Expected: no errors.

- [ ] **Step 4.3: Commit**

```bash
git add src/components/SettingsImportPasteSection.tsx
git commit -m "feat(settings): componente SettingsImportPasteSection"
```

---

## Task 5: Wire into SettingsPage

**Files:**
- Modify: `src/pages/SettingsPage.tsx`

- [ ] **Step 5.1: Add import and render component in `SettingsPage.tsx`**

Add to imports (after the `SettingsImportSection` import line):
```tsx
import SettingsImportPasteSection from '../components/SettingsImportPasteSection'
```

In the JSX, after `<SettingsImportSection />`:
```tsx
<SettingsImportPasteSection />
```

The `<section>` block should look like:
```tsx
<section className='flex flex-col gap-3'>
  <h2 className='text-sm font-semibold text-slate-400 uppercase tracking-wide'>
    {t('settings.data')}
  </h2>
  <SettingsExportSection />
  <SettingsImportSection />
  <SettingsImportPasteSection />
</section>
```

- [ ] **Step 5.2: Run typecheck and tests**

```bash
npm run typecheck && npm run test:ci
```

Expected: no type errors, all tests pass.

- [ ] **Step 5.3: Commit**

```bash
git add src/pages/SettingsPage.tsx
git commit -m "feat(settings): adicionar importação por colar lista na página de configurações"
```

---

## Task 6: Run harness and open PR

- [ ] **Step 6.1: Run ai harness**

```bash
npm run ai:harness
```

Review output for recommended personas. Run any flagged gates.

- [ ] **Step 6.2: Run full test suite**

```bash
npm run test:ci
```

Expected: all tests pass.

- [ ] **Step 6.3: Run lint**

```bash
npm run lint
```

Expected: no errors.

- [ ] **Step 6.4: Open PR**

```bash
git push -u origin feat/paste-import-panini
gh pr create \
  --title "feat(settings): importar álbum colando lista da Panini" \
  --body "$(cat <<'EOF'
## Summary

- Adds a textarea in Settings (below CSV import) where users can paste the Panini app export format (`BRA 1, 2\nMEX 5`)
- Parser is lenient: unknown team codes show as warnings but don't block import
- Two merge modes: **Adicionar ao meu álbum** (additive, never reduces) and **Substituir tudo** (listed=1, rest=0)
- Preview dialog shows sticker count, unknown codes, and diff before confirming
- Telemetry via `ALBUM_IMPORTED` with `source: 'paste'` and `import_mode`

Closes #253

## Test plan

- [ ] Paste the sample Panini text from the issue; confirm preview shows correct count
- [ ] Verify unknown codes (e.g. a typo) appear as warnings, not errors
- [ ] Test "Adicionar" mode: existing stickers with qty > 1 are preserved
- [ ] Test "Substituir" mode: unlisted stickers are zeroed
- [ ] Textarea clears only after successful import, not on cancel
- [ ] `npm run test:ci` passes
- [ ] `npm run typecheck` passes

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```
