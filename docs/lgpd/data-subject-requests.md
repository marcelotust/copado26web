# Procedimento operacional — titulares e incidentes (MVP)

Versão: 2026-05-15 · Contato: [hello@copa26web.app](mailto:hello@copa26web.app)

## Solicitações de titulares (DSAR)

1. **Recebimento** — e-mail com assunto `LGPD` ou formulário futuro; confirmar identidade (mesmo e-mail da conta ou magic link).
2. **Prazo** — responder em até **15 dias** (prorrogável +15 conforme LGPD art. 18, §3º).
3. **Tipos**
   - **Acesso / portabilidade:** orientar export CSV in-app ou enviar export sob demanda após validação.
   - **Correção:** usuário edita no app; suporte confirma se necessário.
   - **Exclusão:** preferir fluxo in-app (Configurações → Excluir conta); se indisponível, executar `delete_my_account` no backend após validação.
   - **Revogação analytics:** instruir Configurações → Privacidade ou limpar `localStorage` da chave de consentimento.
4. **Registro** — anotar ticket interno (data, pedido, resposta, prazo).

## Incidentes de segurança

1. **Detecção** — alertas Sentry, relato de usuário, monitoramento Supabase.
2. **Contenção** — revogar chaves, bloquear IP, desabilitar feature flag se aplicável.
3. **Avaliação** — dados afetados, titulares impactados, risco.
4. **Comunicação** — ANPD e titulares quando obrigatório (assessoria jurídica).
5. **Lições** — post-mortem interno; issue no repositório se mudança técnica necessária.

## Revisão deste documento

Revisar a cada release relevante de privacidade ou novo subprocessador (ver também `data-processing-register.md`).
