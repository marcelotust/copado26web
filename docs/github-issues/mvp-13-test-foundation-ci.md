## Contexto

Não há runner de testes nem job de CI para qualidade.

Decisão MVP: **Vitest** + **React Testing Library** + **GitHub Actions** (`test` + `build` em PR).

## Escopo

- Instalar e configurar Vitest com Vite/React.
- Setup RTL e helpers de render com providers (router, i18n).
- Workflow em `.github/workflows/` rodando testes e build em PR/push em `main`.
- Scripts `test` e `test:ci` no `package.json`.

## Fora de escopo

- Testes de scanner/OCR.

## Critérios de aceite

- [ ] `npm run test` executa localmente.
- [ ] CI falha em PR se testes ou build quebrarem.
- [ ] Documentação mínima no README ou doc MVP.

## Referências

- `package.json`, `vite.config.js`
