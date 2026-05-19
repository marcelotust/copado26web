## Contexto

Handoff seção 08 (`/tmp/handoff/meualbum2026/project/Handoff Pack.html` linhas 1190-1345).

Estado atual:
- `supabase/templates/confirm-signup.html` (88 linhas) — gradiente azul `#1d4ed8`→`#1e3a8a` + emoji ⚽.
- `supabase/templates/magic-link.html` (84 linhas) — mesmo design.

Decisão fechada: o de signup também ganha o header do magic link — consistência total entre transactional. Eyebrow varia (`BEM-VINDO` vs `LINK DE ACESSO`).

**Depende de:** #1 (`public/email/selo-56.png` hospedado em `meualbum2026.app/email/selo-56.png`).

## Escopo

- **Decidir nomenclatura** (open question do handoff): renomear `confirm-signup.html` → `signup.html` e `magic-link.html` → `magic_link.html` **só se** o Supabase Dashboard / Management API sync (mergeado em `12e0c0e`) aceitar — caso contrário, manter nomes legados.
- Criar `supabase/templates/_header.html` (partial reusável: selo 56px + wordmark + eyebrow variável).
- Refatorar `signup.html`:
  - Header dark com eyebrow `BEM-VINDO`.
  - Corpo: "Bem-vindo ao álbum." + CTA gradient (`#5b8def` → `#3ec48a`).
  - Footer com selo 24px.
  - Preheader: "Bora colar a primeira figurinha."
- Refatorar `magic_link.html`:
  - Mesmo header, eyebrow `LINK DE ACESSO`.
  - Bloco de link direto (`{{ .ConfirmationURL }}`), expira em 15 min.
  - Preheader: "Toca pra entrar — link vale por 15 minutos."
- HTML **table-based** (Outlook compat); font fallback `Helvetica, Arial, sans-serif`.
- Selo hosted em `https://meualbum2026.app/email/selo-56.png` (PNG, não SVG).
- Variáveis Supabase: `{{ .ConfirmationURL }}` para CTA · `{{ .Email }}` no rodapé.
- Texto plano alternativo obrigatório.

## Acceptance criteria

- Templates renderizam OK em Gmail, Outlook, Apple Mail (testar com mail-tester ou Litmus).
- Após sync via Management API, Dashboard mostra novos templates.
- Smoke: signup real → recebe e-mail com novo design; magic link → idem.

## Verificação

- `npm run ai:harness` — rodar `supabase-review` **obrigatoriamente** (templates afetam auth flow).
- Conferir se `docs/supabase-production-security.md` (modificado no working tree atual) precisa update.

## Risco

- Renomear arquivos pode quebrar o sync se Dashboard espera nome antigo. **Validar primeiro** o que está no Dashboard antes de renomear; alternativa: manter `confirm-signup.html` / `magic-link.html` e só refatorar o conteúdo interno.
