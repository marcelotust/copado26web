# Fluxo visitante, paywall de login e aquisição

**Issue de acompanhamento:** https://github.com/marcelotust/copado26web/issues/67  

Documento de especificação para explorar **browse antes do login**: landing → entrar → álbum vazio (secção por geolocalização ou fallback) → paywall na primeira ação gatilhada → login opcionalmente com replay da intenção.

---

## Objetivo

Reduzir o atrito inicial: o visitante **conhece o app** na landing, entra sem sessão, vê o álbum **vazio** na secção do “país” inferido (ou fallback), e só ao tentar ações reais vê o **painel de login** (paywall). Aumentar conversão para utilizador autenticado sem bloquear o primeiro contacto visual.

---

## Estado atual (código)

- `src/App.tsx`: sem `session` → só `LoginPage`; com `session` → `StickersProvider userId` + `AuthenticatedApp`.
- `StickersProvider` (`src/state/StickersProvider.tsx`) exige `userId` — todo o álbum e progresso assumem utilizador autenticado.
- Rotas React Router vivem dentro de `AuthenticatedApp.tsx` (visitante hoje **não** percorre essas rotas).
- Secções especiais no catálogo incluem `WAP`, `FWC`, `CC` (ex. `DashboardPage`, `AlbumPage`).
- `src/hooks/useAuth.ts`: `getSession` + `onAuthStateChange` — base para fechar paywall ao obter sessão (mesma tab, magic link, e tipicamente sincronização entre tabs via cliente Supabase).

---

## Fluxo de produto (visitante)

1. **Landing** (rota pública, ex. `/` ou `/welcome`): marketing + valor do produto + CTA **Entrar**.
2. **Entrar** → modo **visitante**: shell semelhante ao app, **sem** dados remotos de coleção até login.
3. **Secção inicial do álbum**
   - Tentar **Geolocation API** do browser com copy e base legal (LGPD).
   - Se **permissão concedida** e localização útil → mapear país/região → **código de equipa/secção** do catálogo.
   - Se indisponível, erro, timeout ou **recusa** → secção **`WAP`** (fallback único acordado).
4. Mostrar **álbum vazio** (quantidades 0, sem writes remotos).
5. Ao disparar um **gatilho** (lista fechada abaixo) → abrir **paywall** (painel até **X%** da altura do viewport, backdrop semitransparente / blur).
6. **Login com sucesso** → fechar paywall, montar fluxo autenticado, **reexecutar a intenção** quando for tecnicamente possível (“intenção pendente”).
7. **Fechar paywall** sem login → a intenção é **rejeitada** (navegação não ocorre, toggle não aplica). Na **próxima** tentativa de gatilho, o paywall **volta**.

### Paywall — interação

- **Fechar** (X / “Agora não”) = cancelar intenção; UI permanece como **antes** do clique.
- **Backdrop:** mesmo comportamento que fechar (rejeitar ação), para consistência.
- Não há “cooldown” entre tentativas na v1 (cada nova ação gatilhada pode reabrir o paywall).

### Escape global

- Opção de **voltar à landing** (marketing) a partir do modo visitante, alinhada com produto (evita beco sem saída além de fechar o browser).

---

## Gatilhos (v1 — lista fechada)

| Gatilho | Superfícies no código (referência) |
|--------|-------------------------------------|
| Toggle de figurinha (+/−, confirmação) | `useStickerActions` → `useAdjustSticker`; `StickerCard` / `AlbumPage` |
| Tab Dashboard (Home) | `TabNav` — `NavTab to='/dashboard'`; `pathname === '/'` como home |
| Tab Swaps | `TabNav` — `to='/swaps'` |
| Tab Missing | `TabNav` — `to='/missing'` |
| Challenges | `Header` — `Link to='/challenges'`; `DashboardPage` — `navigate('/challenges')` |

**Explicitamente fora da v1 (a confirmar depois):** `/settings`, `/scanner`, rotas legais (devem continuar acessíveis sem paywall se forem públicas).

**Nota:** Abrir apenas a tab **Álbum** ou mudar secção na **sidebar** **não** é gatilho — só interações listadas. (Alteração futura: sidebar como gatilho = decisão de produto.)

---

## Deep links (sem sessão)

**Regra:** visitante **não** entra “no meio” da app por URL profunda; normaliza-se para o **início do funil** (landing).

| URL sem `session` | Comportamento |
|-------------------|---------------|
| `/` ou rota canónica da landing | Mostrar landing. |
| `/dashboard`, `/album`, `/missing`, `/swaps`, `/challenges`, `/settings`, `/scanner`, outras rotas internas | `Navigate` **replace** para a rota da landing (ex. `/`), preservando **query de marketing** (`utm_*`, `ref`, etc.). |
| `/privacidade`, `/termos` | Acesso direto (legal); links de retorno já existentes. |

**Prioridade magic link / OAuth return:** processar tokens / `getSession` **antes** de aplicar redirect de visitante. Se existir `session` após processamento, renderizar app autenticado — **não** enviar para landing.

**Com `session`:** manter comportamento atual (deep links para rotas internas).

---

## Geolocalização e LGPD

- Informar **finalidade** antes de pedir permissão de geolocalização; link para política de privacidade.
- Oferecer caminho **sem geo** (“Continuar sem localização”) → fallback **`WAP`**.
- Documentar bases legais e retenção com compliance; paywall/login: menção a tratamento de dados (email, OAuth).

---

## Intenção pendente (pós-login)

Estrutura sugerida (discriminated union), extensível:

- `{ type: 'navigate', to: '/dashboard' | '/swaps' | '/missing' | '/challenges' }`
- `{ type: 'toggleSticker', stickerId: string, delta: number }`

**Ordem sugerida:** (1) `session` válida → fechar paywall; (2) hidratar `StickersProvider` / estado remoto; (3) executar intenção; (4) em falha, feedback consistente (toast/log) sem estado inconsistente.

---

## Listener de sessão (multi-tab, magic link)

- Manter `onAuthStateChange` em `useAuth` como fonte de verdade.
- Paywall: `useEffect` em `session` — quando `session != null`, fechar modal e limpar bloqueio de UI.
- Testar: tab A visitante + tab B completa login → tab A deve atualizar e fechar paywall sem refresh manual.

---

## Métricas (mínimo produto)

- `guest_landing_view` (opcional: props `utm_*`).
- `guest_enter_click`.
- `guest_album_section_resolved` — props: `section`, `source: 'geo' | 'wap_fallback' | 'denied' | 'unavailable'`.
- `paywall_open` — prop `trigger` alinhada aos gatilhos (ex. `toggle_sticker`, `tab_dashboard`, `tab_swaps`, `tab_missing`, `nav_challenges`).
- `paywall_dismiss` — prop `trigger` (ação não executada).
- `login_success` — prop `source: 'paywall' | 'other'`; se paywall, incluir `trigger`.
- `intent_replay_success` / `intent_replay_fail` — tipo da intenção.

---

## Implementação — camadas (checklist técnico)

1. **Router** (`main.tsx` / `App`): rotas públicas (landing, legal) vs shell visitante vs shell autenticado.
2. **`App.tsx`**: com `!session`, não renderizar só `LoginPage` full-screen; guest shell + paywall; formulário de login reutilizado no modal ou rota embutida.
3. **`StickersProvider`**: modo visitante (estado local, zeros, sem writes remotos) ou provider paralelo com API compatível — decisão de arquitetura.
4. **Layout partilhado**: extrair de `AuthenticatedApp` um `AppShell` comum (Header, TabNav, `Routes`) para guest e auth, evitando duplicação.
5. **Hook `useRequireAuth` / `requireSession(intent)`**: usado em `TabNav`, `Header`, `DashboardPage`, e na camada de toggle antes de `adjust`/`bump`.
6. **Guard de deep link**: efeito ou wrapper de rota — sem session + path interno (exceto legal) → replace para `/` + preservar query UTM.
7. **UI paywall**: componente dedicado; animação slide-up; altura máx. X% viewport; backdrop.

---

## Decisões registadas (resumo)

| Tópico | Decisão |
|--------|---------|
| Fechar modal | Permite fechar; **rejeita** a ação; paywall **reabre** na próxima tentativa gatilhada. |
| Backdrop | Igual a fechar (rejeitar ação). |
| Deep links sem sessão | Normalizar para **landing**; preservar UTM; excepção legal; magic link antes de redirect visitante. |
| Fallback secção | **`WAP`** se geo indisponível/recusada. |
| Gatilhos | Toggle, Dashboard, Swaps, Missing, Challenges (lista fechada v1). |
| Pós-login | **Replay** da intenção quando possível. |
| Métricas | Eventos básicos listados acima. |

---

## Questões futuras (não bloqueiam v1)

- Tabela país → código de secção: estática no cliente vs API.
- `sessionStorage` para secção visitante após refresh.
- Gating adicional (sidebar, scanner, settings).
