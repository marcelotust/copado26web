## Contexto

Vercel Analytics no MVP depende de consentimento explícito para medição além do estritamente necessário.

## Escopo

- Banner ou modal na primeira visita com aceitar/recusar analytics.
- Persistir preferência (ex.: `localStorage`) e evento `consent_analytics_updated`.
- Helper de analytics só envia eventos após opt-in; documentar comportamento de pageviews.
- Cópia em i18n e link para política de privacidade.

## Fora de escopo

- CMP enterprise.
- Consentimento de câmera (scanner).

## Critérios de aceite

- [ ] Usuário pode recusar e a preferência é respeitada em reload.
- [ ] Usuário pode alterar a escolha nas configurações.
- [ ] Fluxo coberto por teste de componente ou E2E leve.

## Referências

- `docs/mvp-quality-and-observability.md`, `src/App.jsx`
