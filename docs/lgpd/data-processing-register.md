# Registro simplificado de tratamento (MVP)

Versão: 2026-05-12

## Controlador

Meu Álbum 2026 — contato de privacidade: `privacy@meualbum2026.app` (placeholder até definição operacional).

## Categorias de dados

| Categoria | Exemplos | Finalidade | Base legal (LGPD) |
|-----------|----------|------------|-------------------|
| Conta | e-mail, identificador de usuário | autenticação e sincronização do álbum | execução de contrato / legítimo interesse |
| Álbum | quantidades por figurinha, metadados do catálogo | prestação do serviço | execução de contrato |
| Uso | eventos anônimos de produto (com consentimento) | melhoria do app | consentimento |
| Técnicos | logs de erro sanitizados (Sentry, quando habilitado) | segurança e diagnóstico | legítimo interesse |

## Subprocessadores

| Fornecedor | Serviço | Dados tratados | Região |
|------------|---------|----------------|--------|
| Supabase | Auth + Postgres | conta, progresso do álbum | conforme projeto Supabase |
| Vercel | hospedagem + analytics | pageviews e eventos consentidos | conforme projeto Vercel |
| Google | OAuth opcional | identificação de login | EUA / política Google |
| Sentry | monitoramento de erros | erros e contexto sanitizado | conforme projeto Sentry |

## Retenção

- Conta e álbum: enquanto a conta estiver ativa; exclusão remove dados associados.
- Analytics: conforme política da Vercel e preferência de consentimento do usuário.
- Logs de erro: conforme política do Sentry e configuração de retenção do projeto.

## Direitos do titular

Exportação CSV nas configurações; exclusão de conta prevista em issue dedicada (#19).

## Transferência internacional

Pode ocorrer quando subprocessadores processam dados fora do Brasil; contratos e salvaguardas devem ser formalizados na revisão jurídica.

## Incidentes

Procedimento operacional a definir com o controlador: triagem, contenção, comunicação à ANPD e titulares quando aplicável.
