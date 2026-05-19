## Contexto

Handoff seções 03 (linhas 306-421), 04 (423-514), 07 (1068-1188).

Estado atual de `index.html` (linhas 5, 14, 17-31): tem favicon.svg, apple-touch-icon e og-image, mas **não** tem `<link rel="manifest">`, **não** tem splash links, e o `public/manifest.webmanifest` na raiz precisa confirmação.

**Depende de:** #1 (assets em `public/`).

## Escopo

**`index.html`:**
- Garantir `<link rel="icon" type="image/svg+xml" href="/favicon.svg">` + `.ico` fallback.
- `<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">`.
- `<link rel="manifest" href="/manifest.webmanifest">`.
- 8 `<link rel="apple-touch-startup-image" media="…">` para variantes iOS (iPhone SE → iPhone 15 Pro Max + iPad).
- Conferir cache-bust dos URLs `og:image` / `twitter:image` após swap.

**`public/manifest.webmanifest`:**
- `theme_color: "#0F172A"`, `background_color: "#0F172A"`.
- `icons`: `pwa-192.png` (any), `pwa-512.png` (maskable + any).
- `name`, `short_name` mantidos.

## Acceptance criteria

- https://maskable.app valida `pwa-512.png`.
- iOS Safari "Add to Home Screen" mostra splash correto em iPhone 14 e iPad.
- Meta debugger (FB/Twitter) lê novo OG sem cache stale.
- Lighthouse PWA score = 100.

## Verificação

- `npm run build && npm run preview`, DevTools → Application → Manifest e Service Worker.
- Real device test (iPhone + Android Chrome).

## Fora de escopo

- Gerar os PNGs (issue #1).
