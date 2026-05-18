# Tasks · Brand Handoff

Cada task = uma GH issue. Ordem respeita dependências.

- [ ] **[#162](https://github.com/marcelotust/copado26web/issues/162) · [design] Exportar pack de assets de marca** · P0 · [issue-01.md](issue-01.md) — bloqueia #164, #165, #167, #168, #169.
- [ ] **[#163](https://github.com/marcelotust/copado26web/issues/163) · [brand] Design tokens + Tailwind palette** · P0 · [issue-02.md](issue-02.md) — bloqueia #164, #167, #168.
- [ ] **[#164](https://github.com/marcelotust/copado26web/issues/164) · [brand] `<BrandMark />` component** · P1 · [issue-03.md](issue-03.md) — depende de #162, #163.
- [ ] **[#165](https://github.com/marcelotust/copado26web/issues/165) · [pwa] Swap icons/OG/favicon + manifest + splash links** · P0 · [issue-04.md](issue-04.md) — depende de #162.
- [ ] **[#166](https://github.com/marcelotust/copado26web/issues/166) · [share] `SHARE_SIGNATURE` + `buildShareText` + e2e** · P0 · [issue-05.md](issue-05.md).
- [ ] **[#167](https://github.com/marcelotust/copado26web/issues/167) · [share] milestoneCardLayout refactor (4 variants)** · P1 · [issue-06.md](issue-06.md) — depende de #162, #163.
- [ ] **[#168](https://github.com/marcelotust/copado26web/issues/168) · [share] challengeCardLayout novo (4 variants)** · P1 · [issue-07.md](issue-07.md) — depende de #162, #163, #167.
- [ ] **[#169](https://github.com/marcelotust/copado26web/issues/169) · [email] Templates Supabase com header unificado** · P0 · [issue-08.md](issue-08.md) — depende de #162.

## Gates obrigatórios por task

| Task | Gates esperados |
|---|---|
| #2, #3 | `frontend`, `architect` |
| #4 | `architect` |
| #5 | `telemetry-review` |
| #6, #7 | `frontend`, `qa-release` |
| #8 | `supabase-review` |

Rodar `npm run ai:harness` antes de marcar como done.
