## Contexto

Falhas em magic link, Google OAuth, seed do álbum, export CSV e reset do álbum hoje não têm feedback consistente na UI.

## Escopo

- Auth: manter/estender erros de OTP e OAuth; estados de loading claros.
- Seed pós-login: retry ou mensagem se o álbum não puder ser criado.
- Settings: feedback em export CSV e reset (sucesso e falha).
- Eventos `*_failed` e logs estruturados alinhados à taxonomia.

## Fora de escopo

- Scanner/OCR.

## Critérios de aceite

- [ ] Usuário vê mensagem acionável em cada falha listada.
- [ ] Falhas reportadas ao Sentry com `error_code` estável.
- [ ] Testes cobrindo pelo menos um caminho de erro por área (auth, export, reset).

## Referências

- `src/hooks/useAuth.js`, `src/pages/SettingsPage.jsx`
