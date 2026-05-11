# 00 — Visão Técnica

## Produto

**Gestão Garden** é um SaaS B2B para profissionais autônomos de jardinagem e pequenas empresas do setor. Combina gestão operacional (clientes, agenda, ordens de serviço, estoque, financeiro) com um assistente de IA (Íris) que reduz fricção operacional via texto e voz.

**Modelo de receita:** assinatura mensal recorrente (Stripe).
**Planos atuais:** Básico (R$ 47,90) e Plus (R$ 77,90, inclui IA).

## Princípios de Engenharia

1. **Tipagem honesta.** TypeScript em modo `strict`, `any` é exceção justificada — não regra. Build não compila se houver erro de tipo.
2. **Segurança por padrão.** Autenticação obrigatória em toda rota não-pública. Service-role apenas em rotas administrativas e webhooks. RLS é a primeira linha de defesa, não a última.
3. **Idempotência onde há dinheiro ou efeito colateral externo.** Webhooks Stripe, push notifications e emissões de cobrança devem ser seguros para reentrada.
4. **Validação no boundary.** Toda entrada externa (API route, webhook, agente IA) passa por Zod. Internamente, confiamos nos tipos.
5. **Observabilidade não é opcional.** Logs estruturados, métricas de negócio, alertas. Falha silenciosa é o pior tipo de falha.
6. **Mudança incremental.** Feature flag quando o blast radius for grande. Migrações de banco com rollback documentado.
7. **Documentação executável.** O que está em `docs/` é a fonte da verdade. Decisões importantes viram ADR (`docs/adr/`).

## Estado Atual (snapshot)

### O que está bom

- Arquitetura macro coerente: Next.js App Router (web) + Expo (mobile) + Supabase (DB/auth) + Stripe + Groq.
- 35 migrações SQL versionadas, RLS aplicada nas tabelas principais.
- Sistema de IA bem estruturado: registry de intents tipadas, orquestrador com cache de contexto, classificação e pós-processamento.
- Documentação interna do projeto (`CLAUDE.md`) acima da média.

### Dívida técnica crítica

- `package.json` ainda chamado `my-v0-project`. README de duas linhas. Sem `.env.example`.
- `next.config.mjs` com `typescript.ignoreBuildErrors: true` — erros de tipo passam despercebidos.
- Coexistência de `package-lock.json` e `pnpm-lock.yaml`.
- 174 ocorrências de `any` / `as any` em paths críticos.
- Webhook Stripe **sem idempotência** (vetor para cobrança/ativação duplicada).
- Período de assinatura calculado em JS (`now + 1 mês`) em vez de ler `current_period_end` do Stripe.
- Rota `/api/push/send` **sem autenticação**.
- Rotas autenticadas usando `service_role` indevidamente, anulando RLS.
- Sem rate limiting em rotas caras (Groq, Stripe, push).
- Sem suíte de testes automatizada.
- Páginas monolíticas (>450 linhas) misturando data fetching, cálculo e UI.

### Riscos imediatos

| Risco                                                    | Impacto | Probabilidade      |
| -------------------------------------------------------- | ------- | ------------------ |
| Cobrança duplicada por retry de webhook                  | Alto    | Média              |
| Acesso pago liberado sem pagamento (período hardcoded)   | Alto    | Baixa              |
| Spam de push notifications via rota aberta               | Alto    | Alta se descoberto |
| Vazamento entre tenants via service-role + bug de lógica | Crítico | Baixa              |
| Stack quebrada após refator (sem testes)                 | Médio   | Alta               |

## Visão de 12 meses

- **Q1:** sair do estado v0 → MVP profissional. Fases 0–3 concluídas. Pagamentos auditados.
- **Q2:** IA com guardrails, suite de testes, observabilidade. Fases 4–6.
- **Q3:** mobile alinhado com web (CI/CD unificado), performance e escala. Fases 7–8.
- **Q4:** features de produto novas (multi-jardineiro por conta, marketplace de serviços, integrações fiscais BR). Plataforma estável o bastante para escalar marketing.

## Não-objetivos (hoje)

- Microserviços. Monolito Next.js + Supabase é adequado por pelo menos 18 meses.
- Migração para outro framework, banco ou cloud. Vercel + Supabase atende.
- Multi-idioma. Foco BR.
- App nativo separado (Swift/Kotlin). Expo continua.
