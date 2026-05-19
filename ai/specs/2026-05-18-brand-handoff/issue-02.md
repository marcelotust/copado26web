## Contexto

Handoff seção 02 (`/tmp/handoff/meualbum2026/project/Handoff Pack.html` linhas 236-304). Paleta A locked.

Estado atual: `tailwind.config.js` só tem keyframes (sem palette de marca); não existem `src/styles/tokens.*`.

## Escopo

- Criar `src/styles/tokens.css`:
  ```css
  :root {
    --ink:    #0F172A;
    --ink-2:  #1A2236;
    --paper:  #F6F4EF;
    --c-blue: #5B8DEF;
    --c-rose: #EC5B87;
    --c-mint: #3EC48A;
  }
  ```
- Criar `src/styles/tokens.ts` exportando os mesmos hex como `const` tipados.
- Editar `tailwind.config.js` → `theme.extend.colors`:
  ```js
  ink:   { DEFAULT: '#0F172A', 2: '#1A2236' },
  paper: '#F6F4EF',
  brand: { blue: '#5B8DEF', rose: '#EC5B87', mint: '#3EC48A' }
  ```
- Adicionar utilities CSS `.foil` e `.foil-fill` em `src/index.css` (apenas CSS, **não** vira token).
- Importar `tokens.css` no entrypoint (`src/main.tsx` ou `src/index.css`).
- Atualizar `safelist` do Tailwind se necessário.

## Acceptance criteria

- `npm run typecheck` e `npm run lint` passam.
- Aplicar `bg-ink` ou `text-brand-blue` num componente de teste renderiza as cores corretas.
- Nenhum componente existente quebra (`npm run test:e2e:public`).

## Verificação

- `npm run ai:harness` — rodar gates recomendados.
- Diff de bundle CSS não deve aumentar > 1 KB.

## Fora de escopo

- Usar os tokens nos cards/share/email — vai vir com #3, #6, #7, #8.
