# Fase 02 — Qualidade de Código e Tipagem

## Contexto

- `next.config.mjs` tem `typescript.ignoreBuildErrors: true`. O projeto compila apesar de erros de tipo.
- 174 ocorrências de `any` / `as any` em paths críticos.
- ESLint sem regras customizadas além do default Next.
- Páginas monolíticas (>450 linhas) misturando data fetching, cálculo e UI.
- Sem formatador (Prettier) configurado.

## Objetivo

Tornar o pipeline de qualidade **honesto**: build falha em erro de tipo. Reduzir `any` a casos justificados. Padronizar lint e formatação. Quebrar páginas gigantes.

## Escopo

### Entra
- Remover `ignoreBuildErrors`.
- Corrigir todos os erros de tipo que apareçam.
- Eliminar `any` em código de aplicação (mantendo apenas onde justificado em comentário).
- Adicionar regras ESLint mínimas: `no-explicit-any`, `no-floating-promises`, `consistent-type-imports`.
- Adicionar Prettier + integração com ESLint.
- Quebrar 2 páginas mais pesadas (`dashboard/finance/page.tsx`, `dashboard/page.tsx`) movendo lógica para `lib/domain/`.
- Adicionar `pnpm typecheck` script.
- Configurar `tsconfig.json` para incluir mobile no checking opcional (sem quebrar build do web).

### Não entra
- Reescrever todas as páginas (só as duas piores).
- Mudar arquitetura.
- Adicionar testes (Fase 05).
- Mudar lógica de negócio.

## Prompt para o agente executor

```markdown
Você está executando a **Fase 02 — Qualidade de Código** do Gestão Garden, conforme `docs/fases/fase-02-qualidade-codigo.md`.

**Pré-requisitos:** Fase 00 mergeada. Fase 01 idealmente mergeada (mas não bloqueante; trabalhar em branch separada).

**Branch:** `feat/fase-02-qualidade-codigo` a partir de main.

**Leia antes:**
- `docs/03-padroes-e-convencoes.md`
- `next.config.mjs`, `tsconfig.json`, `eslint.config.mjs`, `package.json`

**Tarefas:**

### 1. Remover `ignoreBuildErrors`

Editar `next.config.mjs`:
```js
typescript: {
  // ignoreBuildErrors: true,  ← REMOVER
},
images: {
  unoptimized: true,  // manter por enquanto, será revisto na Fase 08
}
```

Rodar `pnpm tsc --noEmit` e capturar todos os erros. Corrigir um a um. **Não usar `// @ts-ignore` para silenciar.**

Categorias esperadas:
- Acessos a propriedades opcionais sem narrowing (`(profile as any).stripe_customer_id`).
- Tipos do Supabase não importados — usar tipos gerados (`pnpm supabase gen types typescript` se configurado, ou tipos manuais em `lib/domain/<contexto>/types.ts`).
- Tipos de eventos Stripe — usar `Stripe.Event` discriminado.
- Form data — tipar com Zod e inferir.

### 2. Eliminar `any`

Buscar com `rg "as any|: any|<any>"` em `app/`, `components/`, `lib/`, `middleware.ts`. Para cada ocorrência:
- Tente eliminar com tipos reais.
- Se for SDK terceiro sem tipos, criar tipo local em `lib/types/<sdk>.d.ts`.
- Se realmente inevitável, justificar com comentário acima:
  ```ts
  // any: <SDK> retorna union genérico; narrow após validação Zod abaixo.
  ```

Meta: zero `any` sem comentário justificando. **Comentário é obrigatório.**

NÃO substituir `any` por `unknown` cega — fazer narrowing com Zod ou type guard.

### 3. ESLint endurecido

Editar `eslint.config.mjs` adicionando regras (em flat config):
```js
{
  rules: {
    "@typescript-eslint/no-explicit-any": ["error", { ignoreRestArgs: false }],
    "@typescript-eslint/consistent-type-imports": "error",
    "@typescript-eslint/no-floating-promises": "error",
    "@typescript-eslint/no-misused-promises": "error",
    "no-console": ["warn", { allow: ["error", "warn"] }],
    "react-hooks/exhaustive-deps": "warn",
  }
}
```

Rodar `pnpm lint` e corrigir tudo. Meta: zero warnings.

### 4. Prettier

`pnpm add -D prettier eslint-config-prettier`

Criar `.prettierrc.json`:
```json
{
  "semi": true,
  "singleQuote": false,
  "trailingComma": "all",
  "printWidth": 100,
  "tabWidth": 2,
  "arrowParens": "always"
}
```

Criar `.prettierignore` (mesmo conteúdo de `.gitignore` + `pnpm-lock.yaml`).

Adicionar `eslint-config-prettier` ao `eslint.config.mjs`.

Adicionar scripts:
```json
"format": "prettier --write .",
"format:check": "prettier --check ."
```

Rodar `pnpm format` uma vez e commitar separadamente (`chore: aplicar prettier ao codebase`).

### 5. Scripts de qualidade

Adicionar/atualizar em `package.json`:
```json
"typecheck": "tsc --noEmit",
"check": "pnpm lint && pnpm typecheck && pnpm format:check"
```

### 6. Quebrar páginas monolíticas

#### `app/dashboard/finance/page.tsx` (458 linhas)
- Mover queries para `lib/domain/finance/queries.ts` (funções: `obterTransacoesDoMes`, `calcularKpisFinanceiros`, `obterCategorias`).
- Tipos em `lib/domain/finance/types.ts`.
- Componentes de UI específicos para `components/finance/` (cards de KPI, tabela, filtros).
- Página fica como orquestrador (~80–120 linhas).

#### `app/dashboard/page.tsx` (570 linhas)
- Mesma abordagem. Queries em `lib/domain/dashboard/queries.ts`. Componentes de KPI/charts em `components/dashboard/`.
- Cuidado: já existe pasta `components/dashboard/`. Reaproveitar e expandir.

Não mexer em outras páginas nesta fase, mesmo que estejam grandes.

### 7. Verificações finais

- `pnpm check` passa.
- `pnpm build` passa (sem `ignoreBuildErrors`).
- Diff de comportamento das páginas quebradas: zero (refator puro).
- Buscar `any` no diff novo: zero adições sem comentário.

**Restrições:**
- NÃO mudar lógica de negócio.
- NÃO renomear rotas, tabelas, colunas.
- NÃO adicionar testes (é Fase 05).
- NÃO tocar em mobile nesta fase.

**Entrega:**
- PR draft, título: `refactor(qualidade): habilitar typecheck no build, eliminar any e quebrar páginas monolíticas`.
- Commits separados por tarefa: `chore(prettier)`, `refactor(types)`, `refactor(eslint)`, `refactor(finance)`, `refactor(dashboard)`.

**Definition of Done — copiar para o PR:**
- [ ] `next.config.mjs` sem `ignoreBuildErrors`.
- [ ] `pnpm tsc --noEmit` passa.
- [ ] Zero `any` sem comentário justificativo no diff.
- [ ] ESLint com regras endurecidas, `pnpm lint` zero warnings.
- [ ] Prettier configurado e aplicado.
- [ ] Script `pnpm check` adicionado.
- [ ] `dashboard/finance/page.tsx` reduzida a < 150 linhas.
- [ ] `dashboard/page.tsx` reduzida a < 150 linhas.
- [ ] Comportamento das páginas quebradas inalterado (verificado manualmente).
```

## Definition of Done

- [ ] `ignoreBuildErrors` removido.
- [ ] Typecheck passa.
- [ ] `any` zerado (ou justificado).
- [ ] ESLint endurecido + Prettier.
- [ ] `pnpm check` script.
- [ ] 2 páginas refatoradas.

## Riscos

- **Quantidade de erros TS revelados pode ser grande.** Se passar de ~80 erros, pausar e abrir issue — pode justificar quebrar a fase em duas.
- **Quebra de comportamento ao refatorar páginas.** Sem testes, validar manualmente cada KPI antes/depois.
- **Prettier reformata 100% do projeto.** Fazer commit separado para isolar diff de formatação do diff de lógica.
