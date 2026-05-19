## Contexto

Handoff seção 01 (`/tmp/handoff/meualbum2026/project/Handoff Pack.html` linhas 118-234). 4 variants do lockup; ship target `src/components/brand/BrandMark.tsx`.

**Depende de:**
- #1 (SVGs em `public/brand/`)
- #2 (tokens TS)

## Escopo

- Criar `src/components/brand/BrandMark.tsx`:
  ```ts
  type BrandMarkVariant = 'primary' | 'stacked' | 'inline' | 'selo';
  interface Props { variant?: BrandMarkVariant; className?: string; ariaLabel?: string }
  ```
- Cada variant importa o SVG correspondente de `public/brand/` (ou inline para tree-shake).
- Default `variant='inline'`, sizing via `className`.
- Acessibilidade: `aria-label` obrigatório com fallback `"Meu Álbum 2026"`; `role="img"`.
- Usar `tokens.ts` para qualquer cor inline.
- Criar `src/components/brand/BrandMark.test.tsx` cobrindo os 4 variants (RTL).

## Acceptance criteria

- `BrandMark` renderiza em 4 lugares de teste (header, login, footer, fallback) sem ajuste de CSS.
- Vitest passa.
- Visual diff contra `Handoff Pack.html` seção 01.

## Verificação

- `npm run test:ci src/components/brand`.
- Browser smoke: importar no AppHeader e validar visual.

## Fora de escopo

- Substituir todos os usos de logo no app — adoção fica em PR separado.
