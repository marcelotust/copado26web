# Registro simplificado de tratamento (ROPA — MVP)

Versão: 2026-05-15 · App: **Meu Álbum 2026**

> Documento operacional para transparência LGPD. Não substitui assessoria jurídica.

## Controlador

**Meu Álbum 2026** — privacidade: [hello@copa26web.app](mailto:hello@copa26web.app)

## Categorias de dados

| Categoria | Exemplos | Finalidade | Base legal (LGPD) |
|-----------|----------|------------|-------------------|
| Conta | e-mail, ID de usuário (Supabase Auth) | autenticação, sincronização do álbum | execução de contrato |
| Álbum | quantidades por figurinha, progresso em desafios | prestação do serviço | execução de contrato |
| Preferências locais | idioma, consentimento de analytics, backups CSV no dispositivo | UX e direitos do titular | legítimo interesse / consentimento (analytics) |
| Uso do produto | eventos anônimos (Vercel/PostHog) **após opt-in** | melhoria do app | consentimento |
| Técnicos | erros sanitizados (Sentry, após opt-in), trilha de auditoria (ações sensíveis) | segurança, diagnóstico, conformidade | legítimo interesse |

**Não coletamos** no MVP: nome legal, CPF, endereço, telefone, conteúdo de câmera/OCR persistido em servidor (scanner fora do escopo de sync).

## Subprocessadores

| Fornecedor | Serviço | Dados tratados | Região / notas |
|------------|---------|----------------|----------------|
| [Supabase](https://supabase.com/privacy) | Auth + Postgres + Realtime | conta, álbum, auditoria | conforme região do projeto |
| [Vercel](https://vercel.com/legal/privacy-policy) | hospedagem, Analytics | pageviews; eventos após consentimento | EUA / política Vercel |
| [Google](https://policies.google.com/privacy) | OAuth (login opcional) | identificador de login | EUA |
| [PostHog](https://posthog.com/privacy) | analytics de produto (opt-in) | eventos pseudonimizados | EU / US conforme projeto |
| [Sentry](https://sentry.io/privacy/) | monitoramento de erros (opt-in) | stack traces e contexto **sanitizado** | conforme projeto Sentry |

## Retenção

| Dado | Prazo |
|------|--------|
| Conta e álbum (`user_stickers`, desafios) | enquanto a conta existir; **exclusão de conta** remove dados associados (cascade) |
| Trilha `audit_events` | 24 meses (revisão operacional); metadados sem PII |
| Backups CSV locais | controlados pelo usuário no navegador (até 30 dias por snapshot) |
| Analytics / Sentry | conforme política do fornecedor e preferência de consentimento revogável em Configurações |
| Logs de aplicação (cliente) | não persistidos em servidor no MVP |

## Direitos do titular

| Direito | Como exercer no app |
|---------|---------------------|
| Acesso / portabilidade | Configurações → Exportar CSV |
| Correção | editar quantidades no álbum |
| Eliminação | Configurações → Excluir minha conta |
| Revogação de consentimento (analytics) | banner inicial ou Configurações → Privacidade |
| Oposição / dúvidas | e-mail do controlador |

Procedimento interno: [data-subject-requests.md](./data-subject-requests.md)

## Transferência internacional

Subprocessadores podem processar dados fora do Brasil. O controlador deve manter cláusulas contratuais e DPA conforme revisão jurídica.

## Segurança

- RLS no Postgres por `auth.uid()`
- CSP e cabeçalhos HTTP na Vercel
- Sanitização de PII em logs/Sentry (`scrubRecord`)
- Operações sensíveis registradas em `audit_events` (reset, exclusão, import em massa)

## Incidentes

Ver [data-subject-requests.md](./data-subject-requests.md#incidentes-de-segurança).
