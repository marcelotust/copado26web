## Contexto

Login já mostra erros na UI; outras operações falham em silêncio.

## Escopo

- Componente ou hook compartilhado (toast/banner) com variantes sucesso/erro/info.
- Mensagens via i18n (`pt-BR`, `en`, `es`).
- Padrão para operações async: loading, sucesso, erro recuperável.
- Integração com logger/Sentry no handler de erro.

## Fora de escopo

- Scanner e erros de câmera/OCR.

## Critérios de aceite

- [ ] API documentada para páginas e hooks.
- [ ] Pelo menos um fluxo piloto migrado (ex.: settings).
- [ ] Textos de erro genéricos para usuário; detalhe técnico só no observability.

## Referências

- `src/pages/LoginPage.jsx`, `src/pages/SettingsPage.jsx`
