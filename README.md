# Gestão Garden

SaaS de gestão para profissionais de jardinagem. Combina gestão operacional (clientes, agenda, ordens de serviço, estoque, financeiro) com **Íris**, assistente de IA que reduz fricção operacional via texto e voz. Web em Next.js (Vercel) + mobile em Expo, backend em Supabase, pagamentos via Stripe e IA via Groq (LLaMA + Whisper).

## Stack

- **Web:** Next.js 16 (App Router) · React 19 · TypeScript 5 · Tailwind v4 · shadcn/ui (Radix)
- **Mobile:** Expo / React Native (`/mobile`)
- **Backend:** Supabase (PostgreSQL com RLS + Auth)
- **Pagamentos:** Stripe (checkout, webhooks, customer portal)
- **IA:** Groq SDK (LLaMA 3.1 8B + Whisper Large v3)
- **Pacotes:** pnpm 10 · Node 20+
- **Deploy:** Vercel

## Estrutura

A documentação técnica detalhada está em:

- [`CLAUDE.md`](./CLAUDE.md) — convenções, estrutura de pastas e padrões para agentes/devs.
- [`docs/`](./docs) — visão técnica, arquitetura-alvo, roadmap e fases de execução.
  - [`docs/00-visao-tecnica.md`](./docs/00-visao-tecnica.md)
  - [`docs/01-arquitetura-alvo.md`](./docs/01-arquitetura-alvo.md)
  - [`docs/02-roadmap.md`](./docs/02-roadmap.md)
  - [`docs/03-padroes-e-convencoes.md`](./docs/03-padroes-e-convencoes.md)
  - [`docs/04-checklist-pr.md`](./docs/04-checklist-pr.md)

## Setup local

Requer **Node 20+** e **pnpm 10+** (`corepack enable` recomendado).

```bash
# 1. Clonar
git clone <url-do-repositorio>
cd <pasta-do-projeto>

# 2. Instalar dependências (instalação reprodutível)
pnpm install --frozen-lockfile

# 3. Configurar variáveis de ambiente
cp .env.example .env.local
# preencher .env.local com as credenciais reais (Supabase, Stripe, Groq, etc.)

# 4. Subir o servidor de desenvolvimento
pnpm dev
# app disponível em http://localhost:3000
```

Para o app mobile (`/mobile`), seguir as instruções específicas no diretório (Expo + EAS).

## Scripts

| Comando      | Descrição                                                 |
| ------------ | --------------------------------------------------------- |
| `pnpm dev`   | Sobe o Next em modo dev (`--hostname 0.0.0.0 --webpack`). |
| `pnpm build` | Build de produção (`next build`).                         |
| `pnpm start` | Sobe o build de produção (`next start`).                  |
| `pnpm lint`  | Roda ESLint em todo o projeto.                            |

## Como contribuir

1. Toda fase do roadmap roda em uma branch `feat/fase-NN-<slug>` e abre um PR draft.
2. Padrões obrigatórios de código, naming, commits e PRs em [`docs/03-padroes-e-convencoes.md`](./docs/03-padroes-e-convencoes.md).
3. Definition of Done de cada PR e template do corpo em [`docs/04-checklist-pr.md`](./docs/04-checklist-pr.md).
4. Commits seguem **Conventional Commits** em pt-BR (ex.: `feat(stripe): adicionar idempotência ao webhook`).

Antes de abrir o PR, garanta que `pnpm lint && pnpm build` passem localmente.
