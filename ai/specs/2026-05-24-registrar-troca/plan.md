# Plan · Registrar Troca

## Mapa pro código existente

| Peça | Onde | Nota |
| --- | --- | --- |
| Match das duas pilhas | `src/components/MissingTradeChecker.tsx:48-51` | **Já existe** — `theyHave` (+1) e `youHave` (−1) saem do texto colado. Só falta acionar. |
| Aplicar delta | `supabase/.../20260512_0001_create_catalog_schema.sql:75-104` (`adjust_sticker`) | Novo `apply_trade` reusa a mesma semântica de clamp, mas em lote/atômico. |
| Update otimista + realtime | `src/state/StickersProvider.tsx:57-89` (`adjust`) | Espelhar pra versão batch (`applyTrade`). |
| RPC wrapper | `src/lib/supabase.ts` (`adjustStickerRpc`) | Adicionar `applyTradeRpc`. |
| Telemetria | `src/lib/telemetry/events.ts` | Novo `trade_recorded`, gated em consent. |
| QR (fase 2) | `src/lib/tradePayload.ts`, `src/components/TradeQRModal.tsx`, `src/components/friends/QRScanner.tsx` | Reusar geração/scan; novo encoder de bitmap. |

## Decisões de arquitetura

- **Batch atômico no servidor** em vez de N `adjust_sticker`: garante "tudo ou
  nada" (AC4) e dá uma única reconciliação de quantidades pro cliente.
- **Reusar o checker** em vez de tela nova: o match já está calculado ali; criar
  outra superfície duplicaria lógica e fragmentaria o fluxo presencial.
- **Fase 2 desacoplada:** o QR é input alternativo pro mesmo `parsed` — não muda
  o RPC nem o registrar troca.

## Riscos

- Echo do realtime durante o batch pode reverter/duplicar se o `pendingRef` não
  cobrir os N ids. Mitigar reusando o padrão de `adjust` por id.
- `youHave` deixa de ser "repetida" depois do −1 (cai pra quantity 1). Aplicar
  −1 **uma vez por carta** e recalcular o checker após o apply.
- Guest no checker: precisa do auth gate antes de chamar o RPC (AC6).

## Verificação

Ver `verification.md` (preencher na implementação). Mínimo: typecheck, lint,
test:ci, build, e verificação no browser do fluxo colar → selecionar →
registrar → álbum atualizado.
