## Contexto

Lógica de domínio e hooks críticos não têm cobertura automatizada.

## Escopo

- Testes unitários para helpers puros (ex.: normalização de códigos de figurinha, formatação de export).
- Testes de hooks com Supabase mockado: auth (erro OTP), sticker actions (sucesso/falha), progress.
- Fixtures sem e-mail real; sem dependência de rede em CI.

## Fora de escopo

- `useOCR`, câmera, Tesseract.

## Critérios de aceite

- [ ] Cobertura dos caminhos feliz e erro dos hooks MVP listados.
- [ ] Mocks não vazam PII nos snapshots.
- [ ] Suite roda em < 2 min no CI.

## Referências

- `src/hooks/useAuth.js`, `src/hooks/useStickerActions.js`, `src/hooks/useSupabaseProgress.js`
