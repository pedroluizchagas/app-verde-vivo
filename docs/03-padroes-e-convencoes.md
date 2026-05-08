# 03 — Padrões e Convenções

Padrões obrigatórios. Desvios precisam de justificativa no PR.

## Idioma

- **Código em pt-BR** para identificadores de domínio (variáveis, funções, comentários, mensagens, nomes de tabelas/colunas quando fizer sentido).
- **Identificadores técnicos em inglês** quando convenção da plataforma exige (ex: `useState`, `getServerSideProps`, `onClick`).
- **Datas e moeda:** `Intl.DateTimeFormat("pt-BR")` e `Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" })`.

## Naming

| Item | Convenção | Exemplo |
|---|---|---|
| Arquivo de componente | kebab-case + `.tsx` | `delete-appointment-button.tsx` |
| Arquivo de utilitário | kebab-case + `.ts` | `formatar-moeda.ts` |
| Função/Componente React | PascalCase | `DeleteAppointmentButton` |
| Função utilitária | camelCase | `formatarMoeda` |
| Constante de módulo | UPPER_SNAKE_CASE | `MAX_TENTATIVAS` |
| Tipo / Interface | PascalCase | `OrcamentoStatus`, `Cliente` |
| Tabela Supabase | snake_case plural | `clients`, `work_orders` |
| Coluna Supabase | snake_case singular | `gardener_id`, `created_at` |

## TypeScript

- `strict: true` no `tsconfig.json`.
- `next.config.mjs` **NÃO** pode ter `typescript.ignoreBuildErrors: true`.
- `any` é exceção. Quando inevitável, justificar com comentário:
  ```ts
  // any: SDK terceiro não exporta tipo X (rastreio: <link/issue>)
  const x = sdkResponse as any;
  ```
- Preferir `unknown` + narrowing a `any`.
- Tipos de domínio em `lib/domain/<contexto>/types.ts`.
- Schemas Zod em `lib/validation/` quando compartilhados; senão, ao lado do consumidor.

## Imports

- Sempre **path alias** `@/`. Nunca `../../`.
- Ordem: externos → `@/` → relativos (raros).
- Sem `import * as X` em código de aplicação (só em testes ou tooling).

## Componentes React

- Server Component por padrão. `"use client"` apenas em componentes que usam hooks ou eventos.
- Props tipadas com `interface` no topo do arquivo:
  ```tsx
  interface ClienteCardProps {
    cliente: Cliente;
    onEditar?: () => void;
  }
  ```
- Estado com `useState` para forms simples; `react-hook-form` para forms grandes.
- Sem Redux, sem Zustand, sem Context global. Estado de servidor vem do server component.

## API routes

- Sempre `export const runtime = "nodejs"` quando usar libs Node.
- Auth via `requireUser(request)` ou `requireUserWithPlan(request, "plus")` de `@/lib/auth/api`.
- Validação de body com Zod no início:
  ```ts
  const body = schemaCriarCliente.safeParse(await request.json());
  if (!body.success) {
    return NextResponse.json({ error: body.error.flatten() }, { status: 400 });
  }
  ```
- Erros sempre retornam JSON `{ error: string }` (sem stack trace ao cliente).
- Códigos: `400` validação, `401` sem auth, `403` sem permissão, `404` não encontrado, `409` conflito, `429` rate limit, `500` interno.

## Banco de dados

- Toda tabela de domínio tem coluna `gardener_id uuid not null references auth.users(id) on delete cascade`.
- RLS ligada em **todas** as tabelas de domínio.
- Política mínima:
  ```sql
  create policy "<tabela>_owner" on public.<tabela>
    for all using (auth.uid() = gardener_id) with check (auth.uid() = gardener_id);
  ```
- Toda coluna usada em `where`/`order` em query quente tem índice.
- `created_at`/`updated_at` em todas as tabelas. Trigger para `updated_at`.
- Migrações em `supabase/migrations/<YYYYMMDDHHMM>_<descricao>.sql`. Cada uma:
  - Idempotente (`if not exists`, `do $$ ... $$`) quando possível.
  - Tem comentário `-- DOWN:` documentando o rollback manual.

## Segurança

- **Service role** apenas em: `auth/callback`, `subscription/webhook`, jobs internos. Qualquer outra rota usando `createServiceRoleClient()` precisa de comentário justificando.
- **Sem `console.log`** em código produzido (use logger). `console.error` aceitável temporariamente até Fase 06.
- **Secrets** apenas em env. Nunca em código, nunca em log. Nunca em respostas de erro.
- **CSRF**: Next + Supabase já protege rotas com cookie. Rotas com Bearer (mobile) precisam validar `Origin`/`Referer` ou usar `Sec-Fetch-Site` quando aplicável.
- **Input do usuário em prompts de IA**: sempre sanitizar (ver Fase 04). Nunca concatenar livremente em system prompt.

## Commits

Convenção: **Conventional Commits** em pt-BR.

```
<tipo>(<escopo opcional>): <resumo no imperativo, minúscula>

[corpo opcional]

[rodapé opcional]
```

Tipos: `feat`, `fix`, `refactor`, `docs`, `test`, `chore`, `perf`, `ci`, `build`.

Exemplos:
- `feat(stripe): adicionar idempotência ao webhook`
- `fix(auth): centralizar extração de bearer token`
- `docs(roadmap): adicionar fase 04 (ia guardrails)`

## Branches

- `main` — sempre deployável.
- `feat/fase-NN-<slug>` — uma branch por fase do roadmap.
- `fix/<descricao>` — hotfixes pequenos.
- Branches efêmeras, deletadas após merge.

## Pull Requests

- **Sempre draft** durante execução do agente.
- Título: mesmo padrão de commit (`feat(escopo): ...`).
- Corpo do PR (ver template em `04-checklist-pr.md`):
  - O que mudou
  - O que não foi feito (e por quê)
  - Como testar localmente
  - Riscos
  - Checklist de DoD da fase
- Sem squash automático: agente pode comitar incrementalmente, mas o merge final é **squash + merge** com mensagem do PR como commit.

## Documentação

- Mudanças em padrão arquitetural → atualizar `docs/01-arquitetura-alvo.md` no mesmo PR.
- Decisão grande → ADR em `docs/adr/NNNN-titulo.md`.
- Mudanças em comandos/setup → atualizar `README.md` e `CLAUDE.md`.
- `docs/` é a fonte da verdade. Se a doc disser uma coisa e o código outra, **a doc estava errada e precisa ser atualizada**, ou o código fugiu do padrão e precisa voltar.

## Antipadrões proibidos

- `// @ts-ignore` sem comentário na linha de cima explicando.
- `// eslint-disable-next-line` sem justificativa.
- `as any` em código novo (existente sai gradualmente na Fase 02).
- Múltiplas implementações da mesma coisa (auth, formatação, fetch). Centralizar.
- Páginas com mais de 300 linhas misturando UI + lógica + queries. Quebrar.
- `useEffect` para fetch quando server component resolve.
- Hardcoded de valores de domínio (preço, prazo de trial). Mover para env ou constantes nomeadas.
