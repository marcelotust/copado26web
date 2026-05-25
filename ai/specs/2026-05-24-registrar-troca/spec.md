# Spec · Registrar Troca (ad-hoc) com aplicação no acervo

**Data:** 2026-05-24 · **Owner:** @rlpereira · **Status:** Draft

## User problem

Trocando figurinhas presencialmente, o colecionador já cola a lista do amigo no
*trade checker* da página **Faltando** (`src/components/MissingTradeChecker.tsx`)
e vê duas listas: "ele tem que eu preciso" e "eu tenho que ele precisa". Mas
depois da troca real **ele tem que atualizar cada carta na mão** — abrir o álbum,
achar a figurinha, dar +1 nas que pegou e −1 nas que entregou. É lento e fácil de
errar bem no meio de uma sessão de troca rápida.

Falta um passo de **reconciliação**: depois de trocar, registrar de uma vez o que
entrou (+1) e o que saiu (−1) direto do resultado que o app já calculou.

## Target surface

PWA `Meu Álbum 2026`:

- **Estendido:** `src/components/MissingTradeChecker.tsx` — o resultado do match
  ganha seleção por item + botão "Troquei todas" + CTA "Registrar troca".
- **Novo:** RPC `SECURITY DEFINER` `apply_trade(received text[], given text[])`
  atômico, reusando a semântica de clamp de `adjust_sticker`
  (`supabase/migrations/20260512_0001_create_catalog_schema.sql:75-104`).
- **Estendido:** `src/state/StickersProvider.tsx` — aplicar deltas em lote com
  update otimista + tratamento de echo do realtime (mesmo padrão de `adjust`,
  `src/state/StickersProvider.tsx:57-89`).
- **Telemetria:** novo evento em `src/lib/telemetry/events.ts`
  (`trade_recorded`), gated em consent.
- **i18n:** novas chaves em `src/i18n/locales/{pt-BR,en,es}.json`.
- **Fase 2 (issue separada):** input por QR de álbum inteiro (bitmap) que
  alimenta o mesmo checker — ver "Fase 2" abaixo.

## Decisões de produto (travadas)

1. **Contexto:** ad-hoc — a partir de lista **colada** (e, na fase 2, **QR**).
   Não depende de ser amigo no app nem de estar logado no parceiro.
2. **Efeito:** aplica de verdade no acervo (+1 nas recebidas, −1 nas entregues).
   Não é só checklist.
3. **Granularidade:** dois modos — seleção manual por item **e** botão
   "Troquei todas" (marca tudo nas duas listas).
4. **−1 só em repetidas:** o lado "eu entreguei" é derivado de `swapIds`
   (quantity ≥ 2) por construção, então nunca zera carta única.
5. **Cabeçalho do share continua por extenso** — fora de escopo aqui (o ajuste
   de sigla foi só no display colado do checker, já entregue).
6. **Unilateral:** "Troquei todas" e +1/−1 escrevem **só nas cartas do próprio
   usuário** (`user_stickers` do `auth.uid()`). A coleção do amigo **nunca** é
   tocada — a lista dele (texto ou QR) é input read-only pra calcular o match.
   Quem quiser registrar do outro lado abre o próprio app e faz o espelho.
7. **Classificação do paste (texto):** usar os marcadores de cabeçalho do share
   (`APP_SHARE_MARKERS` em `src/lib/tradeListParse.ts`) pra rotear os códigos —
   *"faltam N"* = faltantes do amigo (lado −1), *"repetida/sobras"* = repetidas
   do amigo (lado +1). Sem isso o −1 do texto tem falso positivo (ver "Fluxos").

## Non-goals

- Workflow transacional de troca (propor → aceitar → confirmar dos dois lados).
  Continua sendo registro local unilateral de quem está com o app aberto.
- Histórico de trocas / desfazer transação como unidade. (Pode reverter carta a
  carta no álbum como hoje.)
- Stepper de quantidade por carta: o MVP aplica **±1 por carta** (uma cópia).
  Trocar 2 cópias da mesma carta numa tacada fica pra follow-up.
- Integração com `suggest_trades` / perfil de amigo (`FriendProfilePage`). Esse
  fluxo server-side existe e segue válido, mas este spec é o caminho ad-hoc.
- Mexer em `/swaps` ou no texto de share (`src/lib/shareText.ts`).

## Acceptance criteria

1. **Resultado acionável:** no `MissingTradeChecker`, cada item das listas
   "ele tem / eu preciso" (+1) e "eu tenho / ele precisa" (−1) é selecionável
   (toggle), com default a definir no plan (provavelmente todos marcados).
2. **Troquei todas:** botão que marca/desmarca tudo nas duas listas de uma vez.
3. **Registrar troca:** CTA aplica, numa transação, +1 em cada carta recebida
   selecionada e −1 em cada carta entregue selecionada. Feedback de sucesso com
   contagem ("+5 / −3 registradas").
4. **Atomicidade:** se o RPC falhar, **nada** é aplicado (sem estado parcial) e o
   acervo na tela volta ao anterior.
5. **Clamp:** −1 nunca leva quantity abaixo de 0 (reusa `greatest(0, ...)`).
6. **Auth gate:** se o usuário não estiver logado (guest), o CTA "Registrar
   troca" leva ao login pelo padrão existente, em vez de aplicar.
7. **Otimista + realtime:** o álbum reflete os deltas na hora; echoes do realtime
   não duplicam nem revertem (mesmo `pendingRef` de `adjust`).
8. **Telemetria:** `trade_recorded` dispara com `received_count`, `given_count`,
   `source ∈ paste|qr` — **sem IDs de carta, sem o texto colado, sem PII** —
   gated por consent.
9. **i18n:** 100% das copies novas em pt-BR, en, es.

## Fluxos completos

Os dois fluxos são **unilaterais**: cada pessoa registra a troca no próprio
álbum. A lista do parceiro (texto ou QR) é input read-only pra calcular o match.

### Via copiar e colar texto

1. B compartilha a lista dele pelos botões de share existentes
   (`src/components/SwapsShareButtons.tsx` / `MissingShareButtons.tsx`):
   *"tenho N repetidas"* (o que ele oferece) e/ou *"me faltam N"* (o que precisa).
2. A cola no checker da página Faltando e aperta Analisar
   (`MissingTradeChecker` + `analyzeTradeListPaste`).
3. Checker calcula `theyHave` (+1: ele tem ∩ eu preciso) e `youHave`
   (−1: minhas repetidas ∩ a lista dele).
4. A confere / "Troquei todas" → Registrar → +1/−1 só no álbum de A.

**Limitação conhecida:** o parser junta tudo num set só, então:
- **+1 é confiável** quando o paste contém as **repetidas** do B (caso comum).
- **−1 só é confiável** quando o paste contém as **faltantes** do B. Paste só de
  repetidas → o −1 pode marcar carta que o B já tem (falso positivo).
- Mitigação: classificar pelo cabeçalho (decisão 7). Paste ambíguo → priorizar o
  +1 e tratar o −1 com confirmação explícita.

### Via QR (fase 2)

1. Cada pessoa gera **um QR** com o álbum inteiro (bitmap posicional:
   `falta | tenho | repetida` por carta).
2. A escaneia o QR de B → app de A decodifica o estado **completo** de B.
3. App de A calcula os dois lados com dados completos — **+1 e −1 sempre
   corretos**, sem a ambiguidade do texto.
4. A confere / "Troquei todas" → Registrar → +1/−1 só no álbum de A.
5. B faz o espelho escaneando o QR de A (duas leituras no total). Se só um lado
   quer registrar digital, só ele precisa escanear.

**Detalhes:** o QR é snapshot ao vivo (regerar após colar figurinhas); o byte de
versão detecta catálogo divergente e avisa; guest pode ver o match mas o
Registrar pede login; o checker recalcula após aplicar (carta entregue pode
deixar de ser repetida). O payload carrega só o bitmap da própria coleção —
**sem nome, email ou PII**.

## Data, Privacy, and Security

- **PII envolvida:** o texto colado é input livre do usuário e **NUNCA** vai pra
  analytics nem logs — só contagens agregadas.
- **Tabelas afetadas:**
  - `user_stickers` (existente) — escrita via novo RPC. Sem mudança de schema.
- **RPC novo:** `apply_trade(p_received text[], p_given text[]) returns ...`
  - `SECURITY DEFINER`, `search_path` fixo, grant só `authenticated`.
  - Valida que todos os ids existem no `stickers_catalog` (ignora desconhecidos).
  - Aplica +1 / −1 com `greatest(0, ...)`, tudo numa transação.
  - Retorna as quantidades novas pra reconciliar o cliente.
  - Revisar com `supabase-security-reviewer` antes do merge.
- **RLS/grants:** `user_stickers` mantém RLS restritivo atual; escrita cross-row
  só do próprio `auth.uid()` dentro do RPC.
- **Analytics:** `trade_recorded` (snake_case, sem PII), gated em
  `syncTelemetryConsent` (`src/lib/telemetry/index.ts:45-96`).
- **Consent impact:** evento novo respeita consent LGPD como os demais.

## Fase 2 — QR de álbum inteiro (issue separada)

Codificar o estado do álbum inteiro num payload denso pra caber num QR e
alimentar o checker num scan só (resolve o lado −1 de forma completa, sem
depender do amigo colar a lista de faltantes).

- **Esquema:** bitmap posicional indexado pelo `sort_order` do `stickers_catalog`
  (994 cartas). 2 bits/carta (`falta | tenho | repetida`) ≈ 249 bytes; cabe
  folgado num QR (~2953 bytes). Base64url ≈ 330 chars.
- **Versionamento:** **byte de versão** no início do payload, porque o índice
  depende do catálogo; protege leitura de payloads antigos se o catálogo mudar.
- **Reuso:** alinhar com o modelo existente
  `{ swaps, missing, hasPeerMissingList }` de `src/lib/tradePayload.ts` e a
  geração de QR de `src/components/TradeQRModal.tsx` (`qrcode.react`) +
  scan de `src/components/friends/QRScanner.tsx` (`@yudiel/react-qr-scanner`).
- **Desbloqueio:** quem escaneia calcula a troca localmente, mesmo sem amizade
  no app nem login do parceiro.

## Open questions (não bloqueantes)

- Default de seleção dos itens: tudo marcado vs nada marcado? (decidir no plan)
- Texto ambíguo (sem cabeçalho): esconder o lado −1, ou mostrar com aviso
  "confira antes de aplicar"? (decidir no plan)
- "Troquei todas" deve também **fechar/limpar** o checker após aplicar?
- Fase 2: incluir quantidade exata (3 bits, cap 0–7) ou só os 3 estados (2 bits)?
