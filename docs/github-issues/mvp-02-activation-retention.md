## Contexto

Produto precisa medir ativação e retorno sem adicionar vendor novo no MVP. Scanner fora do escopo.

## Escopo

- Definir métricas: cadastro/login concluído, seed do álbum, primeira figurinha alterada, uso por aba, retorno D1/D7 (via eventos Vercel ou agregação manual inicial).
- Garantir eventos mínimos (`auth_signed_in`, `album_seeded`, `sticker_quantity_changed`, `nav_tab_selected`) com propriedades estáveis.
- Documentar como ler essas métricas na Vercel (ou planilha de apoio) até eventual PostHog.

## Fora de escopo

- Funis de scanner/OCR.
- PostHog ou cohorts avançados.

## Critérios de aceite

- [ ] Definições de ativação/retenção escritas em `docs/`.
- [ ] Eventos necessários instrumentados e validados em preview.
- [ ] Lista de métricas MVP vinculada à taxonomia de eventos.

## Referências

- `docs/mvp-quality-and-observability.md`
