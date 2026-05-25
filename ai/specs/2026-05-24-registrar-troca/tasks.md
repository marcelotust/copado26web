# Tasks · Registrar Troca

Fatiamento em 2 issues/PRs. A Issue 1 entrega valor sozinha (funciona com texto
colado, que já popula o match). A Issue 2 é enriquecimento.

## Issue 1 (#194) — Registrar troca a partir do checker (+1/−1 + "Troquei todas")

**Quick win.** Não depende da fase 2.

- [ ] RPC `apply_trade(p_received text[], p_given text[])` atômico,
      `SECURITY DEFINER`, grant `authenticated`, clamp `greatest(0, ...)`,
      valida ids contra `stickers_catalog`, retorna quantidades novas.
      → migration nova em `supabase/migrations/`.
- [ ] Wrapper client `applyTradeRpc(...)` em `src/lib/supabase.ts`.
- [ ] `StickersProvider` — `applyTrade(received[], given[])` com update
      otimista em lote + `pendingRef` (espelha `adjust`, linhas 57-89).
- [ ] Classificação do paste em `analyzeTradeListPaste` — distinguir cabeçalho
      "faltam" (faltantes → lado −1) de "repetida/sobras" (repetidas → lado +1)
      via `APP_SHARE_MARKERS`; expor o tipo no resultado pra rotear o match.
- [ ] `MissingTradeChecker` — seleção por item, botão "Troquei todas",
      CTA "Registrar troca", feedback de contagem, auth gate pra guest, e
      tratamento do −1 quando o paste for ambíguo (aviso/confirmação).
- [ ] Evento `trade_recorded` em `src/lib/telemetry/events.ts`
      (`received_count`, `given_count`, `source: 'paste'`), sem PII.
- [ ] i18n pt-BR/en/es das copies novas.
- [ ] Testes: unit do clamp/atomicidade (reducer/selector), component test do
      fluxo de seleção + apply.
- [ ] Persona `supabase-security-reviewer` no RPC/migration.
- [ ] `frontend-product-engineer` no componente.

## Issue 2 (#195) — QR de álbum inteiro (bitmap) alimentando o checker

**Enriquecimento.** Depende da Issue 1 (reusa o registrar troca).

- [ ] Lib de encode/decode do bitmap posicional (índice = `sort_order`),
      com byte de versão. Testes de round-trip + payload de versão antiga.
- [ ] Geração de QR do meu álbum (reusar `qrcode.react` / padrão de
      `TradeQRModal`).
- [ ] Scan que decodifica e alimenta o `parsed` do checker
      (reusar `QRScanner`), com `source: 'qr'` no `trade_recorded`.
- [ ] i18n.
- [ ] `supabase-security-reviewer` só se tocar dados server-side (provavelmente
      client-only); `telemetry-privacy-reviewer` no payload/eventos.

## Gates por PR

`npm run ai:harness` → rodar gates recomendadas (build/lint/typecheck/test:ci).
E2E público só se mudar roteamento/guest.
