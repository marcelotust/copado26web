# Spec · Brand Handoff (Meu Álbum 2026)

**Data:** 2026-05-18 · **Owner:** @marcelotust · **Status:** Ready

## User problem

Os assets visuais atuais (favicon ⚽, og-image placeholder, paleta Tailwind genérica) não representam a marca, share mensagens não têm assinatura unificada, e templates de e-mail destoam visualmente. Um pack de handoff foi finalizado em Claude Design com 10 seções de artefatos decididos (logo, paleta A, app icon ink, OG modelo A+QR, milestone/challenge 4 variants cada, splash, e-mails com header unificado, signature canônica).

## Target surface

PWA `Meu Álbum 2026` — assets `public/`, design tokens (`src/styles/tokens.*`, `tailwind.config.js`), share libs (`src/lib/{shareText,milestoneCardLayout,tradeListParse}.ts`), componente novo `src/components/brand/BrandMark.tsx`, templates `supabase/templates/`, e meta tags em `index.html`.

## Non-goals

- WhatsApp sticker pack (handoff: fora de escopo).
- Onboarding com mascote.
- Sound design / animações de loading.
- Refactor amplo de componentes existentes pra usar BrandMark — só criar o componente, adoção fica em PR separado.

## Acceptance criteria (alto nível)

1. Todos os assets binários novos publicados em `public/` e validados (maskable.app, Meta debugger).
2. Paleta A disponível como tokens CSS, TS, e Tailwind extend.
3. `BrandMark` component em uso opcional no app.
4. `SHARE_SIGNATURE` única; 4 fluxos de share (swap/milestone/challenge/missing) terminam com ela.
5. Milestone e challenge cards regenerados com 4 variants cada, identidade visual do handoff.
6. Templates Supabase (signup + magic link) com header dark unificado; partial reusável.
7. Splash screens iOS/Android/iPad linkados em `index.html`.
8. `tradeListParse.ts` regex preservado (capta `meualbum2026?.app`).

## Telemetria / privacidade / i18n / migrations

- **Telemetria:** nada novo. Validar com `telemetry-review` se SHARE_SIGNATURE altera os events de `share_*`.
- **Privacidade:** signature é literal e pública, sem PII. OG image gera QR estático.
- **i18n:** signature canônica fica fora de locales (literal único). Demais copies novas em `src/i18n/locales/*.json`.
- **Migrations:** nenhuma.

## Open questions

- Renomear `supabase/templates/confirm-signup.html` → `signup.html` quebra o sync do Dashboard? Decidir em #8 antes de mexer.
- `docs/supabase-production-security.md` (modificado no working tree) tem relação com este handoff? Confirmar com user.

## Issues abertas

Ver `tasks.md` neste folder e issues no GitHub (criadas em 2026-05-18).
