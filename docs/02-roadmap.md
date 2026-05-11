# 02 — Roadmap

Plano de execução para sair do estado atual (v0/MVP frágil) até o estado-alvo descrito em `01-arquitetura-alvo.md`.

## Princípios do roadmap

1. **Segurança e correção financeira primeiro.** Nada que envolva Stripe e auth pode esperar.
2. **Cada fase é uma branch e um PR.** Sem mistura.
3. **Cada fase tem prompt executável próprio** em `docs/fases/`.
4. **Sem fase grande demais.** Se um prompt estourar 1 dia de trabalho de um agente, dividir.
5. **CTO/Tech Lead aprova antes do merge.** Mesmo que o código esteja OK, o resumo precisa bater com o `Definition of Done`.

## Visão geral

| Fase   | Tema                                    | Estimativa | Bloqueia produção? | Depende de |
| ------ | --------------------------------------- | ---------- | ------------------ | ---------- |
| **00** | Preparação e rebrand para Gestão Garden | 0.5 dia    | Não                | —          |
| **01** | Segurança crítica                       | 2 dias     | **Sim**            | 00         |
| **02** | Qualidade de código e tipagem           | 2 dias     | Não                | 00         |
| **03** | Pagamentos robustos e modelo de dados   | 3 dias     | **Sim**            | 01         |
| **04** | IA (Íris): guardrails e confirmação     | 2 dias     | Parcial            | 01, 02     |
| **05** | Testes automatizados                    | 3 dias     | Não                | 02, 03     |
| **06** | Observabilidade e operação              | 2 dias     | Não                | 02         |
| **07** | Mobile alinhado e CI/CD                 | 2 dias     | Não                | 02, 05     |
| **08** | Performance e escala                    | 2 dias     | Não                | 02, 03     |

**Caminho crítico para sair do v0 e cobrar com segurança:** `00 → 01 → 03`. **~5–6 dias de trabalho de agente.**

**Caminho crítico para escalar marketing:** `00 → 01 → 02 → 03 → 04 → 05 → 06`. **~14 dias.**

## Definição de "produção pronta"

Um item é considerado **bloqueador de produção** se sua ausência causa:

- Perda financeira (cobrança incorreta, acesso pago sem pagamento).
- Vazamento de dados entre tenants.
- Vetor de abuso explorável sem credenciais.
- Falha silenciosa em fluxo de dinheiro.

Os itens bloqueadores hoje são:

- Webhook Stripe sem idempotência (Fase 03).
- Período de assinatura hardcoded (Fase 03).
- `/api/push/send` sem autenticação (Fase 01).
- Service-role em rotas autenticadas de domínio (Fase 01).
- Prompt injection com side-effects via service-role no agente (Fase 01 + 04).

## Cadência sugerida

- **1 fase por sprint de 1 semana** se a equipe tiver 1 dev sênior + agente.
- **Paralelismo possível** entre fases independentes, ex: `02` e `04` podem rodar em paralelo se o time tiver 2 agentes (cada um numa branch separada).
- **Fase 05 (testes)** pode começar em paralelo com `03` e `04` cobrindo o que já existe.

## Checkpoints do CTO

Após cada fase, antes do merge:

1. Conferir que o resumo do agente cita cada item do `Definition of Done` da fase.
2. Rodar `pnpm lint && pnpm tsc --noEmit && pnpm build` localmente (ou via CI).
3. Conferir que a fase não introduziu `any` novos, nem `// @ts-ignore`, nem `// eslint-disable` sem comentário justificando.
4. Conferir que o diff não toca arquivos fora do escopo declarado da fase.
5. Em fases de segurança/pagamento, ler manualmente o diff das rotas críticas. Não delegar.

## Saída de cada fase

Cada fase produz no PR:

- Código.
- Migrações SQL (se aplicável) em `supabase/migrations/`.
- Atualização de `.env.example` se novas envs surgiram.
- Atualização de `docs/` se padrões mudaram.
- ADR em `docs/adr/` se houve decisão arquitetural relevante.
- Resumo no corpo do PR com: o que mudou, o que NÃO foi feito (e por quê), riscos, como testar.
