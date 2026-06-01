# Epic #213 — Ranking Público + Parceiros de Troca

**Date:** 2026-06-01
**Issues:** #213 (épico), #217, #215, #214, #216, #219, #218
**Out of scope:** #220 (Edge Function email Resend) — adiada

---

## Problema

O produto não tem superfícies sociais além do sistema de amigos. Usuários não conseguem se descobrir mutuamente para trocas e não há visibilidade do progresso coletivo da comunidade. Este épico adiciona um ranking público e uma página de parceiros de troca, ambos opt-in para respeitar LGPD.

---

## Não-objetivos

- A página `/ranking` não é acessível a visitantes sem login (só autenticados).
- O botão de email de sugestão de troca fica oculto até a Issue #220 ser implementada.
- Não há 5ª aba no TabNav — o layout de 4 abas é intencional.
- `is_test_user` não tem UI no app — escrita exclusiva via `service_role` no dashboard Supabase.

---

## Critérios de aceitação

- [ ] Usuários com `ranking_public = false` não aparecem em `get_public_ranking()` nem em `get_my_rank()`.
- [ ] Usuários com `is_test_user = true` nunca aparecem no ranking nem em parceiros de troca.
- [ ] Nenhuma UPDATE policy para `authenticated` em `is_test_user` — smoke test manual confirma rejeição.
- [ ] `get_my_profile()` retorna os 4 novos campos.
- [ ] Os 3 toggles em Settings salvam imediatamente via RPC e refletem o estado persisted após reload.
- [ ] `DataSharingConsentModal` aparece uma vez para usuários com nickname definido; nunca reaparece.
- [ ] A página `/ranking` exibe até 20 linhas, destaca a linha do usuário, e mostra card de rank se posição > 20.
- [ ] A página `/trading-partners` calcula `they_have_i_need` e `i_have_they_need` corretamente; Web Share API funciona com fallback clipboard.
- [ ] Widget de ranking na dashboard renderiza corretamente com `ranking_public = true` e `false`.
- [ ] Todos os novos eventos de telemetria são gateados em consentimento LGPD e sem PII.
- [ ] i18n completa em pt-BR, en e es.
- [ ] Feature flag `SOCIAL_V1 = false` por padrão; nenhuma UI exposta antes do PR 5.

---

## Estratégia de implementação: 5 PRs incrementais

O flag `SOCIAL_V1` mantém todas as novas superfícies invisíveis aos usuários até a ativação deliberada no PR 5. As migrations ficam em produção desde o PR 1 sem efeito visível.

---

## PR 1 — Fundação de dados (#217)

### Migration `20260531_0001_sharing_settings_and_test_user.sql`

```sql
ALTER TABLE public.profiles
  ADD COLUMN ranking_public    boolean NOT NULL DEFAULT false,
  ADD COLUMN trading_public    boolean NOT NULL DEFAULT false,
  ADD COLUMN email_trade_optin boolean NOT NULL DEFAULT false,
  ADD COLUMN is_test_user      boolean NOT NULL DEFAULT false;
```

**RLS para `is_test_user`:**
- SELECT: coberto pela policy existente `"profiles: owner select"` (já vale para `user_id = auth.uid()`).
- UPDATE: nenhuma policy para `authenticated` — escrever somente via `service_role`.

**RPC `update_sharing_settings(p_ranking_public bool, p_trading_public bool, p_email_trade_optin bool)`**
- SECURITY DEFINER, `set search_path = public, pg_temp`
- Atualiza apenas as 3 colunas de compartilhamento — nunca toca `is_test_user`.
- Só executável por `authenticated`.

**RPC `get_my_profile()` estendida**
- Retorna os 4 novos campos: `ranking_public`, `trading_public`, `email_trade_optin`, `is_test_user`.

### Tipos e hooks

- `src/state/friends/types.ts`: `Profile` ganha `ranking_public: boolean`, `trading_public: boolean`, `email_trade_optin: boolean`, `is_test_user: boolean`.
- `src/state/friends/useProfile.ts`: parsear 4 novos campos no retorno de `get_my_profile()`; adicionar método `updateSharingSettings(settings: SharingSettings): Promise<{ok: boolean, error?: string}>` (mesmo padrão de `updateVisibility`).
- `src/lib/telemetry/`: adicionar `FeatureFlag.SOCIAL_V1` ao enum, valor padrão `false`.

---

## PR 2 — Settings + Consent Modal (#215 + #214)

### `src/components/sharing/SettingsSharingSection.tsx`

Props recebidas de `SettingsPage`: `profile: Profile | null`, `onUpdate: (s: Partial<SharingSettings>) => Promise<void>`.

Estrutura visual (segue `SettingsAnalyticsSection`):
```
<section>
  <h2>Compartilhamento</h2>
  <div card com borda>
    <ToggleRow label hint checked loading onChange />  ← ranking_public
    <ToggleRow label hint checked loading onChange />  ← trading_public
    <ToggleRow label hint checked loading onChange />  ← email_trade_optin
  </div>
</section>
```

Cada `ToggleRow` usa `<input type="checkbox">` estilizado como switch (`role="switch"`). Loading state por toggle: spinner inline, toggle desabilitado durante a chamada. Em caso de erro: feedback via `FeedbackToast` existente.

Inserida em `SettingsPage.tsx` entre `SettingsProfileSection` e `SettingsAnalyticsSection`, gateada por `SOCIAL_V1`.

### `src/hooks/useDataSharingConsent.ts`

```ts
// localStorage key: `data_sharing_consent_v1_${userId}`
export function useDataSharingConsent(userId: string): {
  seen: boolean
  markSeen: () => void
}
```

Mesmo padrão de `useAnalyticsConsent` — sem estado de servidor, apenas localStorage.

### `src/components/sharing/DataSharingConsentModal.tsx`

- `createPortal` para `document.body`.
- Estilo: `fixed inset-0 z-50 flex items-center justify-center bg-black/60` + card `bg-slate-900 rounded-2xl border border-slate-700 p-6 max-w-sm mx-4`.
- Título, corpo explicativo, dois botões: "Gerenciar em Configurações" e "Entendi".
- Dispara `DATA_SHARING_CONSENT_MODAL_SHOWN` no mount (gateado em consentimento LGPD).

### `src/AuthenticatedApp.tsx`

Guard de exibição:
```ts
const socialEnabled = telemetry.flag(FeatureFlag.SOCIAL_V1)
const { seen: sharingConsentSeen, markSeen: markSharingConsentSeen } = useDataSharingConsent(session.user.id)
// render: socialEnabled && profile?.nickname && !sharingConsentSeen
```

Nota: sem dependência de `FRIENDS_V1` — o modal é exclusivo de `SOCIAL_V1`.

### Telemetria (PR 2)

```ts
DATA_SHARING_CONSENT_MODAL_SHOWN         // no mount do modal
DATA_SHARING_CONSENT_MODAL_TO_SETTINGS   // ao clicar "Gerenciar em Configurações"
RANKING_OPT_IN                           // ranking_public false → true
RANKING_OPT_OUT                          // ranking_public true → false
TRADING_PUBLIC_OPT_IN
TRADING_PUBLIC_OPT_OUT
```

---

## PR 3 — Páginas Sociais (#216 + #219)

### Migration `20260531_0002_ranking_and_trading_rpcs.sql`

**`get_public_ranking()`**
```sql
-- SECURITY DEFINER, authenticated
-- Retorna JSONB array com up to 20 rows
-- Colunas: user_id, nickname, display_name, avatar_url, owned_count, completion_pct, rank
-- WHERE ranking_public = true AND (is_test_user IS NULL OR is_test_user = false)
-- JOIN com user_stickers para owned_count
-- ORDER BY owned_count DESC LIMIT 20
-- rank via RANK() OVER (ORDER BY owned_count DESC)
```

**`get_my_rank()`**
```sql
-- SECURITY DEFINER, authenticated
-- Retorna posição do caller entre todos com ranking_public = true e is_test_user = false
-- NULL se caller tem ranking_public = false
-- Colunas: rank, owned_count, completion_pct
```

**`get_best_trade_partners(p_limit int default 20)`**
```sql
-- SECURITY DEFINER, authenticated
-- CTE my_needs: sticker_ids onde caller tem qty = 0 (ou sem linha)
-- CTE my_dupes: sticker_ids onde caller tem qty >= 2
-- CTE eligible: profiles com trading_public = true AND is_test_user = false AND user_id != caller
-- score = COUNT(partner_stickers onde qty>=2 AND sticker_id IN my_needs)
--       + COUNT(partner_stickers onde qty=0 AND sticker_id IN my_dupes)
-- HAVING score > 0 ORDER BY score DESC LIMIT p_limit
-- Retorna: user_id, nickname, display_name, avatar_url, completion_pct,
--          they_have_i_need (int), i_have_they_need (int)
```

### Novos arquivos

```
src/pages/RankingPage.tsx
src/pages/TradingPartnersPage.tsx
src/components/ranking/RankingRow.tsx
src/components/ranking/RankingMyRankWidget.tsx    ← reutilizado no PR 4
src/components/trading/TradePartnerCard.tsx
src/hooks/usePublicRanking.ts
src/hooks/useMyRank.ts
src/hooks/useTradePartners.ts
```

### Arquivos modificados

- `src/AuthenticatedRoutes.tsx`: rotas `/ranking` e `/trading-partners` (lazy-loaded), gateadas por `SOCIAL_V1`.
- `src/components/Header.tsx`: ícone 🏆 → `/ranking` ao lado do ícone de challenges, visível apenas com `SOCIAL_V1`.

### Comportamento de cada página

**`/ranking`:**
- Loading: skeleton animado (3 linhas placeholder).
- Lista: até 20 `RankingRow` (medalha para top 3, avatar, nome, barra de progresso, `X/994`).
- Linha do usuário: `border border-indigo-500/40 bg-indigo-950/30`.
- Se posição > 20: card `RankingMyRankWidget` abaixo da lista.
- Se `ranking_public = false`: card dimmed + link "Ativar em Configurações →".
- Estado vazio: "Nenhum usuário participando ainda."
- Tap em linha navega para `/u/:nickname`.

**`/trading-partners`:**
- Lista de `TradePartnerCard` com contadores verde (`they_have_i_need`) e âmbar (`i_have_they_need`).
- CTA "Compartilhar": Web Share API com fallback clipboard; texto pré-formatado via i18n.
- Botão email: oculto (aguarda Issue #220).
- Se `trading_public = false`: card dimmed + link settings.
- Estado vazio: texto de incentivo.

### Telemetria (PR 3)

```ts
RANKING_PAGE_VIEWED        // { user_opted_in: boolean, user_rank: number | null }
TRADING_PARTNERS_PAGE_VIEWED  // { partner_count: number }
TRADE_PARTNER_SHARE           // { channel: 'native_share' | 'clipboard' }
```

---

## PR 4 — Dashboard Widget (#218)

### Arquivos modificados

- `src/pages/DashboardPage.tsx`: importa `RankingMyRankWidget` e `useMyRank`; insere widget entre progresso global e badges/desafios; gateado por `SOCIAL_V1`.

Nenhuma nova RPC, nenhum novo arquivo.

---

## PR 5 — Ativação

Flip de `FeatureFlag.SOCIAL_V1` para `true` (via PostHog dashboard ou alteração no código do valor padrão). PR mínimo documentando a ativação.

---

## i18n — Chaves novas

### `sharing` (pt-BR)

```json
{
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
    "consentModalDismiss": "Entendi"
  }
}
```

### `ranking` e `tradingPartners` (pt-BR)

```json
{
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
    "activateInSettings": "Ativar em Configurações →"
  }
}
```

---

## Gates obrigatórios por PR

| Gate | PR 1 | PR 2 | PR 3 | PR 4 |
|------|------|------|------|------|
| `supabase-security-reviewer` | ✓ | — | ✓ | — |
| `telemetry-privacy-reviewer` | — | ✓ | ✓ | ✓ |
| i18n pt-BR + en + es | — | ✓ | ✓ | — |
| `npm run typecheck` + `lint` | ✓ | ✓ | ✓ | ✓ |
| `npm run ai:harness` | ✓ | ✓ | ✓ | ✓ |

---

## Riscos e notas

- **Performance de `get_best_trade_partners`:** O CTE com full table scan em `user_stickers` pode ser lento com muitos usuários. Monitorar explain plan; considerar materialized view como follow-up se p95 > 2s.
- **`is_test_user` nunca via authenticated:** Verificar no smoke test que `UPDATE profiles SET is_test_user = true WHERE user_id = auth.uid()` via cliente anon retorna error 42501 (permission denied).
- **Web Share API:** Não disponível em todos os browsers desktop. O fallback para clipboard via `navigator.clipboard.writeText()` deve ser testado explicitamente.
- **Modal de consentimento e reload:** Se o usuário fecha o app antes de `markSeen()` ser chamado (ex: navega para settings e fecha), o modal aparece novamente na próxima sessão — aceitável.

---

## Sequência de implementação

```
#217 (dados) → #215+#214 (UI settings+modal, paralelos) → #216+#219 (páginas, paralelas) → #218 (widget) → ativação
```
