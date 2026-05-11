# Fase 08 — Performance e Escala

## Contexto

Após as fases anteriores, o produto está seguro, tipado, testado e observável. Agora precisamos torná-lo rápido e capaz de escalar:

- Páginas do dashboard fazem 6–8 queries Supabase em série, sem cache.
- Sem paginação em listas longas (clientes, transações).
- `images.unoptimized: true` desliga otimização do Next/Image.
- Sem CDN/cache para conteúdo público (landing).
- Sem análise de bundle.
- Queries não cacheadas, mesmo que dados sejam quase imutáveis (categorias, planos).

## Objetivo

Reduzir TTFB e latência percebida. Permitir contas com volume realista de dados (10k+ transações) sem degradação. Identificar gargalos com dados, não com adivinhação.

## Escopo

### Entra

- Paginação real em listas grandes (clientes, transações, agendamentos, ordens de serviço).
- `images.unoptimized: false` + revisão de uso de `<Image>`.
- Cache de queries imutáveis com `unstable_cache` ou Upstash.
- Análise de bundle (`@next/bundle-analyzer`) e poda de imports pesados.
- Skeletons / loading states para queries lentas.
- React Compiler ativado se Next 16 suportar.
- Query optimization: `select` específico em vez de `*` em queries quentes.
- Lighthouse audit: meta de >90 em performance e accessibility.

### Não entra

- Migração para edge runtime.
- Service workers / PWA.
- Materialized views no Supabase.
- ISR para conteúdo dinâmico.

## Prompt para o agente executor

````markdown
Você está executando a **Fase 08 — Performance e Escala** do Gestão Garden.

**Pré-requisitos:** Fases 02, 03 mergeadas (página finance e dashboard refatoradas, índices criados).

**Branch:** `feat/fase-08-performance-escala`.

**Tarefas:**

### 1. Baseline de performance

Antes de mexer:

- Rodar Lighthouse em landing, dashboard, finance, clients. Anotar scores e métricas (LCP, INP, CLS).
- Anotar tempo de resposta de queries pesadas (use Supabase Studio > SQL > EXPLAIN ANALYZE).
- Rodar `npx @next/bundle-analyzer` ou similar e anotar tamanho dos bundles.

Documentar baseline em `docs/perf-baseline.md` (PR atualiza com after).

### 2. Paginação em listas

Para `clients`, `transactions`, `appointments`, `work_orders`:

- Adotar paginação por cursor (`created_at` + `id` como tiebreaker) em rotas server.
- Componente `<ListaPaginada>` reutilizável em `components/shared/`.
- URL: `?cursor=<base64>&limit=20`.
- Default 20 por página; máximo 100.

Refatorar páginas afetadas:

- `app/dashboard/clients/page.tsx`: pager.
- `app/dashboard/finance/page.tsx`: tabela de transações com pager.
- Etc.

Validar com dataset de teste (script `scripts/seed-volume.ts` que cria 10k registros).

### 3. Otimização de imagens

- Mudar `next.config.mjs`: `images.unoptimized: false`.
- Configurar `images.remotePatterns` para domínios usados (Supabase storage).
- Substituir `<img>` remanescentes por `<Image>` com `width`, `height`, `priority` em LCP.
- Conferir que landing carrega imagens corretamente em prod.

### 4. Cache de dados imutáveis

`lib/cache.ts`:

```ts
import { unstable_cache } from "next/cache";

export const obterCategoriasCache = unstable_cache(
  async (gardenerId: string) => {
    const supabase = createServerOnlyClient();
    const { data } = await supabase.from("categories").select("*").eq("gardener_id", gardenerId);
    return data ?? [];
  },
  ["categorias"],
  { revalidate: 300, tags: ["categorias"] },
);
```
````

Aplicar para: categorias, planos de manutenção, dados de profile não-críticos.

Invalidar com `revalidateTag` em mutations.

### 5. Queries com `select` específico

Auditar `lib/domain/**/queries.ts` e remover `select("*")` em queries que retornam para listagens. Exemplo:

```ts
// Antes
.from("clients").select("*")
// Depois
.from("clients").select("id, name, phone, address, last_appointment_at")
```

Reduz payload e melhora cache.

### 6. Skeletons e loading

Adicionar `loading.tsx` em rotas de dashboard usando Suspense skeletons:

```tsx
// app/dashboard/clients/loading.tsx
export default function Carregando() {
  return <ClientesSkeletonGrid />;
}
```

Server components com `<Suspense>` em volta de queries lentas.

### 7. Bundle analysis

```
pnpm add -D @next/bundle-analyzer
```

`next.config.mjs`:

```js
import bundleAnalyzer from "@next/bundle-analyzer";
const withBundleAnalyzer = bundleAnalyzer({ enabled: process.env.ANALYZE === "true" });
export default withBundleAnalyzer(withSentryConfig(nextConfig));
```

Rodar `ANALYZE=true pnpm build`. Analisar:

- Bundles > 200kb gzipped: investigar.
- Importes pesados (lodash inteiro? Recharts? Date-fns inteiro?). Substituir por imports parciais ou alternativas leves.
- Recharts é pesado: considerar `react-chartjs-2` ou `visx` se houver oportunidade. Não obrigatório nesta fase.

### 8. Lighthouse meta

Após otimizações, rodar Lighthouse novamente. Meta:

- Performance: >90 em landing e dashboard principal.
- Accessibility: >90 em todas.
- Best Practices: >95.
- SEO: >90 em landing.

Se não atingir, documentar gaps no PR.

### 9. Verificações finais

- `pnpm test`, `pnpm test:e2e`, `pnpm build` passam.
- Paginação testada com 10k registros.
- Lighthouse scores anotados antes/depois em `docs/perf-baseline.md`.

**Entrega:**

- PR draft.
- Título: `perf(escala): paginação, otimização de imagens, cache e bundle analysis`.

**Definition of Done:**

- [ ] Listas grandes com paginação por cursor.
- [ ] `images.unoptimized` removido, `<Image>` usado consistentemente.
- [ ] Cache aplicado em dados imutáveis.
- [ ] `select("*")` removido de queries quentes.
- [ ] Skeletons em rotas pesadas.
- [ ] Bundle analyzer configurado.
- [ ] Lighthouse antes/depois documentado.
- [ ] Datset de seed para 10k registros.

```

## Definition of Done

- [ ] Paginação real.
- [ ] Imagens otimizadas.
- [ ] Cache aplicado.
- [ ] Bundle analisado.
- [ ] Lighthouse documentado.

## Riscos

- **Paginação por cursor é mais complexa que offset.** Para dashboards de admin com totais, pode ser preciso combinar (offset + cursor). Decidir caso a caso.
- **Cache mal invalidado** mostra dados velhos. Tags consistentes e teste manual ao mutar.
- **Lighthouse varia por máquina.** Rodar 3x e usar mediana.
```
