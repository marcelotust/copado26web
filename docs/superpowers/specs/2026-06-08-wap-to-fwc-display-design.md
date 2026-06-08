# Design: Exibir seção Abertura como FWC 00–08 (Issue #258)

## Problema

As figurinhas da seção de Abertura são armazenadas internamente como `WAP-00..WAP-08`, mas no álbum físico Panini elas estão rotuladas como **FWC 00–FWC 08**. O app hoje exibe `WAP` ao usuário, causando confusão ao comparar com o álbum real.

## Objetivo

Exibir `FWC` em todos os pontos visíveis ao usuário para as figurinhas WAP-00..WAP-08, sem qualquer alteração no banco de dados ou no estado interno do app.

## Fora do escopo

- Migrations Supabase
- Renomeação de rotas, seletores, hooks ou estado React
- Alteração na lógica de cores, foil ou ícone dos cards (usa `teamCode` internamente)
- Tradução: o mapeamento WAP→FWC não é i18n, é um alias fixo de nomenclatura

## Invariante principal

`displayTeamCode` só existe na camada de apresentação e geração de texto compartilhado. Nunca atinge o estado, o Supabase ou os IDs internos.

---

## Arquitetura

### Novo arquivo: `src/lib/stickerDisplay.ts`

```ts
export function displayTeamCode(code: string): string {
  return code === 'WAP' ? 'FWC' : code
}
```

Arquivo separado para evitar dependência circular com `shareText.ts`.

### Modificações em arquivos existentes

| Arquivo | Mudança |
|---------|---------|
| `src/components/StickerCardCaptionColumn.tsx` | Linha 68: `{teamCode}` → `{displayTeamCode(teamCode)}` |
| `src/lib/shareText.ts` | `buildMissingShareBody` e `buildSwapsShareBody`: substituir `${teamCode}` por `${displayTeamCode(teamCode)}` nos tokens de figurinha |
| `src/lib/missingShareBuilders.ts` | Linha 55: mesma substituição no canvas |
| `src/lib/tradeListParse.ts` | Adicionar `normalizeTradeId`: mapeia `FWC-00..FWC-08` → `WAP-00..WAP-08` após o parse |

### Função de normalização no parser

```ts
function normalizeTradeId(id: string): string {
  const [team, num] = id.split('-')
  if (team === 'FWC' && Number(num) <= 8) return `WAP-${num}`
  return id
}
```

Aplicada no resultado de `parseTradeList` antes de retornar os IDs. Segura porque os números não colidem: WAP usa 00–08, FWC do catálogo usa 09–19.

---

## Comportamento após a mudança

| Ponto | Antes | Depois |
|-------|-------|--------|
| Label no card (StickerCardCaptionColumn) | `WAP` | `FWC` |
| Texto WhatsApp — faltantes | `WAP 01 · WAP 02` | `FWC 01 · FWC 02` |
| Texto WhatsApp — repetidas | `WAP 01 · WAP 02` | `FWC 01 · FWC 02` |
| Canvas imagem compartilhada | `WAP 01` | `FWC 01` |
| Parser de colagem / QR | `FWC 01` → `FWC-01` (não encontrado) | `FWC 01` → `WAP-01` (correto) |
| Nome da seção no Dashboard | "Abertura" | "Abertura" (sem mudança) |
| IDs no banco | `WAP-00..WAP-08` | `WAP-00..WAP-08` (sem mudança) |

---

## Testes

- `src/lib/stickerDisplay.test.ts` (novo): `displayTeamCode('WAP') === 'FWC'`, outros códigos passam inalterados
- `src/lib/tradeListParse.test.ts`: aliases `FWC 00..08` resolvem para `WAP-XX`
- `src/lib/shareText.test.ts`: grupos WAP emitem tokens `FWC XX` no corpo do share

## Verificação manual

- Abrir álbum → seção Abertura → cards mostram `FWC 00..08`
- Compartilhar lista de faltantes → texto gerado contém `FWC 01` etc.
- Colar uma lista copiada do app de volta → figurinhas WAP reconhecidas corretamente
