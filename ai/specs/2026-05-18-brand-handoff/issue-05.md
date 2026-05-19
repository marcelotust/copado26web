## Contexto

Handoff seção 09 (`/tmp/handoff/meualbum2026/project/Handoff Pack.html` linhas 1347-1413).

Estado atual:
- `src/lib/shareText.ts` é i18n-driven (`buildSharePromoBlock`, `buildMissingShareText`, `buildSwapsShareText`); **não tem** `SHARE_SIGNATURE` constante.
- `src/lib/tradeListParse.ts` já capta `/meualbum2026?\.app/i` no regex — **esta string literal DEVE ser preservada**.

## Escopo

- Em `src/lib/shareText.ts`:
  - Exportar:
    ```ts
    export const SHARE_SIGNATURE = "\n\nCola o teu álbum em meualbum2026.app — é grátis,\ne dá pra trocar sobras com a galera direto pelo zap.";
    export function buildShareText(body: string): string {
      return body + SHARE_SIGNATURE;
    }
    ```
  - Refatorar `buildMissingShareText` / `buildSwapsShareText` / `buildSharePromoBlock` para usar `buildShareText`.
- Garantir que i18n não duplica a assinatura (remover `share.cta` / `share.tagline` antigas se sobrescritas).
- Criar `e2e/share-signature.spec.ts` que cobre **swap, milestone, challenge, missing** — todos terminam com `SHARE_SIGNATURE`.
- Confirmar `tradeListParse.test.ts` continua passando (regex inalterado).

## Acceptance criteria

- `npm run test:ci src/lib/shareText` e `tradeListParse` passam.
- `npm run test:e2e:public` roda `share-signature.spec.ts` e passa.
- Manualmente: ativar share de uma troca → mensagem termina com a signature exata.
- Sem emoji na signature; sem variação por flow; uma linha em branco antes.

## Verificação

- `npm run ai:harness`; rodar `telemetry-review` (signature não pode vazar PII).

## Notas

- Signature é canônica e literal — fica fora de locales (regra explícita do handoff: "sem variação · mesma string em todos").
- Memory `[[project_telemetry]]` aplica: nada de email/token/free-form em events; isso aqui só afeta o texto compartilhado, não a telemetria.
