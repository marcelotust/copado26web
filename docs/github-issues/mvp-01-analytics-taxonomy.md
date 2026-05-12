## Contexto

O app já usa `@vercel/analytics` para pageviews, mas não há eventos customizados nem dicionário de propriedades. Scanner/OCR ficam **fora do MVP**.

Decisão registrada em `docs/mvp-quality-and-observability.md`: manter **Vercel Web Analytics** e `track()` no MVP.

## Escopo

- Publicar taxonomia de eventos (auth, álbum, export, reset, navegação, consentimento) sem PII.
- Implementar helper único de tracking (ex.: `src/lib/analytics.js`) que respeite consentimento LGPD.
- Instrumentar os fluxos core listados no doc.
- Documentar convenções de nome (`snake_case`) e propriedades permitidas.

## Fora de escopo

- Scanner, OCR, câmera e métricas de leitura.
- PostHog ou outro analytics avançado.

## Critérios de aceite

- [ ] Eventos do doc MVP disparam nos fluxos correspondentes.
- [ ] Nenhum evento envia e-mail, texto livre ou imagem.
- [ ] Tracking desligado quando o usuário não consentiu analytics.
- [ ] Taxonomia referenciada no README interno ou no doc MVP.

## Referências

- `docs/mvp-quality-and-observability.md`
- `src/App.jsx`, `src/hooks/useAuth.js`, `src/hooks/useStickerActions.js`, `src/pages/SettingsPage.jsx`
