## Contexto

Há exportação CSV e reset de quantidades, mas não exclusão de conta nem fluxo formal de portabilidade.

## Escopo

- Ação “Excluir minha conta” em configurações com confirmação forte.
- Remover usuário via Supabase Auth e dados associados (cascade em `user_stickers` / `stickers` conforme schema vigente).
- Eventos `account_deletion_*` e auditoria mínima no backend.
- Documentar que export CSV existente cobre portabilidade do álbum no MVP.

## Fora de escopo

- Scanner e dados de imagem (não persistidos).

## Critérios de aceite

- [ ] Conta e dados do álbum removidos após confirmação.
- [ ] Usuário informado sobre irreversibilidade e prazo de processamento.
- [ ] Teste de integração ou E2E com usuário de teste.

## Referências

- `src/pages/SettingsPage.jsx`, migrações em `supabase/migrations/`
