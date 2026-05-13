## Contexto

`useStickerActions` e fluxos relacionados registram falha no console sem feedback na UI nem evento de produto.

## Escopo

- Tratar falhas de update/optimistic rollback no álbum e telas que mutam quantidade.
- Mensagem discreta ou toast quando persistência falhar; evitar contador divergente sem aviso.
- Evento `sticker_update_failed` e log estruturado.
- Considerar uso futuro de RPC `adjust_sticker` na migração de schema.

## Fora de escopo

- Scanner e incremento via OCR.

## Critérios de aceite

- [ ] Falha de rede/API visível ao usuário com opção de tentar de novo quando fizer sentido.
- [ ] Estado otimista reconciliado após erro.
- [ ] Cobertura de teste para handler de erro do hook ou ação equivalente.

## Referências

- `src/hooks/useStickerActions.js`, `src/pages/AlbumPage.jsx`
