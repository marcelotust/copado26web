## Contexto

Logs dispersos no `console` dificultam correlação e suporte.

Decisão MVP: wrapper fino `src/lib/logger.js` com níveis e breadcrumbs para Sentry.

## Escopo

- API mínima: `debug`, `info`, `warn`, `error` com `feature`, `action`, `correlation_id`, `error_code`.
- Em dev: saída legível no console; em prod: `warn`/`error` viram breadcrumb/capture no Sentry.
- Substituir `console.*` nos fluxos MVP (auth, stickers, settings) — não no scanner.

## Fora de escopo

- Envio de logs para backend próprio.
- Logs de OCR/imagem.

## Critérios de aceite

- [ ] Módulo único documentado e usado nos hooks/páginas MVP.
- [ ] Nenhum log inclui e-mail ou tokens.
- [ ] Erros críticos continuam chegando ao Sentry com contexto estruturado.

## Referências

- `docs/mvp-quality-and-observability.md`
