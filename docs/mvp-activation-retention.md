# MVP: ativação e retenção

Métricas de produto para o lançamento, **sem scanner/OCR**. Eventos e nomes estão em `src/lib/telemetry/events.ts` e na taxonomia geral em [`mvp-quality-and-observability.md`](./mvp-quality-and-observability.md).

**Pré-requisito:** o usuário aceitou analytics (banner LGPD). Sem consentimento, custom events não são enviados.

## Métricas MVP

| Métrica | Definição operacional | Evento(s) | Propriedades-chave |
|---------|----------------------|-----------|-------------------|
| Login concluído | Sessão Supabase estabelecida | `auth_signed_in` | `provider`, `is_new_user` |
| Álbum carregado | Catálogo + quantidades do usuário carregados | `album_seeded` | `sticker_count` |
| Primeira figurinha | Primeiro `+1` em figurinha (por usuário) | `sticker_quantity_changed` | `is_first_sticker_change: true`, `team_code`, `delta`, `source` |
| Uso por aba | Usuário navega entre seções principais | `nav_tab_selected` | `tab` (`dashboard`, `album`, `missing`, `swaps`, `settings`) |
| Retorno D1 | Usuário com `auth_signed_in` no dia D volta (qualquer custom event ou sessão autenticada) no dia D+1 | derivado de `auth_signed_in` + eventos subsequentes | — |
| Retorno D7 | Idem, janela D+7 | derivado | — |

### Funil de ativação (ordem esperada)

```text
auth_signed_in → album_seeded → sticker_quantity_changed (is_first_sticker_change)
  → nav_tab_selected (≥ 2 abas distintas, agregação)
```

Taxa de ativação (exemplo): usuários com `is_first_sticker_change` ÷ usuários com `auth_signed_in` no mesmo período.

### Engajamento por aba

Contar `nav_tab_selected` agrupando por `tab`. Aba `settings` é acessada pelo menu ⚙ (header), não pela barra inferior.

## Como ler na Vercel Web Analytics

1. Abra o projeto na [Vercel](https://vercel.com) → **Analytics** → **Events**.
2. Filtre por eventos customizados (`auth_signed_in`, `album_seeded`, etc.).
3. Use **visitors** únicos por evento como proxy de usuários (MVP; sem `user_id` em terceiros).
4. **Funis** não são nativos no plano básico: exporte contagens diárias (CSV/planilha) ou cruze manualmente:
   - Coluna A: data
   - Coluna B: únicos `auth_signed_in`
   - Coluna C: únicos `album_seeded`
   - Coluna D: únicos `sticker_quantity_changed` com filtro `is_first_sticker_change`

### Retorno D1/D7 (agregação manual inicial)

1. Para cada dia de cohort (data do primeiro `auth_signed_in`), liste visitantes únicos.
2. D1: % desses visitantes com qualquer evento customizado no dia seguinte.
3. D7: % com evento entre D+1 e D+7 (inclusive).

Quando precisar de cohorts/retention visuais sem planilha, use **PostHog** (já integrado com a mesma taxonomia) — fora do escopo mínimo desta issue, mas compatível.

## Validação em preview

1. Deploy de preview com `VITE_POSTHOG_KEY` opcional; Vercel Analytics ativo no projeto.
2. Aceitar consentimento de analytics.
3. Login → conferir `auth_signed_in` e `album_seeded`.
4. Marcar uma figurinha → `sticker_quantity_changed` com `is_first_sticker_change: true` (apenas na primeira vez).
5. Trocar abas → `nav_tab_selected` com `tab` correto.
6. Abrir Configurações pelo menu ⚙ → `nav_tab_selected` com `tab: settings`.

## Referências no código

- Taxonomia: `src/lib/telemetry/events.ts`
- Primeira figurinha: `src/lib/telemetry/activation.ts`
- Instrumentação: `src/hooks/useAuth.ts`, `src/state/useStickersLoad.ts`, `src/hooks/useStickerActions.ts`, `src/components/TabNav.tsx`, `src/components/HeaderMenu.tsx`
