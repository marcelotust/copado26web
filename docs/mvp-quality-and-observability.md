# MVP: qualidade, observabilidade e conformidade

Documento de escopo e decisões para métricas de produto, logs, tratamento de erros, LGPD e testes no **MVP** do Meu Álbum 2026.

**Fora do MVP:** scanner / OCR (câmera, Tesseract, `useOCR`, métricas e testes específicos de leitura). O código do scanner pode permanecer no repositório, mas não entra neste plano até uma fase posterior.

**Repositório:** [marcelotust/copado26web](https://github.com/marcelotust/copado26web)

## Contexto atual

- Pageviews via `@vercel/analytics` em `App.jsx`, sem eventos customizados.
- Falhas em Supabase e seed costumam ir só para `console.error` / `console.warn`.
- Login expõe erros na UI; export CSV, reset do álbum e mutações de figurinhas em geral não.
- Configurações já oferecem exportação CSV e reset de quantidades; não há exclusão de conta.
- Não há suíte de testes nem scripts `test` no `package.json`.
- O README ainda descreve Dexie/IndexedDB e uso offline sem conta, divergindo do modelo Supabase + auth.

## Decisões de ferramentas (MVP)

| Área | Escolha | Alternativas consideradas | Motivo |
|------|---------|---------------------------|--------|
| Analytics de produto | **Vercel Web Analytics** + `track()` de `@vercel/analytics` | PostHog, Plausible, GA4 | Já instalado e alinhado ao deploy na Vercel; suficiente para funil e ativação no MVP. |
| Funis avançados / retenção | **Definições no doc + eventos mínimos**; PostHog só pós-MVP se Vercel não bastar | PostHog desde já | Evita novo subprocessador e banner LGPD extra no lançamento. |
| Erros e crashes | **Sentry** (`@sentry/react` + source maps na Vercel) | LogRocket, Bugsnag | Padrão de mercado, bom custo inicial, integração simples com React/Vite. |
| Logs estruturados | **Wrapper fino no cliente** (`src/lib/logger.js`) | Datadog RUM, Axiom | MVP não precisa de pipeline de logs centralizado; Sentry cobre erros; logs ficam correlacionáveis via `correlation_id` e breadcrumbs. |
| Auditoria de dados (backend) | **Supabase Postgres** (tabela `audit_events` ou extensão futura) | Serviço externo de audit | Operações sensíveis (reset, exclusão) devem deixar trilha no mesmo stack. |
| Testes unitários / componentes | **Vitest** + **React Testing Library** | Jest | Nativo ao Vite, setup leve. |
| Testes E2E | **Playwright** (smoke em CI) | Cypress | Estável para auth e rotas; smoke pequeno no MVP. |
| CI | **GitHub Actions** (`test` + `build` em PR) | — | Repositório já no GitHub. |
| LGPD — textos | **Páginas estáticas na app** (`/privacidade`, `/termos`) versionadas no repo | CMS | Pouca mudança no MVP; revisão jurídica fora do escopo técnico. |
| LGPD — consentimento analytics | **Banner + preferência em `localStorage`**; analytics só após opt-in | CMP pago | Escopo mínimo compatível com Vercel Analytics. |
| LGPD — direitos do titular | **Export CSV existente** + **exclusão de conta** (Supabase Auth + cascade) | Processo manual | Automação mínima exigida para MVP com conta. |

## Princípios transversais

1. **Sem PII em analytics e logs:** não enviar e-mail, texto livre digitado pelo usuário nem identificadores reversíveis; `user_id` só hasheado ou omitido em ferramentas de terceiros.
2. **Erro visível para o usuário, detalhe técnico no observability:** mensagens i18n na UI; stack e payload só no Sentry/logger.
3. **Um padrão, vários fluxos:** toast/banner reutilizável antes de tratar cada tela isoladamente.
4. **Issues rastreáveis:** backlog no GitHub com prefixo `[MVP]`; scanner explicitamente excluído.

## Taxonomia de eventos (MVP, sem scanner)

Convenção: `snake_case`, propriedades estáveis, sem dados pessoais.

| Evento | Quando | Propriedades sugeridas |
|--------|--------|------------------------|
| `auth_magic_link_requested` | Envio do magic link | `locale` |
| `auth_magic_link_failed` | Falha no OTP | `error_code` |
| `auth_google_started` | Clique em Google OAuth | `locale` |
| `auth_signed_in` | Sessão estabelecida | `provider`, `is_new_user` (se disponível) |
| `auth_signed_out` | Logout | — |
| `album_seeded` | Seed concluído no primeiro login | `sticker_count` |
| `album_seed_failed` | Falha no seed | `error_code` |
| `album_imported` | Importação CSV concluída | `changed`, `added`, `removed` |
| `album_restored` | Restauração de save point | `date` |
| `sticker_quantity_changed` | +/− quantidade | `team_code`, `delta`, `source` (`ui_click`, `keyboard`, `sync`) |
| `sticker_update_failed` | Falha ao persistir | `action`, `error_code` |
| `stickers_shared` | Share da lista de figurinhas | `channel` (`whatsapp`, `clipboard`, `native_share`), `surface` (`missing`, `swaps`) |
| `milestone_shared` | Share do card de marco | `kind` (`album`, `team`), `pct` ou `team_code` |
| `challenge_completed` | Desafio concluído pela 1ª vez | `challenge_id`, `challenge_title`, `difficulty` |
| `nav_tab_selected` | Troca de aba principal | `tab` (`dashboard`, `album`, `missing`, `swaps`, `settings`) |
| `export_csv_completed` | Download iniciado com sucesso | `row_count` |
| `export_csv_failed` | Falha na exportação | `error_code` |
| `reset_album_confirmed` | Reset concluído | — |
| `reset_album_failed` | Falha no reset | `error_code` |
| `account_deletion_requested` | Usuário confirma exclusão | — |
| `account_deletion_completed` | Conta removida | — |
| `consent_analytics_updated` | Banner de consentimento | `granted` (boolean) |
| `onboarding_started` | Overlay tutorial ativado | — |
| `onboarding_completed` | Tutorial finalizado pelo usuário | — |
| `onboarding_skipped` | Tutorial pulado | — |
| `paywall_shown` | Modal de paywall aberto no modo visitante | `reason` |
| `paywall_dismissed` | Paywall fechado sem login | — |
| `trade_link_generated` | URL de troca computada com sucesso no QR modal | `swap_count` |
| `trade_link_copied` | Cópia da URL de troca para o clipboard | — |
| `trade_match_viewed` | Painel de match aberto com payload válido | `you_receive`, `you_give`, `has_peer_missing_list` |
| `trade_link_invalid` | Link de troca inválido / parâmetro ausente | `reason` (`missing_param`, `invalid_payload`) |
| `trade_login_required` | Visitante abre link de troca válido sem sessão | — |
| `landing_viewed` | Landing pública exibida | — |
| `landing_cta_clicked` | Clique em CTA da landing | `cta_id` (`header_login`, `hero_primary`, `hero_explore_album`, `bottom_signup`), `cta_variant` (apenas em `hero_primary`) |
| `guest_album_viewed` | Visitante abre `/album` sem login | — |
| `guest_sticker_tapped` | Visitante clica em uma figurinha (dispara paywall) | — |

### Feature flags

| Flag | Variantes | Uso |
|------|-----------|-----|
| `landing_hero_cta` | `control` (cópia padrão "Começar grátis"), `treatment` (cópia alternativa "Experimente o álbum") | A/B test do CTA principal da landing. A variante atribuída pelo PostHog é refletida no `cta_variant` do evento `landing_cta_clicked` quando `cta_id = hero_primary`. |

Eventos de ativação/retenção derivados no analytics (primeiro `sticker_quantity_changed`, retorno em D1/D7) usam os eventos acima; não exigem SDK extra no MVP. Definições operacionais e leitura na Vercel: [`mvp-activation-retention.md`](./mvp-activation-retention.md).

## Mapa de issues no GitHub

Rascunhos locais em `docs/github-issues/`. No repositório, filtrar por label `mvp`.

| Issue | Título |
|-------|--------|
| [#10](https://github.com/marcelotust/copado26web/issues/10) | [MVP][Analytics] Taxonomia e instrumentação com Vercel Analytics |
| [#11](https://github.com/marcelotust/copado26web/issues/11) | [MVP][Analytics] Ativação e retenção: definições e eventos mínimos |
| [#12](https://github.com/marcelotust/copado26web/issues/12) | [MVP][Observability] Integrar Sentry no frontend |
| [#13](https://github.com/marcelotust/copado26web/issues/13) | [MVP][Observability] Logger estruturado no cliente |
| [#14](https://github.com/marcelotust/copado26web/issues/14) | [MVP][Errors] Padrão global de feedback de erro na UI |
| [#15](https://github.com/marcelotust/copado26web/issues/15) | [MVP][Errors] Erros visíveis em auth, seed, export e reset |
| [#16](https://github.com/marcelotust/copado26web/issues/16) | [MVP][Errors] Erros visíveis em mutações de figurinhas |
| [#17](https://github.com/marcelotust/copado26web/issues/17) | [MVP][LGPD] Política de privacidade e termos de uso |
| [#18](https://github.com/marcelotust/copado26web/issues/18) | [MVP][LGPD] Consentimento para analytics |
| [#19](https://github.com/marcelotust/copado26web/issues/19) | [MVP][LGPD] Exclusão de conta e direitos do titular |
| [#20](https://github.com/marcelotust/copado26web/issues/20) | [MVP][LGPD] Registro de subprocessadores e retenção |
| [#21](https://github.com/marcelotust/copado26web/issues/21) | [MVP][Docs] Alinhar README ao modelo Supabase |
| [#22](https://github.com/marcelotust/copado26web/issues/22) | [MVP][Tests] Fundação Vitest, RTL e CI |
| [#23](https://github.com/marcelotust/copado26web/issues/23) | [MVP][Tests] Unitários e integração dos fluxos core |
| [#24](https://github.com/marcelotust/copado26web/issues/24) | [MVP][Tests] Smoke E2E Playwright (auth e álbum) |
| [#25](https://github.com/marcelotust/copado26web/issues/25) | [MVP][Backend] Trilha de auditoria para operações sensíveis |

## Critérios de “MVP pronto” (esta frente)

- [ ] Eventos core instrumentados e consentimento respeitado.
- [ ] Sentry recebendo erros de produção com release/source map.
- [ ] Fluxos auth, álbum, export, reset e exclusão com feedback de erro na UI.
- [ ] Política de privacidade, termos e subprocessadores publicados; exclusão de conta disponível.
- [ ] CI executando unit/component tests e smoke E2E em PR.
- [ ] README alinhado ao modelo Supabase + conta (sem prometer só local-first).

## Referências no código

- Analytics: `src/App.jsx`
- Auth e seed: `src/hooks/useAuth.js`
- Mutações: `src/hooks/useStickerActions.js`
- Export / reset: `src/pages/SettingsPage.jsx`
- Cliente Supabase: `src/lib/supabase.js`
