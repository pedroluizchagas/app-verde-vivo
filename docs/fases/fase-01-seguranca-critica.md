# Fase 01 — Segurança Crítica

## Contexto

A auditoria identificou vulnerabilidades **bloqueantes para produção**:

1. **`/api/push/send` sem autenticação** — qualquer um envia push para qualquer `userId`.
2. **Service-role usada em rotas autenticadas de domínio** (`assistant`, `subscription/checkout`, `verify-payment`, `reopen-payment`, `auth-debug`) — anula RLS, expande blast radius se um JWT vazar.
3. **Rota `/api/auth-debug` exposta** — vetor de enumeração.
4. **Sem rate limiting** em rotas caras (Groq, Stripe, push) — abuso direto na conta.
5. **Extração de Bearer token duplicada em 3+ lugares** com pequenas diferenças — superfície de ataque inconsistente.
6. **Headers de segurança ausentes** (CSP, HSTS, X-Frame-Options).

## Objetivo

Fechar todos os vetores acima. Centralizar autenticação. Reduzir uso de `service_role` ao mínimo legítimo. Introduzir rate limiting. Endurecer headers.

## Escopo

### Entra
- Centralização de auth em `lib/auth/api.ts` (`requireUser`, `requireUserWithPlan`, `getOptionalUser`).
- Proteção de `/api/push/send`.
- Remoção (ou hard-protect) de `/api/auth-debug`.
- Migração de rotas autenticadas para usar JWT do usuário em vez de service-role, exceto onde justificado (auth callback, webhook Stripe, jobs internos).
- Rate limiting em rotas caras (Upstash Ratelimit ou solução equivalente).
- Headers de segurança em `next.config.mjs`.
- Documentação dos pontos onde service-role permanece e por quê.

### Não entra
- Idempotência de webhook Stripe (Fase 03).
- Período hardcoded de assinatura (Fase 03).
- Guardrails do prompt da Íris (Fase 04).
- Eliminação de `any` (Fase 02).

## Prompt para o agente executor

```markdown
Você está executando a **Fase 01 — Segurança Crítica** do Gestão Garden, conforme `docs/fases/fase-01-seguranca-critica.md`.

**Pré-requisitos:** Fase 00 mergeada.

**Branch:** `feat/fase-01-seguranca-critica` a partir de main.

**Leia antes de começar:**
- `docs/00-visao-tecnica.md` (princípios)
- `docs/01-arquitetura-alvo.md` (camadas alvo, especialmente Auth e Segurança)
- `docs/03-padroes-e-convencoes.md` (regras de código)
- Código atual: `middleware.ts`, `lib/supabase/*.ts`, `app/api/**/*.ts`

**Tarefas:**

### 1. Centralizar autenticação em `lib/auth/api.ts`

Criar módulo único com:
- `extractBearerToken(request: NextRequest): string | null` — só `Authorization: Bearer <token>`. Remover suporte a `x-access-token`, `x-supabase-access-token`, `x-authorization` (reduz superfície). Atualizar mobile se usar variantes.
- `getSupabaseFromRequest(request)`: retorna cliente Supabase (com cookies OU bearer), nunca service-role.
- `requireUser(request)`: retorna `{ supabase, user }` ou lança `Response(401)`.
- `requireUserWithPlan(request, plan: "basic" | "plus")`: usa `requireUser` + valida plano via query no banco (RLS protege).
- `getOptionalUser(request)`: para rotas que aceitam não-logado.

Substituir todos os usos espalhados (`getSupabaseAndUserFromApiRequest`, extração ad-hoc) por estes helpers. **Deletar** os arquivos antigos (`lib/supabase/api-route-auth.ts`, `lib/supabase/with-token.ts`) só depois que nada mais importar deles.

### 2. Proteger `/api/push/send`

Estado atual: aceita `userIds[]` arbitrários sem auth.

Mudar para:
- `requireUser(request)` no início.
- Restrição de domínio: `userIds` só pode conter o `user.id` autenticado, OU se for chamada interna (cron/webhook), exigir header `X-Internal-Token` validado contra env `INTERNAL_API_TOKEN`.
- Validar payload com Zod (mensagem, dados, tamanho máximo).
- Retornar 403 se `userIds` não passar.

### 3. Remover ou proteger `/api/auth-debug`

Opção preferida: **deletar** o arquivo. Se houver caso de uso real (raro), envolver em:
- `if (process.env.NODE_ENV !== "development") return new Response("Not Found", { status: 404 });`
- Adicionalmente, exigir `requireUser` e retornar apenas dados do próprio usuário.

### 4. Reduzir uso de `service_role`

Para cada arquivo que usa `createServiceRoleClient()`:

- `app/auth/callback/route.ts` → **manter** (bootstrap de profile/trial precisa). Adicionar comentário justificando.
- `app/api/subscription/webhook/route.ts` → **manter** (webhook Stripe é admin). Adicionar comentário justificando.
- `app/api/assistant/route.ts` → **substituir** por `requireUserWithPlan(request, "plus")` + cliente JWT. RLS já garante isolamento.
- `app/api/subscription/checkout/route.ts` → **substituir**. Operações em `subscriptions` e `profiles` do próprio usuário rodam sob RLS. Onde precisar de admin (raro), isolar em função no banco com `security definer` invocada por RPC.
- `app/api/subscription/verify-payment/route.ts` → **substituir** por cliente JWT. Comparações usam `eq("gardener_id", user.id)`.
- `app/api/subscription/reopen-payment/route.ts` → **substituir** por cliente JWT.

Antes de substituir, verificar que as policies RLS permitem as operações necessárias (SELECT/UPDATE em `subscriptions` e `profiles` quando `gardener_id = auth.uid()`). Se a policy estiver insuficiente, criar migração nova em `supabase/migrations/` para complementar.

Após a fase, deve restar service-role apenas em:
- `app/auth/callback/route.ts`
- `app/api/subscription/webhook/route.ts`

Documentar isso em `docs/01-arquitetura-alvo.md` se ainda não estiver explícito (deve estar).

### 5. Rate limiting

Adotar **Upstash Ratelimit** (`@upstash/ratelimit` + `@upstash/redis`):

- `pnpm add @upstash/ratelimit @upstash/redis`
- Adicionar envs em `.env.example`:
  ```
  UPSTASH_REDIS_REST_URL=
  UPSTASH_REDIS_REST_TOKEN=
  ```
- Criar `lib/rate-limit.ts` exportando limiters nomeados:
  - `assistantLimiter`: 30 req / 1 min por user.
  - `transcribeLimiter`: 10 req / 5 min por user.
  - `checkoutLimiter`: 5 req / 1 min por user.
  - `pushLimiter`: 60 req / 1 min por user.
  - `webhookLimiter`: 1000 req / 1 min por IP (proteção mínima de webhook).
- Aplicar em cada rota correspondente. Em ausência de envs Upstash (dev), no-op com warning no console.
- Resposta de rate limit: `429` com header `Retry-After`.

### 6. Headers de segurança

Atualizar `next.config.mjs` para incluir:
```js
async headers() {
  return [
    {
      source: "/(.*)",
      headers: [
        { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
        { key: "X-Frame-Options", value: "DENY" },
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        { key: "Permissions-Policy", value: "camera=(), microphone=(self), geolocation=()" },
      ],
    },
  ];
}
```
CSP fica para Fase 06 (precisa de inventário de origens). NÃO adicionar CSP nesta fase.

NÃO mexer em `typescript.ignoreBuildErrors` aqui — é Fase 02.

### 7. Validações

- Cada rota que tem body JSON valida com Zod no início.
- Mensagens de erro padronizadas: `{ error: string, details?: unknown }`.
- Status codes seguindo `docs/03-padroes-e-convencoes.md`.

### 8. Verificações finais

- `pnpm lint`, `pnpm tsc --noEmit`, `pnpm build` passam.
- Manualmente: testar fluxo de checkout, assistente IA, push (com Postman/curl simulando bearer válido e inválido).
- Conferir que rota `/api/push/send` rejeita request sem auth com 401.
- Conferir que rota `/api/auth-debug` retorna 404 (ou foi deletada).
- Buscar `createServiceRoleClient` no projeto: deve aparecer apenas nos 2 arquivos listados.
- Buscar `x-access-token`, `x-supabase-access-token`, `x-authorization`: zero ocorrências.
- Conferir que `mobile/` ainda funciona com Bearer (testar login + uma tela autenticada).

**Restrições:**
- NÃO mexer em lógica de webhook Stripe (idempotência, period_end) — é Fase 03.
- NÃO eliminar `any` proativamente — é Fase 02. Se um `any` aparecer no caminho da refatoração, ok corrigir, mas não fazer caça sistemática.
- NÃO mexer no orquestrador da Íris — é Fase 04.

**Entrega:**
- PR draft seguindo `docs/04-checklist-pr.md`.
- Título: `feat(seguranca): centralizar auth, restringir service-role e adicionar rate limit`.
- Resumo no PR cobrindo cada uma das 8 tarefas.
- Lista explícita de "rotas que mudaram" e "envs novas".

**Definition of Done — copiar para o PR:**
- [ ] `lib/auth/api.ts` é o único ponto de entrada de auth em API routes.
- [ ] `getSupabaseAndUserFromApiRequest` e helpers antigos deletados.
- [ ] `/api/push/send` exige auth e valida `userIds`.
- [ ] `/api/auth-debug` deletada ou restrita a `NODE_ENV=development`.
- [ ] Service-role usada apenas em `auth/callback` e `subscription/webhook`, com comentário.
- [ ] Rate limit aplicado em assistant, transcribe, checkout, push.
- [ ] Headers de segurança configurados em `next.config.mjs` (sem CSP).
- [ ] `.env.example` atualizado com envs do Upstash.
- [ ] Mobile testado e funcionando com Bearer.
- [ ] Lint, TS, build passam.
```

## Definition of Done

- [ ] `lib/auth/api.ts` único ponto de auth.
- [ ] Helpers antigos deletados.
- [ ] `/api/push/send` autenticada.
- [ ] `/api/auth-debug` removida ou trancada.
- [ ] Service-role apenas em `auth/callback` e `subscription/webhook`.
- [ ] Rate limit em rotas caras.
- [ ] Headers de segurança aplicados.
- [ ] Mobile validado.

## Riscos

- **Mobile envia token em header não-padrão.** Antes de remover suporte a aliases, confirmar no `mobile/` que só usa `Authorization: Bearer`.
- **RLS pode estar incompleta** em `subscriptions` e `profiles` para o caso de UPDATE. Ao migrar fora de service-role, testar cada operação. Se faltar policy, criar migração.
- **Upstash em ambiente sem envs.** Ratelimit deve degradar para no-op com aviso, nunca quebrar a app.
- **Lock-out acidental.** Em ambientes de teste/staging, o rate limit pode atrapalhar QA. Permitir override por env `RATE_LIMIT_DISABLED=true` (apenas em não-produção).
