---
title: Settings — Importar álbum colando lista da Panini
date: 2026-06-03
issue: "#253"
status: approved
---

## Problema

A única forma de importar o álbum hoje é via CSV, o que exige salvar e fazer upload de um arquivo.
Muitos usuários já têm a lista de figurinhas no formato de texto que o app da Panini exporta
ao compartilhar coleção, e precisam de um caminho mais rápido.

## Não está no escopo

- Exportação em formato Panini
- Reconhecimento de variações tipográficas exóticas (ex: letras minúsculas, separadores alternativos além de vírgula/espaço)
- Importação em lote de múltiplos usuários
- Substituição ou alteração da importação por CSV existente

## Formato de entrada

Exportação padrão do app da Panini:

```
FWC 4, 6, 7, 8
BRA 2
MEX 1, 5
KOR 13, 20
```

Regras de parse:
- Uma linha por time; linhas em branco ignoradas
- Primeiro token da linha = `team_code` (letras maiúsculas, sem dígitos)
- Resto da linha = números de figurinha separados por vírgula e/ou espaço
- Linhas mal-formadas (sem números válidos após o código) são ignoradas silenciosamente
- Códigos de time não encontrados no catálogo são coletados como avisos, mas não bloqueiam a importação

## Arquitetura

### Novos arquivos

| Arquivo | Responsabilidade |
|---|---|
| `src/lib/albumPaste.ts` | Parser do formato Panini + validação contra catálogo |
| `src/lib/albumPaste.test.ts` | Testes unitários do parser |
| `src/components/SettingsImportPasteSection.tsx` | Componente de UI independente |

### Arquivos modificados

| Arquivo | Mudança |
|---|---|
| `src/pages/SettingsPage.tsx` | Adicionar `<SettingsImportPasteSection />` na seção "data" |
| `src/i18n/locales/pt-BR.json` | Novas chaves `settings.importPaste*` |

### `albumPaste.ts`

```ts
// Índice interno construído na chamada: team_code → number → sticker_id
type PasteLookup = Map<string, Map<number, string>>

type ParsePasteResult = {
  found: Map<string, number>  // sticker_id → 1 (quantidade base)
  unknownCodes: string[]       // team_codes presentes no texto mas ausentes no catálogo
}

function buildPasteLookup(catalog: Map<string, CatalogSticker>): PasteLookup
function parsePasteText(text: string, lookup: PasteLookup): ParsePasteResult
```

### Modos de merge

Aplicados no momento de confirmar, antes de chamar `replaceAllQuantities`:

| Modo | Comportamento |
|---|---|
| **Adicionar ao meu álbum** (padrão) | Para cada figurinha em `found`: `Math.max(existente ?? 0, 1)` — nunca reduz |
| **Substituir tudo** | Itera todo o catálogo: listadas = 1, não-listadas = 0; mapa completo passado para `replaceAllQuantities` |

## Fluxo de UI

```
[Textarea com placeholder]
[Botão "Importar lista"]
       ↓
  parse + validação
       ↓
  nenhuma figurinha? → erro inline
  figurinhas válidas? → SimpleDialog de preview
       ↓ preview
  - "N figurinhas encontradas"
  - avisos de códigos desconhecidos (se houver)
  - diff resumido (novas / alteradas)
  - radio: "Adicionar ao meu álbum" | "Substituir tudo"
  [Cancelar]  [Continuar…]
       ↓ Continuar
  ConfirmModal com resumo do modo escolhido
  [Voltar]  [Sim, importar]
       ↓ confirmar
  replaceAllQuantities(mergedMap)
  toast de sucesso + limpa textarea
```

A textarea é limpa apenas após importação confirmada com sucesso.

## Telemetria

Evento `ALBUM_IMPORTED` (mesmo evento do CSV) com campos adicionais:

```ts
telemetry.track(AnalyticsEvent.ALBUM_IMPORTED, {
  source: 'paste',
  mode: 'additive' | 'replace',
  found: number,
  unknownCodes: number,
  changed: number,
  added: number,
  removed: number,
})
```

Gateado por consentimento LGPD — nenhum conteúdo do texto colado é enviado.

## i18n — novas chaves (`settings.importPaste*`)

```json
"importPasteTitle": "Colar lista da Panini",
"importPastePlaceholder": "Cole aqui a lista exportada pelo app da Panini\nEx: BRA 1, 2\n    MEX 5, 7",
"importPasteButton": "Importar lista",
"importPasteErrorEmpty": "Nenhuma figurinha reconhecida no texto colado.",
"importPastePreviewTitle": "Revisar importação",
"importPasteFound": "{{n}} figurinhas encontradas",
"importPasteUnknownCodes": "Códigos não reconhecidos: {{codes}}",
"importPasteModeAdditive": "Adicionar ao meu álbum",
"importPasteModeAdditiveDesc": "Só marca as figurinhas que você ainda não tem. Nada é removido.",
"importPasteModeReplace": "Substituir tudo",
"importPasteModeReplaceDesc": "Seu álbum atual será substituído: listadas ficam com 1, demais com 0.",
"importPasteConfirmTitle": "Aplicar importação?",
"importPasteConfirmDescAdditive": "As figurinhas listadas serão adicionadas ao seu álbum. Continuar?",
"importPasteConfirmDescReplace": "Seu álbum atual será sobrescrito. Não dá para desfazer automaticamente. Continuar?",
"importPasteImporting": "Importando…",
"importPasteConfirmYes": "Sim, importar",
"importPasteConfirmNo": "Voltar",
"importPasteErrorNetwork": "Não foi possível salvar no servidor. Verifique a conexão e tente de novo."
```

## Critérios de aceite

- [ ] Textarea visível na seção "Dados" de Settings, abaixo do botão CSV
- [ ] Suporta o formato Panini: `CÓDIGO num1, num2, num3`
- [ ] Linhas mal-formadas e códigos desconhecidos não bloqueiam — apenas avisos
- [ ] Preview mostra quantidade encontrada, avisos e diff antes de confirmar
- [ ] Modo "Adicionar" preserva quantidades existentes (nunca reduz)
- [ ] Modo "Substituir" passa o mapa completo para `replaceAllQuantities`
- [ ] Textarea limpa apenas após importação bem-sucedida
- [ ] Todos os textos via i18n
- [ ] Evento `ALBUM_IMPORTED` com `source: 'paste'` e `mode`
- [ ] Testes unitários de `parsePasteText` cobrindo: formato normal, linhas em branco, códigos inválidos, números duplicados, mix de formatos
