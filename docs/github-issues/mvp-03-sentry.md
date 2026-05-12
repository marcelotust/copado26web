## Contexto

Erros hoje vão principalmente para `console.error`/`console.warn` sem agregação em produção.

Decisão MVP: **Sentry** (`@sentry/react`) com source maps na Vercel.

## Escopo

- Adicionar SDK, DSN via env, `release` e `environment`.
- Inicializar no bootstrap do app; capturar erros não tratados e rejeições de Promise.
- Integrar com build Vercel para upload de source maps.
- Sanitizar contexto (sem e-mail, sem tokens, sem payload Supabase completo).

## Fora de escopo

- Scanner/OCR.
- Log pipeline centralizado (Datadog/Axiom).

## Critérios de aceite

- [ ] Erro simulado em preview aparece no Sentry com stack legível.
- [ ] PII e segredos filtrados antes do envio.
- [ ] Documentação de variáveis de ambiente para deploy.

## Referências

- `src/hooks/useAuth.js`, `src/hooks/useStickerActions.js`, `src/pages/SettingsPage.jsx`
