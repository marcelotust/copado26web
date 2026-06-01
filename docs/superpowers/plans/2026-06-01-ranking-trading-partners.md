# Ranking Público + Parceiros de Troca — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Adicionar ranking público opt-in e página de parceiros de troca ao Meu Album 2026, com consentimento LGPD e feature flag `SOCIAL_V1`.

**Architecture:** 5 PRs incrementais. PR 1 adiciona colunas e RPCs ao Supabase, estende o tipo `Profile` e adiciona o feature flag `SOCIAL_V1=false`. Os PRs 2–4 adicionam UI que fica invisível até o PR 5 ativar o flag. Cada PR fecha uma ou mais issues do épico #213.

**Tech Stack:** React 18 + TypeScript, Vite, Tailwind CSS, Supabase (PostgreSQL + SECURITY DEFINER RPCs), Vitest + React Testing Library, i18n custom (`useI18n`/`t()`), PostHog feature flags via `telemetry.flag()`.

---

## File Map

### Novos arquivos
| Arquivo | Responsabilidade |
|---|---|
| `supabase/migrations/20260531_0001_sharing_settings_and_test_user.sql` | ADD COLUMN + RPC update_sharing_settings + get_my_profile atualizado |
| `supabase/migrations/20260531_0002_ranking_and_trading_rpcs.sql` | RPCs get_public_ranking, get_my_rank, get_best_trade_partners |
| `src/hooks/useDataSharingConsent.ts` | localStorage flag para modal de consentimento (visto/não visto) |
| `src/hooks/useDataSharingConsent.test.ts` | Testes do hook acima |
| `src/hooks/usePublicRanking.ts` | Chama get_public_ranking(), retorna array + loading/error |
| `src/hooks/usePublicRanking.test.ts` | Testes do hook acima |
| `src/hooks/useMyRank.ts` | Chama get_my_rank(), retorna MyRank | null + loading/error |
| `src/hooks/useMyRank.test.ts` | Testes do hook acima |
| `src/hooks/useTradePartners.ts` | Chama get_best_trade_partners(), retorna array + loading/error |
| `src/hooks/useTradePartners.test.ts` | Testes do hook acima |
| `src/components/sharing/SettingsSharingSection.tsx` | 3 toggles de compartilhamento na página Settings |
| `src/components/sharing/SettingsSharingSection.test.tsx` | Testes RTL da seção |
| `src/components/sharing/DataSharingConsentModal.tsx` | Modal de consentimento exibido uma vez |
| `src/components/sharing/DataSharingConsentModal.test.tsx` | Testes RTL do modal |
| `src/components/ranking/RankingRow.tsx` | Linha da tabela de ranking (posição, avatar, nome, barra, contagem) |
| `src/components/ranking/RankingMyRankWidget.tsx` | Card compacto "Seu ranking" reutilizado em RankingPage e DashboardPage |
| `src/components/ranking/RankingMyRankWidget.test.tsx` | Testes RTL do widget |
| `src/components/trading/TradePartnerCard.tsx` | Card de parceiro de troca com contadores e CTA compartilhar |
| `src/components/trading/TradePartnerCard.test.tsx` | Testes RTL do card |
| `src/pages/RankingPage.tsx` | Página /ranking |
| `src/pages/RankingPage.test.tsx` | Testes RTL da página |
| `src/pages/TradingPartnersPage.tsx` | Página /trading-partners |
| `src/pages/TradingPartnersPage.test.tsx` | Testes RTL da página |

### Arquivos modificados
| Arquivo | Mudança |
|---|---|
| `src/state/friends/types.ts` | Adiciona SharingSettings + 4 campos em Profile |
| `src/state/friends/useProfile.ts` | Parseia novos campos + expõe updateSharingSettings |
| `src/lib/telemetry/events.ts` | Adiciona FeatureFlag.SOCIAL_V1 + 10 novos eventos |
| `src/i18n/locales/pt-BR.json` | Chaves sharing, ranking, tradingPartners |
| `src/i18n/locales/en.json` | Idem em inglês |
| `src/i18n/locales/es.json` | Idem em espanhol |
| `src/pages/SettingsPage.tsx` | Adiciona SettingsSharingSection entre Profile e Analytics |
| `src/AuthenticatedApp.tsx` | Adiciona DataSharingConsentModal |
| `src/AuthenticatedRoutes.tsx` | Rotas /ranking e /trading-partners (lazy, gateadas) |
| `src/components/Header.tsx` | Link 🏅 para /ranking (gateado por SOCIAL_V1) |
| `src/pages/MissingPage.tsx` | Botão "Parceiros de troca →" no header actions |
| `src/pages/SwapsPage.tsx` | Botão "Parceiros de troca →" no header actions |
| `src/pages/DashboardPage.tsx` | RankingMyRankWidget entre progresso global e badges |

---

## ─────────────────────────────────────────────
## PR 1 — Fundação de dados (issue #217)
## ─────────────────────────────────────────────

### Task 1: Migration 0001 — Colunas + RPCs de perfil

**Files:**
- Create: `supabase/migrations/20260531_0001_sharing_settings_and_test_user.sql`

- [ ] **Step 1.1: Criar o arquivo de migration**

```sql
-- supabase/migrations/20260531_0001_sharing_settings_and_test_user.sql
-- Adds sharing preference columns, is_test_user flag, and update_sharing_settings RPC.
-- Also updates get_my_profile() to return the 4 new columns.

-- ============================================================================
-- COLUMNS
-- ============================================================================
ALTER TABLE public.profiles
  ADD COLUMN ranking_public    boolean NOT NULL DEFAULT false,
  ADD COLUMN trading_public    boolean NOT NULL DEFAULT false,
  ADD COLUMN email_trade_optin boolean NOT NULL DEFAULT false,
  ADD COLUMN is_test_user      boolean NOT NULL DEFAULT false;

-- ============================================================================
-- RLS NOTE: is_test_user
-- The existing "profiles: owner select" policy already covers SELECT for the
-- row owner. No UPDATE policy for authenticated is added — writes to
-- is_test_user are service_role only (Supabase dashboard or maintenance scripts).
-- ============================================================================

-- ============================================================================
-- RPC: update_sharing_settings
-- Updates only the 3 sharing columns. Never touches is_test_user.
-- ============================================================================
create or replace function public.update_sharing_settings(
  p_ranking_public    boolean,
  p_trading_public    boolean,
  p_email_trade_optin boolean
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_user uuid := auth.uid();
begin
  if v_user is null then
    raise exception 'not authenticated';
  end if;

  update public.profiles
  set
    ranking_public    = p_ranking_public,
    trading_public    = p_trading_public,
    email_trade_optin = p_email_trade_optin,
    updated_at        = now()
  where user_id = v_user;
end;
$$;

revoke all on function public.update_sharing_settings(boolean, boolean, boolean) from public;
grant execute on function public.update_sharing_settings(boolean, boolean, boolean) to authenticated;

-- ============================================================================
-- RPC: get_my_profile (replace to include new columns)
-- ============================================================================
create or replace function public.get_my_profile()
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_user uuid := auth.uid();
  v_row  public.profiles;
begin
  if v_user is null then
    raise exception 'not authenticated';
  end if;

  select * into v_row
  from public.profiles where user_id = v_user;

  if not found then
    return null;
  end if;

  return jsonb_build_object(
    'user_id',                v_row.user_id,
    'nickname',               v_row.nickname,
    'display_name',           v_row.display_name,
    'avatar_url',             v_row.avatar_url,
    'collection_visibility',  v_row.collection_visibility,
    'ranking_public',         v_row.ranking_public,
    'trading_public',         v_row.trading_public,
    'email_trade_optin',      v_row.email_trade_optin,
    'is_test_user',           v_row.is_test_user,
    'created_at',             v_row.created_at,
    'updated_at',             v_row.updated_at
  );
end;
$$;

revoke all on function public.get_my_profile() from public;
grant execute on function public.get_my_profile() to authenticated;
```

- [ ] **Step 1.2: Verificar que a migration aplica sem erros**

```bash
npx supabase db reset
# Esperado: migration applies without errors, no "column already exists"
```

- [ ] **Step 1.3: Smoke test RLS — is_test_user não pode ser escrito pelo cliente**

No Supabase Studio → SQL Editor, com o usuário anon/authenticated:
```sql
-- Isso deve falhar com "new row violates row-level security policy" ou permission denied
UPDATE public.profiles SET is_test_user = true WHERE user_id = auth.uid();
```
Esperado: erro. Se passar, a migration está incompleta.

- [ ] **Step 1.4: Commit**

```bash
git add supabase/migrations/20260531_0001_sharing_settings_and_test_user.sql
git commit -m "feat(db): add sharing columns + update_sharing_settings RPC + is_test_user

Closes #217"
```

---

### Task 2: Estender Profile type e useProfile hook

**Files:**
- Modify: `src/state/friends/types.ts`
- Modify: `src/state/friends/useProfile.ts`

- [ ] **Step 2.1: Adicionar SharingSettings e campos à Profile em `src/state/friends/types.ts`**

Substituir o bloco `export type Profile` pelo seguinte (mantendo o restante do arquivo intacto):

```typescript
export type SharingSettings = {
  ranking_public: boolean
  trading_public: boolean
  email_trade_optin: boolean
}

export type Profile = {
  user_id: string
  nickname: string
  display_name: string
  avatar_url: string | null
  collection_visibility: CollectionVisibility
  ranking_public: boolean
  trading_public: boolean
  email_trade_optin: boolean
  is_test_user: boolean
  created_at?: string
  updated_at?: string
}
```

- [ ] **Step 2.2: Adicionar `updateSharingSettings` em `src/state/friends/useProfile.ts`**

Após a função `updateVisibility`, antes do `return`, inserir:

```typescript
  async function updateSharingSettings(settings: SharingSettings): Promise<{ ok: boolean; error?: string }> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase.rpc as any)('update_sharing_settings', {
        p_ranking_public:    settings.ranking_public,
        p_trading_public:    settings.trading_public,
        p_email_trade_optin: settings.email_trade_optin,
      })
      if (error) throw error
      setState(s =>
        s.profile
          ? { ...s, profile: { ...s.profile, ...settings } }
          : s
      )
      return { ok: true }
    } catch (err: unknown) {
      return { ok: false, error: (err as { message?: string })?.message ?? String(err) }
    }
  }
```

E atualizar o `return` do hook para incluir `updateSharingSettings`:

```typescript
  return { ...state, refetch: fetchProfile, setNickname, updateDisplayName, updateVisibility, updateSharingSettings }
```

- [ ] **Step 2.3: Verificar tipos**

```bash
npm run typecheck
# Esperado: 0 errors
```

- [ ] **Step 2.4: Commit**

```bash
git add src/state/friends/types.ts src/state/friends/useProfile.ts
git commit -m "feat(profile): extend Profile type and useProfile with sharing settings"
```

---

### Task 3: Feature flag SOCIAL_V1 + eventos de telemetria

**Files:**
- Modify: `src/lib/telemetry/events.ts`

- [ ] **Step 3.1: Adicionar FeatureFlag.SOCIAL_V1 e os 10 novos eventos**

No arquivo `src/lib/telemetry/events.ts`:

1. No bloco `FeatureFlag`, adicionar após `FRIENDS_V1`:
```typescript
  SOCIAL_V1: 'social_v1',
```

2. No bloco `AnalyticsEvent`, adicionar após `QR_PROFILE_SCANNED`:
```typescript
  // Social (social_v1)
  DATA_SHARING_CONSENT_MODAL_SHOWN:       'data_sharing_consent_modal_shown',
  DATA_SHARING_CONSENT_MODAL_TO_SETTINGS: 'data_sharing_consent_modal_to_settings',
  RANKING_OPT_IN:                         'ranking_opt_in',
  RANKING_OPT_OUT:                        'ranking_opt_out',
  TRADING_PUBLIC_OPT_IN:                  'trading_public_opt_in',
  TRADING_PUBLIC_OPT_OUT:                 'trading_public_opt_out',
  RANKING_PAGE_VIEWED:                    'ranking_page_viewed',
  TRADING_PARTNERS_PAGE_VIEWED:           'trading_partners_page_viewed',
  TRADE_PARTNER_SHARE:                    'trade_partner_share',
```

- [ ] **Step 3.2: Verificar tipos**

```bash
npm run typecheck
# Esperado: 0 errors
```

- [ ] **Step 3.3: Commit**

```bash
git add src/lib/telemetry/events.ts
git commit -m "feat(telemetry): add SOCIAL_V1 feature flag and social analytics events"
```

---

### Task 4: Verificação gates do PR 1

- [ ] **Step 4.1: Rodar harness**

```bash
npm run ai:harness
# Esperado: recomenda supabase-security-reviewer para as RPCs novas
```

- [ ] **Step 4.2: Invocar supabase-security-reviewer**

Invocar o persona `/supabase-review` sobre os arquivos:
- `supabase/migrations/20260531_0001_sharing_settings_and_test_user.sql`

Confirmar: SECURITY DEFINER presente, `set search_path`, `revoke all from public`, `grant execute to authenticated`, ausência de UPDATE policy para `authenticated` em `is_test_user`.

---

## ─────────────────────────────────────────────
## PR 2 — Settings + Consent Modal (#215 + #214)
## ─────────────────────────────────────────────

### Task 5: i18n — chaves do módulo sharing

**Files:**
- Modify: `src/i18n/locales/pt-BR.json`
- Modify: `src/i18n/locales/en.json`
- Modify: `src/i18n/locales/es.json`

- [ ] **Step 5.1: Adicionar bloco `sharing` em `pt-BR.json`**

Adicionar no final do objeto JSON (antes do `}`), após o bloco `friends`:

```json
  "sharing": {
    "settingsTitle": "Compartilhamento",
    "rankingToggleLabel": "Aparecer no ranking público",
    "rankingToggleHint": "Seu nickname e % de conclusão ficam visíveis para todos.",
    "tradingToggleLabel": "Permitir sugestões de troca",
    "tradingToggleHint": "Outros usuários podem ver que você tem figurinhas para trocar.",
    "emailToggleLabel": "Receber emails de parceiros de troca",
    "emailToggleHint": "Seu email nunca será exibido. Só recebe contatos de quem também optou.",
    "consentModalTitle": "Seu perfil pode ser público",
    "consentModalBody": "Se você ativar em Configurações, seu nickname e progresso aparecerão no ranking. Suas figurinhas repetidas e faltantes poderão ser visíveis para sugestões de troca. Seu email pode ser usado para receber sugestões de parceiros de troca — nunca compartilhado diretamente.",
    "consentModalCta": "Gerenciar em Configurações",
    "consentModalDismiss": "Entendi",
    "savingError": "Erro ao salvar. Tente novamente."
  }
```

- [ ] **Step 5.2: Adicionar bloco `sharing` em `en.json`**

```json
  "sharing": {
    "settingsTitle": "Sharing",
    "rankingToggleLabel": "Appear in public ranking",
    "rankingToggleHint": "Your nickname and completion % are visible to everyone.",
    "tradingToggleLabel": "Allow trade suggestions",
    "tradingToggleHint": "Other users can see you as a trading partner.",
    "emailToggleLabel": "Receive trade partner emails",
    "emailToggleHint": "Your email is never shown. You only receive contact from users who also opted in.",
    "consentModalTitle": "Your profile can be public",
    "consentModalBody": "If you enable it in Settings, your nickname and progress will appear in the ranking. Your duplicate and missing stickers may be visible for trade suggestions. Your email can be used to receive trade partner suggestions — never shared directly.",
    "consentModalCta": "Manage in Settings",
    "consentModalDismiss": "Got it",
    "savingError": "Error saving. Please try again."
  }
```

- [ ] **Step 5.3: Adicionar bloco `sharing` em `es.json`**

```json
  "sharing": {
    "settingsTitle": "Compartir",
    "rankingToggleLabel": "Aparecer en el ranking público",
    "rankingToggleHint": "Tu nickname y % de completado son visibles para todos.",
    "tradingToggleLabel": "Permitir sugerencias de intercambio",
    "tradingToggleHint": "Otros usuarios pueden verte como socio de intercambio.",
    "emailToggleLabel": "Recibir emails de socios de intercambio",
    "emailToggleHint": "Tu email nunca se muestra. Solo recibes contacto de quienes también aceptaron.",
    "consentModalTitle": "Tu perfil puede ser público",
    "consentModalBody": "Si lo activas en Ajustes, tu nickname y progreso aparecerán en el ranking. Tus figuritas repetidas y faltantes podrían ser visibles para sugerencias de intercambio. Tu email puede usarse para recibir sugerencias de socios de intercambio — nunca se comparte directamente.",
    "consentModalCta": "Gestionar en Ajustes",
    "consentModalDismiss": "Entendido",
    "savingError": "Error al guardar. Inténtalo de nuevo."
  }
```

- [ ] **Step 5.4: Verificar tipos**

```bash
npm run typecheck && npm run lint
# Esperado: 0 errors
```

- [ ] **Step 5.5: Commit**

```bash
git add src/i18n/locales/
git commit -m "feat(i18n): add sharing section keys in pt-BR, en, es"
```

---

### Task 6: Hook useDataSharingConsent

**Files:**
- Create: `src/hooks/useDataSharingConsent.ts`
- Create: `src/hooks/useDataSharingConsent.test.ts`

- [ ] **Step 6.1: Escrever o teste primeiro**

```typescript
// src/hooks/useDataSharingConsent.test.ts
import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { useDataSharingConsent } from './useDataSharingConsent'

describe('useDataSharingConsent', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('seen is false initially', () => {
    const { result } = renderHook(() => useDataSharingConsent('user-1'))
    expect(result.current.seen).toBe(false)
  })

  it('markSeen sets seen to true', () => {
    const { result } = renderHook(() => useDataSharingConsent('user-1'))
    act(() => { result.current.markSeen() })
    expect(result.current.seen).toBe(true)
  })

  it('persists across hook remounts', () => {
    const { result: r1 } = renderHook(() => useDataSharingConsent('user-1'))
    act(() => { r1.current.markSeen() })
    const { result: r2 } = renderHook(() => useDataSharingConsent('user-1'))
    expect(r2.current.seen).toBe(true)
  })

  it('is scoped per userId', () => {
    const { result: r1 } = renderHook(() => useDataSharingConsent('user-1'))
    act(() => { r1.current.markSeen() })
    const { result: r2 } = renderHook(() => useDataSharingConsent('user-2'))
    expect(r2.current.seen).toBe(false)
  })
})
```

- [ ] **Step 6.2: Rodar o teste para confirmar falha**

```bash
npx vitest run src/hooks/useDataSharingConsent.test.ts
# Esperado: FAIL — "Cannot find module './useDataSharingConsent'"
```

- [ ] **Step 6.3: Implementar o hook**

```typescript
// src/hooks/useDataSharingConsent.ts
import { useCallback, useState } from 'react'

const storageKey = (userId: string) => `data_sharing_consent_v1_${userId}`

function readSeen(userId: string): boolean {
  try {
    return localStorage.getItem(storageKey(userId)) === 'seen'
  } catch {
    return false
  }
}

export function useDataSharingConsent(userId: string): {
  seen: boolean
  markSeen: () => void
} {
  const [seen, setSeen] = useState(() => readSeen(userId))

  const markSeen = useCallback(() => {
    try { localStorage.setItem(storageKey(userId), 'seen') } catch { /* quota */ }
    setSeen(true)
  }, [userId])

  return { seen, markSeen }
}
```

- [ ] **Step 6.4: Rodar o teste para confirmar passou**

```bash
npx vitest run src/hooks/useDataSharingConsent.test.ts
# Esperado: PASS — 4 tests passed
```

- [ ] **Step 6.5: Commit**

```bash
git add src/hooks/useDataSharingConsent.ts src/hooks/useDataSharingConsent.test.ts
git commit -m "feat(sharing): add useDataSharingConsent hook"
```

---

### Task 7: Componente SettingsSharingSection

**Files:**
- Create: `src/components/sharing/SettingsSharingSection.tsx`
- Create: `src/components/sharing/SettingsSharingSection.test.tsx`

- [ ] **Step 7.1: Escrever o teste primeiro**

```typescript
// src/components/sharing/SettingsSharingSection.test.tsx
import { describe, expect, it, vi } from 'vitest'
import { fireEvent, screen, waitFor } from '@testing-library/react'
import { renderWithProviders } from '../../test/renderWithProviders'
import SettingsSharingSection from './SettingsSharingSection'
import type { Profile } from '../../state/friends/types'

const baseProfile: Profile = {
  user_id: 'u1',
  nickname: 'joao',
  display_name: 'João',
  avatar_url: null,
  collection_visibility: 'friends',
  ranking_public: false,
  trading_public: false,
  email_trade_optin: false,
  is_test_user: false,
}

describe('SettingsSharingSection', () => {
  it('renders all 3 toggles unchecked when profile has all false', () => {
    renderWithProviders(
      <SettingsSharingSection profile={baseProfile} onUpdate={vi.fn()} />
    )
    const checkboxes = screen.getAllByRole('switch')
    expect(checkboxes).toHaveLength(3)
    checkboxes.forEach(cb => expect(cb).not.toBeChecked())
  })

  it('renders ranking toggle checked when ranking_public is true', () => {
    renderWithProviders(
      <SettingsSharingSection
        profile={{ ...baseProfile, ranking_public: true }}
        onUpdate={vi.fn()}
      />
    )
    const [rankingCb] = screen.getAllByRole('switch')
    expect(rankingCb).toBeChecked()
  })

  it('calls onUpdate with inverted ranking_public when toggle clicked', async () => {
    const onUpdate = vi.fn().mockResolvedValue({ ok: true })
    renderWithProviders(
      <SettingsSharingSection profile={baseProfile} onUpdate={onUpdate} />
    )
    const [rankingCb] = screen.getAllByRole('switch')
    fireEvent.click(rankingCb)
    await waitFor(() => {
      expect(onUpdate).toHaveBeenCalledWith({ ranking_public: true })
    })
  })

  it('does not render when profile is null', () => {
    const { container } = renderWithProviders(
      <SettingsSharingSection profile={null} onUpdate={vi.fn()} />
    )
    expect(container.firstChild).toBeNull()
  })
})
```

- [ ] **Step 7.2: Rodar o teste para confirmar falha**

```bash
npx vitest run src/components/sharing/SettingsSharingSection.test.tsx
# Esperado: FAIL — "Cannot find module './SettingsSharingSection'"
```

- [ ] **Step 7.3: Implementar o componente**

```typescript
// src/components/sharing/SettingsSharingSection.tsx
import { useState } from 'react'
import { useI18n } from '../../i18n'
import { useFeedback } from '../../contexts/FeedbackContext'
import { AnalyticsEvent, telemetry } from '../../lib/telemetry'
import type { Profile, SharingSettings } from '../../state/friends/types'

type Props = {
  profile: Profile | null
  onUpdate: (settings: Partial<SharingSettings>) => Promise<{ ok: boolean; error?: string }>
}

type ToggleKey = keyof SharingSettings

export default function SettingsSharingSection({ profile, onUpdate }: Props) {
  const { t } = useI18n()
  const feedback = useFeedback()
  const [loading, setLoading] = useState<Set<ToggleKey>>(new Set())

  if (!profile) return null

  async function handleToggle(key: ToggleKey, current: boolean) {
    if (loading.has(key)) return
    setLoading(prev => new Set(prev).add(key))
    const next = !current
    const result = await onUpdate({ [key]: next })
    setLoading(prev => { const s = new Set(prev); s.delete(key); return s })
    if (!result.ok) {
      feedback.error('sharing.savingError')
      return
    }
    if (key === 'ranking_public') {
      telemetry.track(next ? AnalyticsEvent.RANKING_OPT_IN : AnalyticsEvent.RANKING_OPT_OUT)
    } else if (key === 'trading_public') {
      telemetry.track(next ? AnalyticsEvent.TRADING_PUBLIC_OPT_IN : AnalyticsEvent.TRADING_PUBLIC_OPT_OUT)
    }
  }

  const toggles: { key: ToggleKey; labelKey: string; hintKey: string }[] = [
    { key: 'ranking_public',    labelKey: 'sharing.rankingToggleLabel', hintKey: 'sharing.rankingToggleHint' },
    { key: 'trading_public',    labelKey: 'sharing.tradingToggleLabel', hintKey: 'sharing.tradingToggleHint' },
    { key: 'email_trade_optin', labelKey: 'sharing.emailToggleLabel',   hintKey: 'sharing.emailToggleHint'   },
  ]

  return (
    <section className='flex flex-col gap-2'>
      <h2 className='text-sm font-semibold text-slate-400 uppercase tracking-wide'>
        {t('sharing.settingsTitle')}
      </h2>
      <div className='px-4 py-3 rounded-lg bg-slate-800 border border-slate-700 flex flex-col gap-4'>
        {toggles.map(({ key, labelKey, hintKey }) => {
          const checked = profile[key] as boolean
          const busy = loading.has(key)
          return (
            <label key={key} className='flex items-start gap-3 cursor-pointer'>
              <div className='relative mt-0.5 shrink-0'>
                <input
                  type='checkbox'
                  role='switch'
                  aria-checked={checked}
                  checked={checked}
                  disabled={busy}
                  onChange={() => void handleToggle(key, checked)}
                  className='sr-only peer'
                />
                <div className='w-10 h-6 rounded-full bg-slate-600 peer-checked:bg-indigo-600 transition-colors peer-disabled:opacity-50' />
                <div className='absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform peer-checked:translate-x-4' />
              </div>
              <div className='flex-1'>
                <p className='text-sm font-medium text-white leading-snug'>
                  {t(labelKey)}
                  {busy && <span className='ml-2 text-xs text-slate-400'>…</span>}
                </p>
                <p className='text-xs text-slate-400 mt-0.5'>{t(hintKey)}</p>
              </div>
            </label>
          )
        })}
      </div>
    </section>
  )
}
```

- [ ] **Step 7.4: Rodar o teste para confirmar passou**

```bash
npx vitest run src/components/sharing/SettingsSharingSection.test.tsx
# Esperado: PASS — 4 tests passed
```

- [ ] **Step 7.5: Commit**

```bash
git add src/components/sharing/
git commit -m "feat(sharing): add SettingsSharingSection with 3 toggles"
```

---

### Task 8: Componente DataSharingConsentModal

**Files:**
- Create: `src/components/sharing/DataSharingConsentModal.tsx`
- Create: `src/components/sharing/DataSharingConsentModal.test.tsx`

- [ ] **Step 8.1: Escrever o teste**

```typescript
// src/components/sharing/DataSharingConsentModal.test.tsx
import { describe, expect, it, vi } from 'vitest'
import { fireEvent, screen } from '@testing-library/react'
import { renderWithProviders } from '../../test/renderWithProviders'
import DataSharingConsentModal from './DataSharingConsentModal'

vi.mock('../../lib/telemetry', () => ({
  AnalyticsEvent: {
    DATA_SHARING_CONSENT_MODAL_SHOWN: 'data_sharing_consent_modal_shown',
    DATA_SHARING_CONSENT_MODAL_TO_SETTINGS: 'data_sharing_consent_modal_to_settings',
  },
  telemetry: { track: vi.fn() },
}))

describe('DataSharingConsentModal', () => {
  it('renders modal content', () => {
    renderWithProviders(
      <DataSharingConsentModal onDismiss={vi.fn()} onGoToSettings={vi.fn()} />
    )
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  it('calls onDismiss when dismiss button clicked', () => {
    const onDismiss = vi.fn()
    renderWithProviders(
      <DataSharingConsentModal onDismiss={onDismiss} onGoToSettings={vi.fn()} />
    )
    fireEvent.click(screen.getByTestId('consent-dismiss'))
    expect(onDismiss).toHaveBeenCalledOnce()
  })

  it('calls onGoToSettings and onDismiss when CTA clicked', () => {
    const onGoToSettings = vi.fn()
    const onDismiss = vi.fn()
    renderWithProviders(
      <DataSharingConsentModal onDismiss={onDismiss} onGoToSettings={onGoToSettings} />
    )
    fireEvent.click(screen.getByTestId('consent-cta'))
    expect(onGoToSettings).toHaveBeenCalledOnce()
    expect(onDismiss).toHaveBeenCalledOnce()
  })
})
```

- [ ] **Step 8.2: Rodar o teste para confirmar falha**

```bash
npx vitest run src/components/sharing/DataSharingConsentModal.test.tsx
# Esperado: FAIL — "Cannot find module './DataSharingConsentModal'"
```

- [ ] **Step 8.3: Implementar o componente**

```typescript
// src/components/sharing/DataSharingConsentModal.tsx
import { createPortal } from 'react-dom'
import { useEffect } from 'react'
import { useI18n } from '../../i18n'
import { AnalyticsEvent, telemetry } from '../../lib/telemetry'

type Props = {
  onDismiss: () => void
  onGoToSettings: () => void
}

export default function DataSharingConsentModal({ onDismiss, onGoToSettings }: Props) {
  const { t } = useI18n()

  useEffect(() => {
    telemetry.track(AnalyticsEvent.DATA_SHARING_CONSENT_MODAL_SHOWN)
  }, [])

  function handleCta() {
    telemetry.track(AnalyticsEvent.DATA_SHARING_CONSENT_MODAL_TO_SETTINGS)
    onGoToSettings()
    onDismiss()
  }

  return createPortal(
    <div
      className='fixed inset-0 z-50 flex items-center justify-center p-4'
      role='dialog'
      aria-modal='true'
    >
      <div className='absolute inset-0 bg-black/60 backdrop-blur-sm' aria-hidden />
      <div className='relative w-full max-w-sm rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl p-6 flex flex-col gap-4'>
        <h2 className='text-white font-bold text-base'>
          {t('sharing.consentModalTitle')}
        </h2>
        <p className='text-slate-400 text-sm leading-relaxed'>
          {t('sharing.consentModalBody')}
        </p>
        <div className='flex flex-col gap-2'>
          <button
            type='button'
            data-testid='consent-cta'
            onClick={handleCta}
            className='w-full px-4 py-2.5 rounded-lg text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-colors'
          >
            {t('sharing.consentModalCta')}
          </button>
          <button
            type='button'
            data-testid='consent-dismiss'
            onClick={onDismiss}
            className='w-full px-4 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:text-white transition-colors'
          >
            {t('sharing.consentModalDismiss')}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
```

- [ ] **Step 8.4: Rodar o teste para confirmar passou**

```bash
npx vitest run src/components/sharing/DataSharingConsentModal.test.tsx
# Esperado: PASS — 3 tests passed
```

- [ ] **Step 8.5: Commit**

```bash
git add src/components/sharing/DataSharingConsentModal.tsx src/components/sharing/DataSharingConsentModal.test.tsx
git commit -m "feat(sharing): add DataSharingConsentModal (one-time consent)"
```

---

### Task 9: Wiring — SettingsPage + AuthenticatedApp

**Files:**
- Modify: `src/pages/SettingsPage.tsx`
- Modify: `src/AuthenticatedApp.tsx`

- [ ] **Step 9.1: Atualizar `src/pages/SettingsPage.tsx`**

Adicionar import no topo:
```typescript
import SettingsSharingSection from '../components/sharing/SettingsSharingSection'
import { FeatureFlag } from '../lib/telemetry'
```

No corpo do componente, após `const { profile, setNickname, updateDisplayName, updateVisibility } = useProfile(userId)`, adicionar:
```typescript
const socialEnabled = telemetry.flag(FeatureFlag.SOCIAL_V1)
```

No JSX, logo após o bloco `{friendsEnabled && <SettingsProfileSection ... />}`, adicionar:
```tsx
{socialEnabled && (
  <SettingsSharingSection
    profile={profile}
    onUpdate={async (partial) => {
      if (!profile) return { ok: false }
      return updateSharingSettings({
        ranking_public:    partial.ranking_public    ?? profile.ranking_public,
        trading_public:    partial.trading_public    ?? profile.trading_public,
        email_trade_optin: partial.email_trade_optin ?? profile.email_trade_optin,
      })
    }}
  />
)}
```

Também atualizar o destructuring do `useProfile` para incluir `updateSharingSettings`:
```typescript
const { profile, setNickname, updateDisplayName, updateVisibility, updateSharingSettings } = useProfile(userId)
```

- [ ] **Step 9.2: Atualizar `src/AuthenticatedApp.tsx`**

Adicionar imports:
```typescript
import { useDataSharingConsent } from './hooks/useDataSharingConsent'
import DataSharingConsentModal from './components/sharing/DataSharingConsentModal'
import { FeatureFlag } from './lib/telemetry'
```

No corpo do componente (após `const { profile, setNickname } = useProfile(...)`), adicionar:
```typescript
const socialEnabled = telemetry.flag(FeatureFlag.SOCIAL_V1)
const { seen: sharingConsentSeen, markSeen: markSharingConsentSeen } = useDataSharingConsent(session.user.id)
```

Adicionar `useNavigate` ao import de `react-router-dom` se não existir — já existe no arquivo.

No JSX, após o `<MilestoneModal>`, adicionar:
```tsx
{socialEnabled && profile?.nickname && !sharingConsentSeen && (
  <DataSharingConsentModal
    onDismiss={markSharingConsentSeen}
    onGoToSettings={() => navigate('/settings')}
  />
)}
```

- [ ] **Step 9.3: Verificar tipos e lint**

```bash
npm run typecheck && npm run lint
# Esperado: 0 errors
```

- [ ] **Step 9.4: Rodar harness**

```bash
npm run ai:harness
# Seguir recomendações (telemetry-privacy-reviewer esperado)
```

- [ ] **Step 9.5: Commit**

```bash
git add src/pages/SettingsPage.tsx src/AuthenticatedApp.tsx
git commit -m "feat(sharing): wire SettingsSharingSection and DataSharingConsentModal

Closes #215
Closes #214"
```

---

## ─────────────────────────────────────────────
## PR 3 — Páginas Sociais (#216 + #219)
## ─────────────────────────────────────────────

### Task 10: Migration 0002 — RPCs de ranking e parceiros de troca

**Files:**
- Create: `supabase/migrations/20260531_0002_ranking_and_trading_rpcs.sql`

- [ ] **Step 10.1: Criar o arquivo de migration**

```sql
-- supabase/migrations/20260531_0002_ranking_and_trading_rpcs.sql
-- Adds get_public_ranking(), get_my_rank(), and get_best_trade_partners() RPCs.

-- ============================================================================
-- RPC: get_public_ranking
-- Returns JSONB array of top 20 users by owned sticker count.
-- Excludes is_test_user and users with ranking_public = false.
-- ============================================================================
create or replace function public.get_public_ranking()
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_user   uuid := auth.uid();
  v_result jsonb;
  v_total  bigint;
begin
  if v_user is null then
    raise exception 'not authenticated';
  end if;

  select count(*) into v_total from public.stickers_catalog;

  with owned as (
    select user_id, count(*) as owned_count
    from public.user_stickers
    where quantity >= 1
    group by user_id
  ),
  ranked as (
    select
      p.user_id,
      p.nickname::text as nickname,
      p.display_name,
      p.avatar_url,
      coalesce(o.owned_count, 0) as owned_count,
      round(coalesce(o.owned_count, 0)::numeric / v_total * 100, 1) as completion_pct,
      rank() over (order by coalesce(o.owned_count, 0) desc) as rank
    from public.profiles p
    left join owned o on o.user_id = p.user_id
    where p.ranking_public = true
      and (p.is_test_user is null or p.is_test_user = false)
  ),
  top20 as (
    select * from ranked limit 20
  )
  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'user_id',        user_id,
        'nickname',       nickname,
        'display_name',   display_name,
        'avatar_url',     avatar_url,
        'owned_count',    owned_count,
        'completion_pct', completion_pct,
        'rank',           rank
      ) order by rank
    ),
    '[]'::jsonb
  )
  into v_result
  from top20;

  return v_result;
end;
$$;

revoke all on function public.get_public_ranking() from public;
grant execute on function public.get_public_ranking() to authenticated;

-- ============================================================================
-- RPC: get_my_rank
-- Returns the caller's position among all ranking_public = true users.
-- Returns NULL if caller has ranking_public = false.
-- ============================================================================
create or replace function public.get_my_rank()
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_user  uuid := auth.uid();
  v_opted boolean;
  v_total bigint;
  v_result jsonb;
begin
  if v_user is null then
    raise exception 'not authenticated';
  end if;

  select ranking_public into v_opted
  from public.profiles where user_id = v_user;

  if not coalesce(v_opted, false) then
    return null;
  end if;

  select count(*) into v_total from public.stickers_catalog;

  with owned as (
    select user_id, count(*) as owned_count
    from public.user_stickers
    where quantity >= 1
    group by user_id
  ),
  ranked as (
    select
      p.user_id,
      coalesce(o.owned_count, 0) as owned_count,
      rank() over (order by coalesce(o.owned_count, 0) desc) as rank
    from public.profiles p
    left join owned o on o.user_id = p.user_id
    where p.ranking_public = true
      and (p.is_test_user is null or p.is_test_user = false)
  )
  select jsonb_build_object(
    'rank',           r.rank,
    'owned_count',    r.owned_count,
    'completion_pct', round(r.owned_count::numeric / v_total * 100, 1)
  )
  into v_result
  from ranked r
  where r.user_id = v_user;

  return coalesce(v_result, null);
end;
$$;

revoke all on function public.get_my_rank() from public;
grant execute on function public.get_my_rank() to authenticated;

-- ============================================================================
-- RPC: get_best_trade_partners
-- Returns up to p_limit users ordered by total tradeable stickers (bi-directional).
-- they_have_i_need: partner has qty >= 2 for stickers I need (qty = 0)
-- i_have_they_need: I have qty >= 2 for stickers partner needs (qty = 0)
-- Only users with trading_public = true and is_test_user = false.
-- ============================================================================
create or replace function public.get_best_trade_partners(p_limit int default 20)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_user   uuid := auth.uid();
  v_total  bigint;
  v_result jsonb;
begin
  if v_user is null then
    raise exception 'not authenticated';
  end if;

  select count(*) into v_total from public.stickers_catalog;

  with
  eligible as (
    select user_id from public.profiles
    where trading_public = true
      and (is_test_user is null or is_test_user = false)
      and user_id != v_user
  ),
  my_needs as (
    -- catalog stickers where I have qty = 0 (missing)
    select sc.id as sticker_id
    from public.stickers_catalog sc
    left join public.user_stickers ms
      on ms.user_id = v_user and ms.sticker_id = sc.id
    where coalesce(ms.quantity, 0) = 0
  ),
  my_dupes as (
    -- stickers where I have qty >= 2
    select sticker_id
    from public.user_stickers
    where user_id = v_user and quantity >= 2
  ),
  they_can_give as (
    -- for each eligible partner, count how many of my needs they can cover
    select us.user_id, count(*) as they_have_i_need
    from public.user_stickers us
    join my_needs mn on mn.sticker_id = us.sticker_id
    join eligible e on e.user_id = us.user_id
    where us.quantity >= 2
    group by us.user_id
  ),
  i_can_give as (
    -- for each eligible partner, count how many of my dupes they don't have
    select e.user_id, count(*) as i_have_they_need
    from eligible e
    cross join my_dupes md
    left join public.user_stickers us
      on us.user_id = e.user_id and us.sticker_id = md.sticker_id
    where coalesce(us.quantity, 0) = 0
    group by e.user_id
  ),
  scores as (
    select
      e.user_id,
      coalesce(tg.they_have_i_need, 0) as they_have_i_need,
      coalesce(ig.i_have_they_need, 0) as i_have_they_need
    from eligible e
    left join they_can_give tg on tg.user_id = e.user_id
    left join i_can_give    ig on ig.user_id = e.user_id
    where coalesce(tg.they_have_i_need, 0) + coalesce(ig.i_have_they_need, 0) > 0
    order by (coalesce(tg.they_have_i_need, 0) + coalesce(ig.i_have_they_need, 0)) desc
    limit p_limit
  ),
  owned as (
    select user_id, count(*) as owned_count
    from public.user_stickers where quantity >= 1
    group by user_id
  )
  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'user_id',          p.user_id,
        'nickname',         p.nickname::text,
        'display_name',     p.display_name,
        'avatar_url',       p.avatar_url,
        'completion_pct',   round(coalesce(o.owned_count, 0)::numeric / v_total * 100, 1),
        'they_have_i_need', s.they_have_i_need,
        'i_have_they_need', s.i_have_they_need
      ) order by (s.they_have_i_need + s.i_have_they_need) desc
    ),
    '[]'::jsonb
  )
  into v_result
  from scores s
  join public.profiles p on p.user_id = s.user_id
  left join owned o on o.user_id = p.user_id;

  return v_result;
end;
$$;

revoke all on function public.get_best_trade_partners(int) from public;
grant execute on function public.get_best_trade_partners(int) to authenticated;
```

- [ ] **Step 10.2: Aplicar migration localmente**

```bash
npx supabase db reset
# Esperado: todas as migrations aplicam sem erro
```

- [ ] **Step 10.3: Testar RPCs via SQL Editor (Supabase Studio local)**

```sql
-- Com usuário autenticado que tem ranking_public = true:
SELECT get_public_ranking();
-- Esperado: JSONB array (pode ser vazio se nenhum usuário optou)

SELECT get_my_rank();
-- Esperado: JSONB com rank, owned_count, completion_pct ou null

SELECT get_best_trade_partners();
-- Esperado: JSONB array
```

- [ ] **Step 10.4: Invocar supabase-security-reviewer**

```bash
npm run ai:harness
# Invocar /supabase-review para a migration 0002
```

- [ ] **Step 10.5: Commit**

```bash
git add supabase/migrations/20260531_0002_ranking_and_trading_rpcs.sql
git commit -m "feat(db): add get_public_ranking, get_my_rank, get_best_trade_partners RPCs"
```

---

### Task 11: i18n — ranking e tradingPartners

**Files:**
- Modify: `src/i18n/locales/pt-BR.json`
- Modify: `src/i18n/locales/en.json`
- Modify: `src/i18n/locales/es.json`

- [ ] **Step 11.1: Adicionar blocos `ranking` e `tradingPartners` em `pt-BR.json`**

```json
  "ranking": {
    "pageTitle": "Ranking",
    "subtitle": "Top 20 colecionadores",
    "myRank": "Seu ranking",
    "rank": "#{{n}}",
    "noRank": "Você não está no ranking",
    "noRankHint": "Ative em Configurações para aparecer.",
    "notOptedIn": "Você não está participando do ranking público.",
    "activateInSettings": "Ativar em Configurações →",
    "seeFullRanking": "Ver ranking completo →",
    "of": "de {{total}} figurinhas",
    "emptyState": "Nenhum usuário participando ainda."
  },
  "tradingPartners": {
    "pageTitle": "Parceiros de troca",
    "subtitle": "Usuários com quem você pode trocar",
    "theyHaveINeed": "{{n}} figurinhas que você precisa",
    "iHaveTheyNeed": "{{n}} figurinhas que têm de você",
    "share": "Compartilhar",
    "shareText": "@{{nickname}} tem {{m}} figurinhas que você precisa e você tem {{n}} que ele precisa. Vamos trocar? meualbum2026.app",
    "copied": "Copiado!",
    "emptyState": "Nenhum parceiro de troca encontrado no momento.",
    "emptyHint": "Continue colando figurinhas — quando outros usuários tiverem repetidas que você precisa, eles aparecem aqui.",
    "notOptedIn": "Você não está visível para sugestões de troca.",
    "activateInSettings": "Ativar em Configurações →",
    "findPartners": "Parceiros de troca →"
  }
```

- [ ] **Step 11.2: Adicionar em `en.json`**

```json
  "ranking": {
    "pageTitle": "Ranking",
    "subtitle": "Top 20 collectors",
    "myRank": "Your ranking",
    "rank": "#{{n}}",
    "noRank": "You're not in the ranking",
    "noRankHint": "Enable it in Settings to appear.",
    "notOptedIn": "You are not participating in the public ranking.",
    "activateInSettings": "Enable in Settings →",
    "seeFullRanking": "See full ranking →",
    "of": "of {{total}} stickers",
    "emptyState": "No users participating yet."
  },
  "tradingPartners": {
    "pageTitle": "Trade Partners",
    "subtitle": "Users you can trade with",
    "theyHaveINeed": "{{n}} stickers you need",
    "iHaveTheyNeed": "{{n}} stickers they need from you",
    "share": "Share",
    "shareText": "@{{nickname}} has {{m}} stickers you need and you have {{n}} they need. Let's trade! meualbum2026.app",
    "copied": "Copied!",
    "emptyState": "No trade partners found right now.",
    "emptyHint": "Keep adding stickers — when other users have duplicates you need, they'll show up here.",
    "notOptedIn": "You are not visible for trade suggestions.",
    "activateInSettings": "Enable in Settings →",
    "findPartners": "Trade Partners →"
  }
```

- [ ] **Step 11.3: Adicionar em `es.json`**

```json
  "ranking": {
    "pageTitle": "Ranking",
    "subtitle": "Top 20 coleccionistas",
    "myRank": "Tu ranking",
    "rank": "#{{n}}",
    "noRank": "No estás en el ranking",
    "noRankHint": "Actívalo en Ajustes para aparecer.",
    "notOptedIn": "No estás participando en el ranking público.",
    "activateInSettings": "Activar en Ajustes →",
    "seeFullRanking": "Ver ranking completo →",
    "of": "de {{total}} figuritas",
    "emptyState": "Ningún usuario participando todavía."
  },
  "tradingPartners": {
    "pageTitle": "Socios de intercambio",
    "subtitle": "Usuarios con los que puedes intercambiar",
    "theyHaveINeed": "{{n}} figuritas que necesitas",
    "iHaveTheyNeed": "{{n}} figuritas que necesitan de ti",
    "share": "Compartir",
    "shareText": "@{{nickname}} tiene {{m}} figuritas que necesitas y tú tienes {{n}} que él necesita. ¡Intercambiemos! meualbum2026.app",
    "copied": "¡Copiado!",
    "emptyState": "No se encontraron socios de intercambio ahora.",
    "emptyHint": "Sigue pegando figuritas — cuando otros usuarios tengan repetidas que necesitas, aparecerán aquí.",
    "notOptedIn": "No eres visible para sugerencias de intercambio.",
    "activateInSettings": "Activar en Ajustes →",
    "findPartners": "Socios de intercambio →"
  }
```

- [ ] **Step 11.4: Commit**

```bash
git add src/i18n/locales/
git commit -m "feat(i18n): add ranking and tradingPartners keys in pt-BR, en, es"
```

---

### Task 12: Hooks usePublicRanking + useMyRank

**Files:**
- Create: `src/hooks/usePublicRanking.ts`
- Create: `src/hooks/usePublicRanking.test.ts`
- Create: `src/hooks/useMyRank.ts`
- Create: `src/hooks/useMyRank.test.ts`

- [ ] **Step 12.1: Escrever tipos compartilhados e `usePublicRanking`**

```typescript
// src/hooks/usePublicRanking.ts
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export type RankingEntry = {
  user_id: string
  nickname: string
  display_name: string
  avatar_url: string | null
  owned_count: number
  completion_pct: number
  rank: number
}

type State = { entries: RankingEntry[]; loading: boolean; error: string | null }

export function usePublicRanking() {
  const [state, setState] = useState<State>({ entries: [], loading: true, error: null })

  useEffect(() => {
    let cancelled = false
    setState({ entries: [], loading: true, error: null })
    ;(async () => {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data, error } = await (supabase.rpc as any)('get_public_ranking')
        if (cancelled) return
        if (error) throw error
        setState({ entries: (data as RankingEntry[]) ?? [], loading: false, error: null })
      } catch (err) {
        if (!cancelled) setState({ entries: [], loading: false, error: String(err) })
      }
    })()
    return () => { cancelled = true }
  }, [])

  return state
}
```

- [ ] **Step 12.2: Escrever o teste de `usePublicRanking`**

```typescript
// src/hooks/usePublicRanking.test.ts
import { renderHook, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { usePublicRanking } from './usePublicRanking'

const mockEntries = [
  { user_id: 'u1', nickname: 'alice', display_name: 'Alice', avatar_url: null, owned_count: 900, completion_pct: 90.5, rank: 1 },
  { user_id: 'u2', nickname: 'bob', display_name: 'Bob', avatar_url: null, owned_count: 800, completion_pct: 80.5, rank: 2 },
]

vi.mock('../lib/supabase', () => ({
  supabase: {
    rpc: vi.fn().mockReturnValue(Promise.resolve({ data: mockEntries, error: null })),
  },
}))

describe('usePublicRanking', () => {
  it('returns loading initially then resolves entries', async () => {
    const { result } = renderHook(() => usePublicRanking())
    expect(result.current.loading).toBe(true)
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.entries).toHaveLength(2)
    expect(result.current.entries[0].nickname).toBe('alice')
    expect(result.current.error).toBeNull()
  })
})
```

- [ ] **Step 12.3: Escrever `useMyRank`**

```typescript
// src/hooks/useMyRank.ts
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export type MyRank = {
  rank: number
  owned_count: number
  completion_pct: number
}

type State = { myRank: MyRank | null; loading: boolean; error: string | null }

export function useMyRank() {
  const [state, setState] = useState<State>({ myRank: null, loading: true, error: null })

  useEffect(() => {
    let cancelled = false
    setState({ myRank: null, loading: true, error: null })
    ;(async () => {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data, error } = await (supabase.rpc as any)('get_my_rank')
        if (cancelled) return
        if (error) throw error
        setState({ myRank: (data as MyRank | null), loading: false, error: null })
      } catch (err) {
        if (!cancelled) setState({ myRank: null, loading: false, error: String(err) })
      }
    })()
    return () => { cancelled = true }
  }, [])

  return state
}
```

- [ ] **Step 12.4: Escrever o teste de `useMyRank`**

```typescript
// src/hooks/useMyRank.test.ts
import { renderHook, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { useMyRank } from './useMyRank'

vi.mock('../lib/supabase', () => ({
  supabase: {
    rpc: vi.fn().mockReturnValue(Promise.resolve({
      data: { rank: 5, owned_count: 750, completion_pct: 75.4 },
      error: null,
    })),
  },
}))

describe('useMyRank', () => {
  it('returns null while loading then resolves myRank', async () => {
    const { result } = renderHook(() => useMyRank())
    expect(result.current.loading).toBe(true)
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.myRank?.rank).toBe(5)
    expect(result.current.myRank?.completion_pct).toBe(75.4)
  })
})
```

- [ ] **Step 12.5: Rodar os testes**

```bash
npx vitest run src/hooks/usePublicRanking.test.ts src/hooks/useMyRank.test.ts
# Esperado: PASS
```

- [ ] **Step 12.6: Commit**

```bash
git add src/hooks/usePublicRanking.ts src/hooks/usePublicRanking.test.ts
git add src/hooks/useMyRank.ts src/hooks/useMyRank.test.ts
git commit -m "feat(ranking): add usePublicRanking and useMyRank hooks"
```

---

### Task 13: Componentes RankingRow + RankingMyRankWidget

**Files:**
- Create: `src/components/ranking/RankingRow.tsx`
- Create: `src/components/ranking/RankingMyRankWidget.tsx`
- Create: `src/components/ranking/RankingMyRankWidget.test.tsx`

- [ ] **Step 13.1: Criar `RankingRow.tsx`**

```typescript
// src/components/ranking/RankingRow.tsx
import { Link } from 'react-router-dom'
import type { RankingEntry } from '../../hooks/usePublicRanking'

const MEDAL: Record<number, string> = { 1: '🥇', 2: '🥈', 3: '🥉' }

type Props = {
  entry: RankingEntry
  isCurrentUser: boolean
}

export default function RankingRow({ entry, isCurrentUser }: Props) {
  const pctRounded = Math.round(entry.completion_pct)

  return (
    <Link
      to={`/u/${entry.nickname}`}
      className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors hover:bg-slate-800/60 ${
        isCurrentUser ? 'border border-indigo-500/40 bg-indigo-950/30' : ''
      }`}
    >
      <span className='w-8 text-center text-sm font-bold shrink-0 text-slate-400'>
        {MEDAL[entry.rank] ?? `#${entry.rank}`}
      </span>

      <div className='shrink-0 w-9 h-9 rounded-full bg-slate-700 overflow-hidden flex items-center justify-center'>
        {entry.avatar_url
          ? <img src={entry.avatar_url} alt='' className='w-full h-full object-cover' />
          : <span className='text-lg'>👤</span>
        }
      </div>

      <div className='flex-1 min-w-0'>
        <p className='text-sm font-semibold text-white truncate'>
          {entry.display_name || entry.nickname}
        </p>
        <p className='text-xs text-slate-400'>@{entry.nickname}</p>
        <div className='mt-1 h-1.5 rounded-full bg-slate-700 overflow-hidden'>
          <div
            className='h-full rounded-full bg-emerald-500 transition-all'
            style={{ width: `${pctRounded}%` }}
          />
        </div>
      </div>

      <div className='shrink-0 text-right'>
        <p className='text-sm font-bold text-white'>{entry.owned_count}</p>
        <p className='text-xs text-slate-500'>/ 994</p>
      </div>
    </Link>
  )
}
```

- [ ] **Step 13.2: Escrever o teste de `RankingMyRankWidget`**

```typescript
// src/components/ranking/RankingMyRankWidget.test.tsx
import { describe, expect, it } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithProviders } from '../../test/renderWithProviders'
import RankingMyRankWidget from './RankingMyRankWidget'

describe('RankingMyRankWidget', () => {
  it('shows rank and link when user is ranked', () => {
    renderWithProviders(
      <RankingMyRankWidget
        myRank={{ rank: 12, owned_count: 744, completion_pct: 74.8 }}
        rankingPublic={true}
        loading={false}
      />
    )
    expect(screen.getByText('#12')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /ranking/i })).toBeInTheDocument()
  })

  it('shows dimmed state with settings link when not opted in', () => {
    renderWithProviders(
      <RankingMyRankWidget
        myRank={null}
        rankingPublic={false}
        loading={false}
      />
    )
    expect(screen.getByRole('link', { name: /configura/i })).toBeInTheDocument()
  })

  it('shows skeleton when loading', () => {
    const { container } = renderWithProviders(
      <RankingMyRankWidget myRank={null} rankingPublic={false} loading={true} />
    )
    expect(container.querySelector('.animate-pulse')).toBeInTheDocument()
  })
})
```

- [ ] **Step 13.3: Rodar o teste para confirmar falha**

```bash
npx vitest run src/components/ranking/RankingMyRankWidget.test.tsx
# Esperado: FAIL
```

- [ ] **Step 13.4: Criar `RankingMyRankWidget.tsx`**

```typescript
// src/components/ranking/RankingMyRankWidget.tsx
import { Link } from 'react-router-dom'
import { useI18n } from '../../i18n'
import type { MyRank } from '../../hooks/useMyRank'
import { interpolate } from '../../lib/shareText'

type Props = {
  myRank: MyRank | null
  rankingPublic: boolean
  loading: boolean
}

export default function RankingMyRankWidget({ myRank, rankingPublic, loading }: Props) {
  const { t } = useI18n()

  if (loading) {
    return (
      <div className='px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 animate-pulse'>
        <div className='h-4 w-32 bg-slate-700 rounded mb-2' />
        <div className='h-3 w-48 bg-slate-700 rounded' />
      </div>
    )
  }

  if (!rankingPublic) {
    return (
      <div className='px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 opacity-60'>
        <p className='text-sm font-semibold text-white mb-1'>🏆 {t('ranking.pageTitle')}</p>
        <p className='text-xs text-slate-400 mb-2'>{t('ranking.notOptedIn')}</p>
        <Link to='/settings' className='text-xs text-indigo-400 hover:text-indigo-300'>
          {t('ranking.activateInSettings')}
        </Link>
      </div>
    )
  }

  return (
    <div className='px-4 py-3 rounded-xl bg-slate-800 border border-indigo-500/30'>
      <p className='text-sm font-semibold text-white mb-1'>🏆 {t('ranking.myRank')}</p>
      {myRank ? (
        <>
          <p className='text-2xl font-bold text-indigo-400 mb-0.5'>
            {interpolate(t('ranking.rank'), { n: String(myRank.rank) })}
          </p>
          <p className='text-xs text-slate-400 mb-2'>
            {myRank.completion_pct}% · {myRank.owned_count} {interpolate(t('ranking.of'), { total: '994' })}
          </p>
        </>
      ) : (
        <p className='text-xs text-slate-400 mb-2'>{t('ranking.noRank')}</p>
      )}
      <Link to='/ranking' className='text-xs text-indigo-400 hover:text-indigo-300'>
        {t('ranking.seeFullRanking')}
      </Link>
    </div>
  )
}
```

- [ ] **Step 13.5: Rodar o teste para confirmar passou**

```bash
npx vitest run src/components/ranking/RankingMyRankWidget.test.tsx
# Esperado: PASS — 3 tests passed
```

- [ ] **Step 13.6: Commit**

```bash
git add src/components/ranking/
git commit -m "feat(ranking): add RankingRow and RankingMyRankWidget components"
```

---

### Task 14: Página RankingPage

**Files:**
- Create: `src/pages/RankingPage.tsx`
- Create: `src/pages/RankingPage.test.tsx`

- [ ] **Step 14.1: Escrever o teste**

```typescript
// src/pages/RankingPage.test.tsx
import { describe, expect, it, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import { renderWithProviders } from '../test/renderWithProviders'
import RankingPage from './RankingPage'

vi.mock('../hooks/usePublicRanking', () => ({
  usePublicRanking: vi.fn().mockReturnValue({
    entries: [
      { user_id: 'u1', nickname: 'alice', display_name: 'Alice', avatar_url: null, owned_count: 900, completion_pct: 90.5, rank: 1 },
    ],
    loading: false,
    error: null,
  }),
}))

vi.mock('../hooks/useMyRank', () => ({
  useMyRank: vi.fn().mockReturnValue({ myRank: null, loading: false, error: null }),
}))

vi.mock('../state/friends', () => ({
  useProfile: vi.fn().mockReturnValue({
    profile: {
      user_id: 'u2', nickname: 'bob', display_name: 'Bob', avatar_url: null,
      collection_visibility: 'friends', ranking_public: true,
      trading_public: false, email_trade_optin: false, is_test_user: false,
    },
    loading: false, error: null,
  }),
}))

vi.mock('../lib/telemetry', () => ({
  AnalyticsEvent: { RANKING_PAGE_VIEWED: 'ranking_page_viewed' },
  telemetry: { track: vi.fn() },
}))

describe('RankingPage', () => {
  it('renders the ranking list', async () => {
    renderWithProviders(<RankingPage userId='u2' />)
    await waitFor(() => expect(screen.getByText('Alice')).toBeInTheDocument())
  })

  it('highlights current user row', async () => {
    const { usePublicRanking } = await import('../hooks/usePublicRanking')
    vi.mocked(usePublicRanking).mockReturnValue({
      entries: [{ user_id: 'u2', nickname: 'bob', display_name: 'Bob', avatar_url: null, owned_count: 800, completion_pct: 80.5, rank: 1 }],
      loading: false, error: null,
    })
    renderWithProviders(<RankingPage userId='u2' />)
    await waitFor(() => {
      const row = screen.getByText('Bob').closest('a')
      expect(row?.className).toContain('border-indigo-500')
    })
  })
})
```

- [ ] **Step 14.2: Rodar o teste para confirmar falha**

```bash
npx vitest run src/pages/RankingPage.test.tsx
# Esperado: FAIL
```

- [ ] **Step 14.3: Implementar `RankingPage.tsx`**

```typescript
// src/pages/RankingPage.tsx
import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useI18n } from '../i18n'
import { usePublicRanking } from '../hooks/usePublicRanking'
import { useMyRank } from '../hooks/useMyRank'
import { useProfile } from '../state/friends'
import { AnalyticsEvent, telemetry } from '../lib/telemetry'
import RankingRow from '../components/ranking/RankingRow'
import RankingMyRankWidget from '../components/ranking/RankingMyRankWidget'

type Props = { userId: string }

export default function RankingPage({ userId }: Props) {
  const { t } = useI18n()
  const { entries, loading: listLoading } = usePublicRanking()
  const { myRank, loading: rankLoading } = useMyRank()
  const { profile } = useProfile(userId)

  const rankingPublic = profile?.ranking_public ?? false
  const userInTop20 = entries.some(e => e.user_id === userId)

  useEffect(() => {
    telemetry.track(AnalyticsEvent.RANKING_PAGE_VIEWED, {
      user_opted_in: rankingPublic,
      user_rank: myRank?.rank ?? null,
    })
  }, [rankingPublic, myRank?.rank])

  return (
    <div className='flex flex-col h-full'>
      <div className='shrink-0 border-b border-slate-800 bg-slate-900/95 px-4 py-3'>
        <div className='mx-auto max-w-lg'>
          <h1 className='text-lg font-bold text-white'>{t('ranking.pageTitle')}</h1>
          <p className='text-sm text-slate-400'>{t('ranking.subtitle')}</p>
        </div>
      </div>

      <div className='flex-1 overflow-y-auto px-3 py-4'>
        <div className='mx-auto max-w-lg flex flex-col gap-2'>
          {listLoading ? (
            [1, 2, 3].map(i => (
              <div key={i} className='h-16 rounded-xl bg-slate-800 animate-pulse' />
            ))
          ) : entries.length === 0 ? (
            <p className='text-sm text-slate-400 text-center py-10'>{t('ranking.emptyState')}</p>
          ) : (
            entries.map(entry => (
              <RankingRow
                key={entry.user_id}
                entry={entry}
                isCurrentUser={entry.user_id === userId}
              />
            ))
          )}

          {rankingPublic && !userInTop20 && (
            <div className='mt-4'>
              <RankingMyRankWidget
                myRank={myRank}
                rankingPublic={rankingPublic}
                loading={rankLoading}
              />
            </div>
          )}

          {!rankingPublic && (
            <div className='mt-4 px-4 py-3 rounded-xl bg-slate-800/60 border border-slate-700 opacity-70'>
              <p className='text-sm text-slate-300 mb-1'>{t('ranking.notOptedIn')}</p>
              <Link to='/settings' className='text-xs text-indigo-400 hover:text-indigo-300'>
                {t('ranking.activateInSettings')}
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 14.4: Rodar o teste para confirmar passou**

```bash
npx vitest run src/pages/RankingPage.test.tsx
# Esperado: PASS
```

- [ ] **Step 14.5: Commit**

```bash
git add src/pages/RankingPage.tsx src/pages/RankingPage.test.tsx
git commit -m "feat(ranking): add RankingPage"
```

---

### Task 15: Hook useTradePartners

**Files:**
- Create: `src/hooks/useTradePartners.ts`
- Create: `src/hooks/useTradePartners.test.ts`

- [ ] **Step 15.1: Escrever o teste**

```typescript
// src/hooks/useTradePartners.test.ts
import { renderHook, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { useTradePartners } from './useTradePartners'

const mockPartners = [
  {
    user_id: 'u1', nickname: 'alice', display_name: 'Alice', avatar_url: null,
    completion_pct: 75.0, they_have_i_need: 15, i_have_they_need: 8,
  },
]

vi.mock('../lib/supabase', () => ({
  supabase: {
    rpc: vi.fn().mockReturnValue(Promise.resolve({ data: mockPartners, error: null })),
  },
}))

describe('useTradePartners', () => {
  it('returns loading then partners', async () => {
    const { result } = renderHook(() => useTradePartners())
    expect(result.current.loading).toBe(true)
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.partners).toHaveLength(1)
    expect(result.current.partners[0].they_have_i_need).toBe(15)
  })
})
```

- [ ] **Step 15.2: Implementar o hook**

```typescript
// src/hooks/useTradePartners.ts
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export type TradePartner = {
  user_id: string
  nickname: string
  display_name: string
  avatar_url: string | null
  completion_pct: number
  they_have_i_need: number
  i_have_they_need: number
}

type State = { partners: TradePartner[]; loading: boolean; error: string | null }

export function useTradePartners() {
  const [state, setState] = useState<State>({ partners: [], loading: true, error: null })

  useEffect(() => {
    let cancelled = false
    setState({ partners: [], loading: true, error: null })
    ;(async () => {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data, error } = await (supabase.rpc as any)('get_best_trade_partners')
        if (cancelled) return
        if (error) throw error
        setState({ partners: (data as TradePartner[]) ?? [], loading: false, error: null })
      } catch (err) {
        if (!cancelled) setState({ partners: [], loading: false, error: String(err) })
      }
    })()
    return () => { cancelled = true }
  }, [])

  return state
}
```

- [ ] **Step 15.3: Rodar o teste**

```bash
npx vitest run src/hooks/useTradePartners.test.ts
# Esperado: PASS
```

- [ ] **Step 15.4: Commit**

```bash
git add src/hooks/useTradePartners.ts src/hooks/useTradePartners.test.ts
git commit -m "feat(trading): add useTradePartners hook"
```

---

### Task 16: Componente TradePartnerCard

**Files:**
- Create: `src/components/trading/TradePartnerCard.tsx`
- Create: `src/components/trading/TradePartnerCard.test.tsx`

- [ ] **Step 16.1: Escrever o teste**

```typescript
// src/components/trading/TradePartnerCard.test.tsx
import { describe, expect, it, vi } from 'vitest'
import { fireEvent, screen, waitFor } from '@testing-library/react'
import { renderWithProviders } from '../../test/renderWithProviders'
import TradePartnerCard from './TradePartnerCard'
import type { TradePartner } from '../../hooks/useTradePartners'

vi.mock('../../lib/telemetry', () => ({
  AnalyticsEvent: { TRADE_PARTNER_SHARE: 'trade_partner_share' },
  telemetry: { track: vi.fn() },
}))

const partner: TradePartner = {
  user_id: 'u1', nickname: 'alice', display_name: 'Alice',
  avatar_url: null, completion_pct: 75, they_have_i_need: 15, i_have_they_need: 8,
}

describe('TradePartnerCard', () => {
  it('renders partner name and counters', () => {
    renderWithProviders(<TradePartnerCard partner={partner} shareText='share text' />)
    expect(screen.getByText('Alice')).toBeInTheDocument()
    expect(screen.getByText(/15/)).toBeInTheDocument()
    expect(screen.getByText(/8/)).toBeInTheDocument()
  })

  it('share button uses clipboard fallback when Web Share unavailable', async () => {
    Object.defineProperty(navigator, 'share', { value: undefined, configurable: true })
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: vi.fn().mockResolvedValue(undefined) },
      configurable: true,
    })
    renderWithProviders(<TradePartnerCard partner={partner} shareText='share text' />)
    fireEvent.click(screen.getByRole('button', { name: /compartilh/i }))
    await waitFor(() => {
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith('share text')
    })
  })
})
```

- [ ] **Step 16.2: Implementar `TradePartnerCard.tsx`**

```typescript
// src/components/trading/TradePartnerCard.tsx
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useI18n } from '../../i18n'
import { AnalyticsEvent, telemetry } from '../../lib/telemetry'
import type { TradePartner } from '../../hooks/useTradePartners'

type Props = {
  partner: TradePartner
  shareText: string
}

export default function TradePartnerCard({ partner, shareText }: Props) {
  const { t } = useI18n()
  const [copied, setCopied] = useState(false)

  async function handleShare() {
    if (navigator.share) {
      try {
        await navigator.share({ text: shareText })
        telemetry.track(AnalyticsEvent.TRADE_PARTNER_SHARE, { channel: 'native_share' })
      } catch { /* user cancelled */ }
    } else {
      try {
        await navigator.clipboard.writeText(shareText)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
        telemetry.track(AnalyticsEvent.TRADE_PARTNER_SHARE, { channel: 'clipboard' })
      } catch { /* permissions denied */ }
    }
  }

  return (
    <div className='px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 flex flex-col gap-3'>
      <div className='flex items-center gap-3'>
        <div className='shrink-0 w-10 h-10 rounded-full bg-slate-700 overflow-hidden flex items-center justify-center'>
          {partner.avatar_url
            ? <img src={partner.avatar_url} alt='' className='w-full h-full object-cover' />
            : <span className='text-xl'>👤</span>
          }
        </div>
        <Link to={`/u/${partner.nickname}`} className='flex-1 min-w-0'>
          <p className='text-sm font-semibold text-white truncate'>{partner.display_name || partner.nickname}</p>
          <p className='text-xs text-slate-400'>@{partner.nickname} · {partner.completion_pct}%</p>
        </Link>
      </div>

      <div className='flex gap-2'>
        <span className='px-2 py-1 rounded-md bg-emerald-900/40 border border-emerald-700/40 text-xs text-emerald-300 font-medium'>
          {t('tradingPartners.theyHaveINeed', { n: String(partner.they_have_i_need) })}
        </span>
        <span className='px-2 py-1 rounded-md bg-amber-900/40 border border-amber-700/40 text-xs text-amber-300 font-medium'>
          {t('tradingPartners.iHaveTheyNeed', { n: String(partner.i_have_they_need) })}
        </span>
      </div>

      <button
        type='button'
        onClick={() => void handleShare()}
        className='flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-white text-xs font-semibold transition-colors'
      >
        {copied ? t('tradingPartners.copied') : t('tradingPartners.share')}
      </button>
    </div>
  )
}
```

- [ ] **Step 16.3: Rodar o teste**

```bash
npx vitest run src/components/trading/TradePartnerCard.test.tsx
# Esperado: PASS
```

- [ ] **Step 16.4: Commit**

```bash
git add src/components/trading/
git commit -m "feat(trading): add TradePartnerCard component with Web Share API + clipboard fallback"
```

---

### Task 17: Página TradingPartnersPage

**Files:**
- Create: `src/pages/TradingPartnersPage.tsx`
- Create: `src/pages/TradingPartnersPage.test.tsx`

- [ ] **Step 17.1: Escrever o teste**

```typescript
// src/pages/TradingPartnersPage.test.tsx
import { describe, expect, it, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import { renderWithProviders } from '../test/renderWithProviders'
import TradingPartnersPage from './TradingPartnersPage'

vi.mock('../hooks/useTradePartners', () => ({
  useTradePartners: vi.fn().mockReturnValue({
    partners: [
      { user_id: 'u1', nickname: 'alice', display_name: 'Alice', avatar_url: null,
        completion_pct: 75, they_have_i_need: 15, i_have_they_need: 8 },
    ],
    loading: false, error: null,
  }),
}))

vi.mock('../state/friends', () => ({
  useProfile: vi.fn().mockReturnValue({
    profile: {
      user_id: 'u2', nickname: 'bob', display_name: 'Bob', avatar_url: null,
      collection_visibility: 'friends', ranking_public: false,
      trading_public: true, email_trade_optin: false, is_test_user: false,
    },
    loading: false, error: null,
  }),
}))

vi.mock('../lib/telemetry', () => ({
  AnalyticsEvent: { TRADING_PARTNERS_PAGE_VIEWED: 'trading_partners_page_viewed' },
  telemetry: { track: vi.fn() },
}))

describe('TradingPartnersPage', () => {
  it('renders partner cards', async () => {
    renderWithProviders(<TradingPartnersPage userId='u2' />)
    await waitFor(() => expect(screen.getByText('Alice')).toBeInTheDocument())
  })

  it('shows not-opted-in card when trading_public is false', async () => {
    const { useProfile } = await import('../state/friends')
    vi.mocked(useProfile).mockReturnValue({
      profile: {
        user_id: 'u2', nickname: 'bob', display_name: 'Bob', avatar_url: null,
        collection_visibility: 'friends', ranking_public: false,
        trading_public: false, email_trade_optin: false, is_test_user: false,
      },
      loading: false, error: null,
      refetch: vi.fn(), setNickname: vi.fn(), updateDisplayName: vi.fn(),
      updateVisibility: vi.fn(), updateSharingSettings: vi.fn(),
    })
    renderWithProviders(<TradingPartnersPage userId='u2' />)
    await waitFor(() => expect(screen.getByRole('link', { name: /configura/i })).toBeInTheDocument())
  })
})
```

- [ ] **Step 17.2: Implementar `TradingPartnersPage.tsx`**

```typescript
// src/pages/TradingPartnersPage.tsx
import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useI18n } from '../i18n'
import { useTradePartners } from '../hooks/useTradePartners'
import { useProfile } from '../state/friends'
import { AnalyticsEvent, telemetry } from '../lib/telemetry'
import TradePartnerCard from '../components/trading/TradePartnerCard'
import { interpolate } from '../lib/shareText'

type Props = { userId: string }

export default function TradingPartnersPage({ userId }: Props) {
  const { t } = useI18n()
  const { partners, loading } = useTradePartners()
  const { profile } = useProfile(userId)

  const tradingPublic = profile?.trading_public ?? false

  useEffect(() => {
    telemetry.track(AnalyticsEvent.TRADING_PARTNERS_PAGE_VIEWED, {
      partner_count: partners.length,
    })
  }, [partners.length])

  return (
    <div className='flex flex-col h-full'>
      <div className='shrink-0 border-b border-slate-800 bg-slate-900/95 px-4 py-3'>
        <div className='mx-auto max-w-lg'>
          <h1 className='text-lg font-bold text-white'>{t('tradingPartners.pageTitle')}</h1>
          <p className='text-sm text-slate-400'>{t('tradingPartners.subtitle')}</p>
        </div>
      </div>

      <div className='flex-1 overflow-y-auto px-3 py-4'>
        <div className='mx-auto max-w-lg flex flex-col gap-3'>
          {!tradingPublic && (
            <div className='px-4 py-3 rounded-xl bg-slate-800/60 border border-slate-700 opacity-70'>
              <p className='text-sm text-slate-300 mb-1'>{t('tradingPartners.notOptedIn')}</p>
              <Link to='/settings' className='text-xs text-indigo-400 hover:text-indigo-300'>
                {t('tradingPartners.activateInSettings')}
              </Link>
            </div>
          )}

          {loading ? (
            [1, 2, 3].map(i => (
              <div key={i} className='h-28 rounded-xl bg-slate-800 animate-pulse' />
            ))
          ) : partners.length === 0 ? (
            <div className='py-10 text-center'>
              <p className='text-sm text-slate-300 mb-1'>{t('tradingPartners.emptyState')}</p>
              <p className='text-xs text-slate-500'>{t('tradingPartners.emptyHint')}</p>
            </div>
          ) : (
            partners.map(partner => {
              const shareText = interpolate(
                t('tradingPartners.shareText'),
                {
                  nickname: partner.nickname,
                  m: String(partner.they_have_i_need),
                  n: String(partner.i_have_they_need),
                }
              )
              return (
                <TradePartnerCard
                  key={partner.user_id}
                  partner={partner}
                  shareText={shareText}
                />
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 17.3: Rodar o teste**

```bash
npx vitest run src/pages/TradingPartnersPage.test.tsx
# Esperado: PASS
```

- [ ] **Step 17.4: Commit**

```bash
git add src/pages/TradingPartnersPage.tsx src/pages/TradingPartnersPage.test.tsx
git commit -m "feat(trading): add TradingPartnersPage"
```

---

### Task 18: Navigation wiring — rotas, Header, MissingPage, SwapsPage

**Files:**
- Modify: `src/AuthenticatedRoutes.tsx`
- Modify: `src/components/Header.tsx`
- Modify: `src/pages/MissingPage.tsx`
- Modify: `src/pages/SwapsPage.tsx`

- [ ] **Step 18.1: Atualizar `src/AuthenticatedRoutes.tsx`**

Adicionar imports no topo:
```typescript
const RankingPage = lazy(() => import('./pages/RankingPage'))
const TradingPartnersPage = lazy(() => import('./pages/TradingPartnersPage'))
```

Adicionar ao tipo `AuthenticatedRoutesProps`:
Nenhuma mudança necessária — `userId` já é passado.

Adicionar rotas no `<Routes>`, antes do `<Route path='*'>`:
```tsx
<Route path='/ranking' element={<RankingPage userId={userId} />} />
<Route path='/trading-partners' element={<TradingPartnersPage userId={userId} />} />
```

- [ ] **Step 18.2: Atualizar `src/components/Header.tsx`**

Adicionar import:
```typescript
import { FeatureFlag } from '../lib/telemetry'
```

Após `const friendsEnabled = telemetry.flag(FeatureFlag.FRIENDS_V1)`, adicionar:
```typescript
const socialEnabled = telemetry.flag(FeatureFlag.SOCIAL_V1)
```

No JSX, após o `<Link to='/challenges' ...>` (ícone 🏆), adicionar:
```tsx
{socialEnabled && (
  <Link
    to='/ranking'
    className='shrink-0 flex items-center justify-center w-8 h-8 rounded-lg text-indigo-400 hover:bg-indigo-500/20 transition-colors text-lg'
    aria-label='Ranking'
  >
    🏅
  </Link>
)}
```

- [ ] **Step 18.3: Atualizar `src/pages/MissingPage.tsx`**

Adicionar imports:
```typescript
import { Link } from 'react-router-dom'
import { FeatureFlag, telemetry } from '../lib/telemetry'
import { useI18n } from '../i18n'  // já importado
```

No corpo do componente, após as funções helpers, adicionar:
```typescript
const socialEnabled = telemetry.flag(FeatureFlag.SOCIAL_V1)
```

Na prop `actions` do `StickerListPageHeader`, envolver o conteúdo em um `<div className='flex items-center gap-2'>` e adicionar após `<MissingShareButtons ...>`:
```tsx
actions={totalMissing > 0 ? (
  <div className='flex items-center gap-2'>
    <MissingShareButtons groups={groups} total={totalMissing} teamName={teamName} teamFlag={teamFlag} />
    {socialEnabled && (
      <Link
        to='/trading-partners'
        className='shrink-0 flex items-center gap-1.5 px-2 sm:px-2.5 h-8 rounded-lg text-indigo-400 hover:bg-indigo-500/15 border border-transparent hover:border-indigo-500/20 transition-colors text-xs font-semibold'
      >
        {t('tradingPartners.findPartners')}
      </Link>
    )}
  </div>
) : undefined}
```

- [ ] **Step 18.4: Atualizar `src/pages/SwapsPage.tsx`**

Mesma mudança da MissingPage aplicada na `SwapsPage`:

Adicionar imports:
```typescript
import { Link } from 'react-router-dom'
import { FeatureFlag, telemetry } from '../lib/telemetry'
```

No corpo, após as funções helpers:
```typescript
const socialEnabled = telemetry.flag(FeatureFlag.SOCIAL_V1)
```

Na prop `actions`, envolver em div e adicionar link:
```tsx
actions={total > 0 ? (
  <div className='flex items-center gap-2'>
    <SwapsShareButtons groups={swapsByTeam} totalExtras={total} teamName={teamName} teamFlag={teamFlag} />
    {socialEnabled && (
      <Link
        to='/trading-partners'
        className='shrink-0 flex items-center gap-1.5 px-2 sm:px-2.5 h-8 rounded-lg text-indigo-400 hover:bg-indigo-500/15 border border-transparent hover:border-indigo-500/20 transition-colors text-xs font-semibold'
      >
        {t('tradingPartners.findPartners')}
      </Link>
    )}
  </div>
) : undefined}
```

- [ ] **Step 18.5: Verificar tipos e lint**

```bash
npm run typecheck && npm run lint
# Esperado: 0 errors
```

- [ ] **Step 18.6: Rodar todos os testes**

```bash
npm run test:ci
# Esperado: todos passam
```

- [ ] **Step 18.7: Commit**

```bash
git add src/AuthenticatedRoutes.tsx src/components/Header.tsx
git add src/pages/MissingPage.tsx src/pages/SwapsPage.tsx
git commit -m "feat(nav): wire /ranking and /trading-partners routes + entry points in Missing and Swaps

Closes #216
Closes #219"
```

---

### Task 19: Gates do PR 3

- [ ] **Step 19.1: Rodar harness**

```bash
npm run ai:harness
# Esperado: supabase-security-reviewer (migration 0002) + telemetry-privacy-reviewer
```

- [ ] **Step 19.2: Invocar supabase-security-reviewer e telemetry-privacy-reviewer**

Confirmar em supabase-review:
- `get_public_ranking`, `get_my_rank`, `get_best_trade_partners`: SECURITY DEFINER, `set search_path`, `revoke all from public`, `grant execute to authenticated`.

Confirmar em telemetry-review:
- `RANKING_PAGE_VIEWED` props: `user_opted_in` (bool) e `user_rank` (number | null) — sem PII.
- `TRADING_PARTNERS_PAGE_VIEWED` props: `partner_count` (number) — sem PII.
- `TRADE_PARTNER_SHARE` props: `channel` (string literal) — sem PII.

---

## ─────────────────────────────────────────────
## PR 4 — Dashboard Widget (#218)
## ─────────────────────────────────────────────

### Task 20: RankingMyRankWidget no DashboardPage

**Files:**
- Modify: `src/pages/DashboardPage.tsx`

- [ ] **Step 20.1: Adicionar imports em `DashboardPage.tsx`**

```typescript
import { useMyRank } from '../hooks/useMyRank'
import RankingMyRankWidget from '../components/ranking/RankingMyRankWidget'
import { FeatureFlag } from '../lib/telemetry'
import { useProfile } from '../state/friends'
```

- [ ] **Step 20.2: Adicionar dados no corpo do componente**

Após `const challengeResults = useChallengeProgress()`, adicionar:
```typescript
const socialEnabled = telemetry.flag(FeatureFlag.SOCIAL_V1)
const { myRank, loading: rankLoading } = useMyRank()
const { profile } = useProfile(userId)
```

- [ ] **Step 20.3: Inserir o widget no JSX**

No JSX do `DashboardPage`, localizar a seção de progresso global (card com `albumPct`). O widget deve aparecer logo após esse card e antes da seção de badges/desafios.

Adicionar após o card de progresso global:
```tsx
{socialEnabled && (
  <RankingMyRankWidget
    myRank={myRank}
    rankingPublic={profile?.ranking_public ?? false}
    loading={rankLoading}
  />
)}
```

- [ ] **Step 20.4: Verificar tipos**

```bash
npm run typecheck && npm run lint
# Esperado: 0 errors
```

- [ ] **Step 20.5: Rodar todos os testes**

```bash
npm run test:ci
# Esperado: todos passam
```

- [ ] **Step 20.6: Commit**

```bash
git add src/pages/DashboardPage.tsx
git commit -m "feat(dashboard): add RankingMyRankWidget between progress card and challenges

Closes #218"
```

---

## ─────────────────────────────────────────────
## PR 5 — Ativação do SOCIAL_V1
## ─────────────────────────────────────────────

### Task 21: Ativar flag SOCIAL_V1

O flag é controlado via PostHog. Não é necessário code change — ativar no dashboard PostHog para 100% dos usuários.

Se preferir ativar via código (sem PostHog):

- [ ] **Step 21.1: Alterar valor padrão do flag em `src/lib/telemetry/events.ts`**

Na composição onde `telemetry.flag(FeatureFlag.SOCIAL_V1)` é resolvido (geralmente `composite.ts` ou no PostHog adapter), o fallback padrão é `false`. Para ativar sem PostHog, mudar o fallback para `true` na resolução do flag.

Alternativamente, se o projeto não usa PostHog por padrão, checar o arquivo `src/lib/telemetry/composite.ts` para o padrão de fallback de feature flags.

- [ ] **Step 21.2: Commit**

```bash
git add src/lib/telemetry/
git commit -m "feat(social): activate SOCIAL_V1 flag — ranking and trading partners are live"
```

---

## Verificação final — critérios de aceitação

Após todos os PRs, verificar cada item do spec:

- [ ] `UPDATE profiles SET is_test_user = true WHERE user_id = auth.uid()` via cliente anon → retorna `42501` (permission denied).
- [ ] `get_my_profile()` retorna `ranking_public`, `trading_public`, `email_trade_optin`, `is_test_user`.
- [ ] Toggles de sharing salvam via RPC e persistem após reload da página.
- [ ] `DataSharingConsentModal` aparece uma vez para usuário com nickname; nunca reaparece.
- [ ] `/ranking` exibe até 20 linhas; destaca linha do usuário logado; mostra card de rank se > 20.
- [ ] `/trading-partners` calcula `they_have_i_need` e `i_have_they_need`; share funciona com fallback clipboard.
- [ ] Widget de ranking na dashboard renderiza em ambos os estados.
- [ ] `MissingPage` e `SwapsPage` mostram botão "Parceiros de troca →" quando há figurinhas e SOCIAL_V1 ativo.
- [ ] `npm run test:ci` passa.
- [ ] `npm run typecheck && npm run lint` passa.
- [ ] i18n presente em pt-BR, en e es para todos os novos textos.
