## Contexto

Handoff finalizado em Claude Design (`/tmp/handoff/meualbum2026/project/Handoff Pack.html`, seções 01, 03, 04, 05, 07 e 08).

Decisões fechadas:
- Logo direção B+D, **sem** referência a Copa/FIFA/Panini — apenas "Meu Álbum" + "26/2026".
- Paleta A locked (ink `#0F172A` · paper `#F6F4EF` · brand `#5B8DEF / #EC5B87 / #3EC48A`).
- App icon sobre fundo ink, foil scan no centro, safe-zone maskable 40%.
- OG modelo A (editorial + QR `meualbum2026.app`).

## Escopo

Exportar do design tool para o repo (binários ou SVG produção — **não recriar em HTML**):

**Logo:**
- `public/brand/logo-primary.svg`
- `public/brand/logo-stacked.svg`
- `public/brand/logo-inline.svg`
- `public/brand/selo-26.svg`

**Favicon + ícones:**
- `public/favicon.svg` (gradient sobre ink, sobrescreve emoji ⚽ atual)
- `public/favicon.ico`
- `public/favicon-16.png`, `public/favicon-32.png`
- `public/apple-touch-icon.png` (180×180, sobrescreve atual)
- `public/pwa-192.png`, `public/pwa-512.png` (maskable, safe-zone 40%) — sobrescrevem atuais
- `public/android-chrome-192.png`, `public/android-chrome-512.png`

**OG:**
- `public/og-image.png` (1200×630, modelo A + QR para `https://meualbum2026.app`, ECC=M, < 300 KB sRGB) — sobrescreve atual

**Splash:**
- `public/splash/ios-*.png` (8 variantes Apple device sizes — ver lista em `index.html` apple-touch-startup-image)
- `public/splash/android.png`
- `public/splash/ipad-portrait.png`, `public/splash/ipad-landscape.png`

**E-mail asset hospedado:**
- `public/email/selo-56.png` (PNG, não SVG — Outlook não renderiza SVG)

## Acceptance criteria

- Todos os arquivos listados commitados em `public/`.
- `pwa-512.png` passa em https://maskable.app com safe-zone 40%.
- `og-image.png` renderiza no validador da Meta (https://developers.facebook.com/tools/debug) sem warnings.
- QR do OG escaneia para `https://meualbum2026.app` (testar com câmera real).
- `favicon.svg` renderiza igual em light/dark mode no Chrome e Safari.

## Verificação

- Visual diff side-by-side com `Handoff Pack.html` seções 01/03/04/05/07.
- Lighthouse PWA install audit passa (theme/bg colors corretos).

## Fora de escopo

- Edições em `index.html`, `public/manifest.webmanifest` ou código TS (issue #4).
- Componente `BrandMark` (issue #3).
