# Fase 05 — Testes Automatizados

## Contexto

Não há suíte de testes. Refator é arriscado, regressões silenciosas. Stack tem componentes críticos (auth, Stripe, IA) que falhar é caro.

## Objetivo

Estabelecer fundação de testes com Vitest (unit/integration) e Playwright (E2E). Cobrir o que é crítico — não buscar 100%. Integrar com CI.

## Escopo

### Entra
- Setup Vitest + `@testing-library/react` para componentes/utilitários.
- Setup Playwright para E2E web.
- Suite mínima cobrindo:
  - Auth helpers (`lib/auth/api.ts`).
  - Schemas Zod das intents.
  - Sincronização de assinatura Stripe (com mock do SDK).
  - Webhook idempotency (com fixture).
  - Sanitização de input da IA.
  - Cálculo de KPIs financeiros (após Fase 02).
  - E2E: signup → trial → checkout → dashboard.
  - E2E: login → criar cliente → criar agendamento.
- GitHub Actions rodando lint + typecheck + unit em PR; E2E em PR para main.
- Coverage report (não falha por threshold inicialmente).

### Não entra
- Testes para mobile (Detox/Maestro fica para Fase 07).
- Cobertura > 80%.
- Testes de carga.

## Prompt para o agente executor

```markdown
Você está executando a **Fase 05 — Testes Automatizados** do Gestão Garden.

**Pré-requisitos:** Fases 00, 01, 02, 03 mergeadas. Idealmente 04 também.

**Branch:** `feat/fase-05-testes`.

**Leia antes:**
- `docs/03-padroes-e-convencoes.md`
- Estrutura de `lib/` e `app/api/`

**Tarefas:**

### 1. Setup Vitest

```
pnpm add -D vitest @vitest/coverage-v8 @testing-library/react @testing-library/jest-dom jsdom
```

Criar `vitest.config.ts`:
```ts
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: ["./tests/unit/setup.ts"],
    coverage: { reporter: ["text", "lcov"], include: ["lib/**", "components/**"] },
    include: ["tests/unit/**/*.test.ts", "tests/unit/**/*.test.tsx"],
  },
  resolve: {
    alias: { "@": path.resolve(__dirname, ".") },
  },
});
```

`tests/unit/setup.ts`:
```ts
import "@testing-library/jest-dom/vitest";
```

Scripts em `package.json`:
```json
"test": "vitest run",
"test:watch": "vitest",
"test:coverage": "vitest run --coverage"
```

### 2. Suite de unit/integration

Criar arquivos:

- `tests/unit/lib/auth/api.test.ts` — extração de bearer, requireUser com cookie/bearer/sem auth, requireUserWithPlan rejeita basic em rota plus.
- `tests/unit/lib/agent/sanitize.test.ts` — limite de tamanho, escape de delimitadores.
- `tests/unit/lib/agent/intents/schemas.test.ts` — cada schema Zod tem ≥3 casos: válido, inválido (campo faltando), inválido (regra refinada).
- `tests/unit/lib/stripe/sync.test.ts` — `sincronizarAssinaturaDoStripe` mockando o SDK; cobrir status active/past_due/canceled, mudança de plano, period_end correto.
- `tests/unit/app/api/subscription/webhook.test.ts` — idempotência: duplicar evento retorna 200 sem reprocessar; assinatura inválida retorna 400.
- `tests/unit/lib/domain/finance/queries.test.ts` — cálculo de KPIs com dataset fixture.

Mockar Supabase com factory simples (`tests/unit/mocks/supabase.ts`) que devolve dados fixos ou erro controlado. Não rodar contra DB real em unit.

### 3. Setup Playwright

```
pnpm add -D @playwright/test
pnpm exec playwright install --with-deps chromium
```

`playwright.config.ts`:
```ts
import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  use: {
    baseURL: process.env.E2E_BASE_URL || "http://localhost:3000",
    trace: "on-first-retry",
  },
  projects: [{ name: "chromium", use: { ...devices.desktop_chromium } }],
  webServer: process.env.CI ? undefined : {
    command: "pnpm dev",
    port: 3000,
    reuseExistingServer: true,
  },
});
```

Scripts:
```json
"test:e2e": "playwright test",
"test:e2e:ui": "playwright test --ui"
```

### 4. Suites E2E

Criar:

- `tests/e2e/auth.spec.ts` — signup, recebe trial, vai para dashboard.
- `tests/e2e/checkout.spec.ts` — usuário autenticado clica em "Assinar Plus", redireciona pra Stripe (validar URL contém `checkout.stripe.com`).
- `tests/e2e/clients.spec.ts` — criar cliente, listar, editar, deletar.

Para E2E precisa de:
- Conta Supabase de teste (envs em `.env.test.local`).
- Stripe em modo test.
- Helper `tests/e2e/helpers/auth.ts` que cria usuário via Supabase admin e injeta sessão.

NÃO rodar E2E contra produção. Documentar setup no `tests/e2e/README.md`.

### 5. CI no GitHub Actions

Criar `.github/workflows/ci.yml`:

```yaml
name: CI
on:
  pull_request:
    branches: [main]
  push:
    branches: [main]

jobs:
  lint-test-build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with: { version: 10 }
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: pnpm }
      - run: pnpm install --frozen-lockfile
      - run: pnpm lint
      - run: pnpm typecheck
      - run: pnpm test
      - run: pnpm build
        env:
          NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.NEXT_PUBLIC_SUPABASE_URL }}
          NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.NEXT_PUBLIC_SUPABASE_ANON_KEY }}
          # demais envs necessárias para build

  e2e:
    if: github.base_ref == 'main' || github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    needs: lint-test-build
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with: { version: 10 }
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: pnpm }
      - run: pnpm install --frozen-lockfile
      - run: pnpm exec playwright install --with-deps chromium
      - run: pnpm build
      - run: pnpm test:e2e
        env:
          E2E_BASE_URL: http://localhost:3000
          # envs de teste
```

Documentar quais secrets configurar no GitHub.

### 6. Verificações finais

- `pnpm test` passa localmente.
- `pnpm test:e2e` passa localmente (com `.env.test.local` configurado).
- CI roda em PR e passa.
- README atualizado com seção "Testes".

**Restrições:**
- NÃO atingir cobertura artificial. 30% bem direcionado é melhor que 80% inflado.
- NÃO criar testes de mobile (Fase 07).

**Entrega:**
- PR draft.
- Título: `feat(testes): suite Vitest, Playwright E2E e CI no GitHub Actions`.

**Definition of Done — copiar para o PR:**
- [ ] Vitest configurado, ≥6 arquivos de teste unit/integration.
- [ ] Playwright configurado, ≥3 specs E2E.
- [ ] `pnpm test` e `pnpm test:e2e` rodam localmente.
- [ ] GitHub Actions com job de lint+typecheck+test+build em PR.
- [ ] Job E2E para PRs em main.
- [ ] README com seção de testes (como rodar, como adicionar).
- [ ] Coverage report gerando em `coverage/` (não enforçar threshold ainda).
```

## Definition of Done

- [ ] Vitest + Playwright configurados.
- [ ] Suite mínima cobrindo auth, IA, Stripe, finance, E2E.
- [ ] CI no GitHub Actions.
- [ ] Documentação de testes.

## Riscos

- **E2E flakiness.** Stripe checkout não é determinístico em CI. Considerar mockar o redirect e validar apenas a chamada à API.
- **Secrets em CI.** Setup inicial demora. Documentar em detalhe quais envs configurar.
- **Tempo de build cresce.** Aceitável até ~5min. Acima disso, paralelizar.
