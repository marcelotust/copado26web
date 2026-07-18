# Tasks: Trocas Justas

## Implementation

- [ ] `src/data/fairTrade.tiers.ts` — STAR_PLAYERS (Set<string>) e TEAM_TIERS (Record<code, Tier>).
- [ ] `src/lib/fairTrade.ts` — `classifySticker`, `partitionByFairness`, `tierIndex`.
- [ ] `src/lib/telemetry/events.ts` — `TRADE_FAIR_FILTER_TOGGLED`, `TRADE_FAIR_SECTION_VIEWED`.
- [ ] `src/i18n/locales/{pt-BR,en,es}.json` — bloco `tradingPartners.fair.*`.
- [ ] `src/components/trading/TradePartnerCard.tsx` — sub-boxes Justa/Cuidado, share text respeita `fairOnly`.
- [ ] `src/pages/TradingPartnersPage.tsx` — toggle no header, persistência em localStorage.

## Tests

- [ ] `src/lib/fairTrade.test.ts` — Vitest cobrindo classify + partition + simetria.

## Docs and Ops

- [ ] GitHub issue criada e linkada no PR (`Closes #<n>`).
- [ ] `verification.md` preenchida com gates rodados.

## Review Checklist

- [ ] Acceptance criteria still match `spec.md`.
- [ ] Privacy and telemetry rules were checked (`telemetry-privacy-reviewer` persona).
- [ ] i18n was updated for user-facing copy.
- [ ] `npm run ai:harness` was run.
- [ ] Verification notes were completed.
