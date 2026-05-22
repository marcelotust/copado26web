## Contexto

Spec completo em [`ai/specs/2026-05-21-amigos-trocas/`](../ai/specs/2026-05-21-amigos-trocas/).

**Slice 3 de 5** da feature Amigos & Sugestão de Trocas. Adiciona a UI de descoberta: usuário consegue mandar pedido por nickname (busca), email (anti-enumeration) ou QR code (gerar próprio + scanear).

**Depende de:** #187, #188.

## Decisões fechadas

- **3 caminhos de descoberta:** nickname, email, QR.
- **Email lookup é anti-enumeration:** RPC retorna sempre `{ ok: true }` independente de existir conta.
- **Nickname lookup pode revelar existência** (nicknames são públicos por design — usuário escolhe).
- **QR generation:** `qrcode.react@4.2.0` (**já no repo** — ver `src/components/TradeQRModal.tsx` e `src/lib/brand/shareFooter.ts`).
- **QR scanning:** `@yudiel/react-qr-scanner` (nova dependência ~25kb gz worst case). Lazy-loaded só na aba QR. Usa native `BarcodeDetector` (~6kb gz) quando disponível, fallback ZXing.
- **Deep link:** `/friends/add?code=<nickname>` cai direto no dialog com pedido pronto.
- **Rate limit** (do #188): 30 pedidos/hora, validado na RPC. UI mostra mensagem clara quando atingido.

## Escopo

**DB (extensão da migration do #188 ou nova):**
- RPC `lookup_by_nickname(p_nickname text)` — retorna profile público ou null. Sem rate limit (read-only).
- RPC `send_friend_request_by_email(p_email citext)` — `SECURITY DEFINER`. Internamente: se conta existe AND não há request/friendship AND rate limit OK, cria request. Sempre retorna `{ ok: true }`.

**Frontend:**
- `src/components/friends/AddFriendDialog.tsx` (modal com 3 tabs: Nickname / Email / QR).
- Aba Nickname: input com search-as-you-type debounced 300ms via `lookup_by_nickname`; mostra resultado com `Avatar` + display_name + botão "Enviar pedido".
- Aba Email: input email + botão "Enviar". Mensagem de sucesso uniforme: "Se houver uma conta com esse email, o pedido foi enviado".
- Aba QR: split — topo mostra seu próprio QR (`QRGenerator.tsx` baseado em `qrcode.react`) contendo URL `https://meualbum2026.app/friends/add?code=<seu_nickname>`; base mostra botão "Escanear QR" que abre `QRScanner.tsx` (lazy-loaded).
- Adicionar `@yudiel/react-qr-scanner` em `package.json`.
- Botão "+ Adicionar amigo" em `FriendsPage` (do #188) que abre o dialog.
- Route handler `/friends/add?code=<nickname>`: abre dialog com nickname pré-preenchido + confirmação.

**Telemetria (em `src/lib/telemetry/events.ts`):**
- `friend_request_sent` com prop `discovery_method` ∈ `nickname|email|qr`.
- `qr_profile_generated` (emit ao abrir aba QR).
- `qr_profile_scanned` (emit ao scanner detectar QR válido).
- Gated em consent.

**i18n:** 3 locales.

## Acceptance criteria

- [ ] AddFriendDialog abre via botão na `FriendsPage` e via deep link.
- [ ] Aba Nickname: busca debounced funciona, mostra "não encontrado" se inexistente, envia pedido com sucesso.
- [ ] Aba Email: envia, mensagem uniforme aparece, conta inexistente não revela ausência.
- [ ] Aba QR: meu QR renderiza, scanner abre câmera (com permission prompt), QR válido lido envia pedido.
- [ ] Camera negada mostra fallback "Cole o link aqui" com input de texto.
- [ ] Rate limit atingido mostra mensagem clara em todos os 3 caminhos.
- [ ] Deep link `/friends/add?code=marcelo` abre dialog com `marcelo` pré-preenchido na aba Nickname.
- [ ] Bundle: chunk de `/friends/add` não passa de +30kb gz vs antes do PR.
- [ ] Telemetria: `discovery_method` correto em cada caminho.
- [ ] Copies em pt-BR, en, es.

## Personas obrigatórias

- `supabase-security-reviewer` (anti-enumeration na RPC de email, rate limit).
- `telemetry-privacy-reviewer` (3 eventos novos + `discovery_method`).
- `frontend-product-engineer` (UX do dialog + 3 tabs + scanner fallback).

## Verificação

- `npm run ai:harness -- --run` clean.
- `npm run typecheck`, `npm run test:ci`, `npm run build` pass.
- Manual mobile (não cobre headless): scanear QR real em iOS Safari e Android Chrome.
- E2E `e2e/authenticated/friends-lifecycle.spec.ts` ganha passo "A envia pedido via nickname → B aceita".
- Verificar bundle size: `npm run build` antes/depois.

## Fora de escopo

- Página de perfil do amigo após aceite → #190.
- Trade suggestions → #191.
- Importar contatos do dispositivo → post-MVP.
