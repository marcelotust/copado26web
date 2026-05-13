## Contexto

Operações sensíveis (reset, exclusão de conta, ajustes em massa) devem deixar trilha auditável no backend.

## Escopo

- Definir tabela `audit_events` (ou equivalente) no Supabase: `user_id`, `action`, `metadata` sanitizado, `created_at`.
- Registrar reset de álbum e exclusão de conta via RPC/trigger ou chamada explícita no cliente.
- Política RLS: usuário lê só os próprios eventos; sem PII extra em `metadata`.

## Fora de escopo

- Auditoria de frames de scanner/OCR.

## Critérios de aceite

- [ ] Migração SQL versionada em `supabase/migrations/`.
- [ ] Eventos críticos MVP geram linha de auditoria.
- [ ] Documentado em `docs/` junto ao registro LGPD.

## Referências

- `supabase/migrations/`, `src/pages/SettingsPage.jsx`
