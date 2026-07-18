# Plan: Trocas Justas

## Existing Context

- Docs read: `AGENTS.md`, `ai/agents/README.md`, `ai/specs/README.md`.
- Source files read: `src/pages/TradingPartnersPage.tsx`, `src/components/trading/TradePartnerCard.tsx`, `src/components/trading/GroupedStickerList.tsx`, `src/pages/trade/groupStickerIds.ts`, `src/data/challenges.legendary.ts`, `src/lib/telemetry/events.ts`, `src/i18n/locales/pt-BR.json`.
- Seed read: `supabase/migrations/20260512_0003_seed_catalog.sql` (IDs de craques e seções WAP/FWC/CC).

## Architecture

- Toda lógica client-side, sem novas RPCs ou colunas.
- `src/data/fairTrade.tiers.ts` — constantes (`STAR_PLAYERS`, `TEAM_TIERS`).
- `src/lib/fairTrade.ts` — pura, sem React, exporta `classifySticker` e `partitionByFairness`.
- `src/components/trading/TradePartnerCard.tsx` recebe prop `fairOnly` e renderiza sub-boxes.
- `src/pages/TradingPartnersPage.tsx` controla o toggle global + persistência.

## Implementation Slices

1. Spec folder + dados de tiers/estrelas.
2. `fairTrade.ts` + testes Vitest.
3. i18n (pt-BR, en, es).
4. Telemetria.
5. `TradePartnerCard` (sub-boxes + share text).
6. `TradingPartnersPage` (toggle + localStorage).
7. Gates + verificação no browser.
8. GitHub issue.

## Risks

| Risk | Mitigation |
| --- | --- |
| Curadoria de estrelas envelhece (machucados, cortes do treinador) | Arquivo isolado, comentários documentando fonte, fácil de PR |
| Tiers de seleção são opinativos | `TEAM_TIERS` em arquivo isolado, comentado por bloco de tier com referência a FIFA ranking |
| Greedy pode não ser ótimo em pareamento de regulares | Estratégia documentada (proximidade primeiro); teste cobre caso `{S,S,A} ↔ {S,A,A}` |
| Quebra de share text | Teste cobre cenário `fairOnly=true` |

## Verification Strategy

- Unit/component: `fairTrade.test.ts` (classify, partition, simetria, greedy proximidade). RTL em `TradePartnerCard.test.tsx` se já existir.
- E2E: dispensado — fluxo client-side em cima de RPC já coberta.
- Manual: `npm run dev` + browser em `/trading-partners` autenticado, expandir 2-3 cards, alternar toggle, conferir share.
- Observability: confirmar eventos no PostHog Live em dev.
- Supabase/security: nenhuma migração — pular `supabase-security-reviewer`.

## Rollout Notes

- Sem feature flag (feature é puramente visual, baixo risco).
- PR atrás de issue dedicada (link na descrição).
- Sem follow-up obrigatório; revisão de curadoria fica no backlog para janela pós-convocação.
