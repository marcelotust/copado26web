## Contexto

Fluxos autenticados críticos não têm smoke automatizado ponta a ponta.

Decisão MVP: **Playwright** com poucos cenários estáveis.

## Escopo

- Configurar Playwright e credenciais/seed de usuário de teste (env de CI).
- Smoke: login (ou sessão injetada), navegar álbum, alterar quantidade, abrir configurações, export CSV (mock download se necessário).
- Job opcional ou nightly se flaky; documentar limitações.

## Fora de escopo

- E2E de scanner/câmera.

## Critérios de aceite

- [ ] Pelo menos um fluxo autenticado verde no CI ou workflow manual documentado.
- [ ] Sem dados reais de usuários.
- [ ] Falhas geram artefatos (trace/screenshot).

## Referências

- `src/App.jsx`, `src/pages/AlbumPage.jsx`, `src/pages/SettingsPage.jsx`
