# Spec: Trocas Justas

Date: 2026-06-09
Owner: Rafael Pereira
Status: Draft
Issue: https://github.com/marcelotust/copado26web/issues/269

## Problem

A página atual de Trading Partners faz a interseção *flat* entre meus duplicados e o que o parceiro precisa, sem nenhum sinal de valor. Um Messi (`ARG-17`) aparece misturado no balde com um escudo da Curaçao (`CUW-01`), o que convida trocas predatórias e cansa o usuário a filtrar manualmente o que vale a pena. Precisamos sinalizar visualmente quais cromos têm um *peer* equivalente do outro lado e quais ficam descobertos.

## Users and Surfaces

- Primary user: colecionador autenticado com `trading_public=true` e ≥1 parceiro recomendado.
- App surfaces: `/trading-partners` (autenticado).
- Locale impact: pt-BR, en, es.

## Scope

In:

- Classificação client-side de cada figurinha em categoria de valor: foil, special (CC), star, regular (com tier de seleção S/A/B/C/D).
- Pareamento greedy por categoria nos dois lados (incoming/outgoing) de cada `TradePartnerCard`, separando IDs em "Justas" (com peer equivalente) e "Cuidado" (sem peer).
- Toggle global "Só trocas justas" na `TradingPartnersPage`, persistido em `localStorage`.
- Texto compartilhado (WhatsApp/clipboard) respeita o toggle.
- Telemetria: dois novos eventos sem PII.

Out:

- Mudanças de schema, RPC nova ou migração.
- Sugestão automática de qual cromo pareia com qual (display-only).
- Variantes de raridade fora do álbum 2026 (shiny adicional).
- Aplicação da mesma lógica em outras telas (Friends, Trade match panel via QR) — fica como follow-up.

## Acceptance Criteria

- [ ] Em qualquer `TradePartnerCard` expandido, cada um dos dois sentidos (incoming/outgoing) é subdividido em sub-box "Justa" (verde/âmbar saturado) e "Cuidado" (âmbar dashed) quando ambos têm itens. Se um lado fica vazio, a sub-box some.
- [ ] Toggle "Só trocas justas" no header esconde todas as sub-boxes "Cuidado" e persiste em `localStorage` (`mp:fair-trade-only`).
- [ ] `classifySticker('ARG-17', catalog)` → `{ kind: 'star' }`; `classifySticker('CUW-01', catalog)` → `{ kind: 'foil' }`; `classifySticker('BRA-05', catalog)` → `{ kind: 'regular', teamTier: 'S' }`; `classifySticker('CC-01', catalog)` → `{ kind: 'special' }`.
- [ ] Pareamento simétrico: `|theyHave.fair| === |iHave.fair|` em qualquer entrada.
- [ ] Toda copy nova passa pelos três locales.
- [ ] Eventos `trade_fair_filter_toggled` e `trade_fair_section_viewed` respeitam consentimento via `telemetry.track` e não carregam PII (filtrados por `sanitizeAnalyticsProps`).
- [ ] WhatsApp/clipboard com `fairOnly=true` inclui só as IDs justas.

## Product and UX Notes

- Reusa o padrão de "box colorido por seção" introduzido nos commits `c77128e8` / `390955e3` — não invente nova linguagem visual.
- "Cuidado" não é um aviso de fraude — é "sem peer equivalente do outro lado". Copy precisa ser amistosa.
- Toggle vive no topo da página, não dentro de cada card — comportamento global.

## Data, Privacy, and Security

- PII involved: No. Eventos só carregam `partner_id` (UUID), `enabled` e contagens numéricas.
- Supabase tables/RPCs affected: None.
- RLS/grants affected: No.
- Analytics events affected: `trade_fair_filter_toggled`, `trade_fair_section_viewed` (novos).
- Consent impact: None — segue o gating LGPD existente do `telemetry`.

## Open Questions

- Curadoria de `STAR_PLAYERS` e `TEAM_TIERS` é editorial e vai precisar de PR de revisão depois da convocação final (jul/2026). Documentado em comentário no arquivo de dados.
