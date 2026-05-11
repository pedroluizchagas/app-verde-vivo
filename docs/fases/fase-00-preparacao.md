# Fase 00 — Preparação e Rebrand para Gestão Garden

## Contexto

O projeto nasceu via v0.app e carrega marcas dessa origem que precisam sair antes de qualquer evolução séria:

- `package.json` chamado `my-v0-project`.
- `README.md` de 2 linhas com badges do v0.
- Coexistência de `package-lock.json` (npm) e `pnpm-lock.yaml` — `vercel.json` usa `--no-frozen-lockfile`.
- Sem `.env.example`.
- Diversos textos de UI ainda como "Verde Vivo".

Esta fase **não muda comportamento** — só prepara o terreno. É curta de propósito, para destravar as próximas.

## Objetivo

Padronizar identidade do projeto como **Gestão Garden**, consolidar gerenciador de pacotes em pnpm, criar onboarding mínimo (`.env.example` + README real), e garantir que `pnpm install && pnpm build` funcione em uma máquina limpa.

## Escopo

### Entra

- Renomear `package.json` para `gestao-garden`.
- Trocar referências de UI/textos de "Verde Vivo" para "Gestão Garden" (manter "Íris" como nome do assistente).
- Remover `package-lock.json`. Manter apenas `pnpm-lock.yaml`.
- Atualizar `vercel.json` para `pnpm install --frozen-lockfile`.
- Criar `.env.example` na raiz cobrindo TODAS as envs usadas no código.
- Reescrever `README.md` com: o que é, stack, setup local, scripts, links para `docs/`.
- Atualizar `CLAUDE.md` no que for impactado pelo rebrand (nome do projeto, comandos).
- Atualizar `mobile/app.json` e bundle id se conveniente (ou registrar pendência).

### Não entra

- Mudanças em lógica de negócio.
- Refatoração de código.
- Correção de bugs (mesmo que vistos durante o rebrand — registrar como issue).
- Mudança de domínio/host de produção.

## Prompt para o agente executor

````markdown
Você está executando a **Fase 00 — Preparação e Rebrand** do projeto Gestão Garden (anteriormente "Verde Vivo"), seguindo o roadmap em `docs/02-roadmap.md` e os padrões em `docs/03-padroes-e-convencoes.md`.

**Contexto:** o projeto nasceu via v0.app. Esta fase faz limpeza e rebrand. NÃO altere lógica de negócio.

**Branch de trabalho:** `feat/fase-00-rebrand-gestao-garden` (criar a partir de main).

**Tarefas:**

1. **Renomear o projeto.**
   - `package.json`: campo `name` → `"gestao-garden"`.
   - Buscar todas as ocorrências de "Verde Vivo", "verde-vivo", "verdevivo", "VerdeVivo" no código (exceto `node_modules`, `.next`, `pnpm-lock.yaml`, `package-lock.json`) e substituir por "Gestão Garden" / "gestao-garden" / "GestaoGarden" conforme o contexto. Use `rg` para mapear antes.
   - Atualizar `app/layout.tsx` (metadata.title, description), `<title>` em qualquer lugar, textos de UI fixos, copy de emails em `supabase/`.
   - Manter o nome **"Íris"** para o assistente de IA — não tocar.
   - Atualizar `mobile/app.json` (`name`, `slug`, `scheme` se houver).

2. **Consolidar package manager em pnpm.**
   - Deletar `package-lock.json` na raiz.
   - Confirmar que `pnpm-lock.yaml` está atualizado: rodar `pnpm install` e commitar diferenças se houver.
   - Atualizar `vercel.json`:
     ```json
     {
       "framework": "nextjs",
       "installCommand": "pnpm install --frozen-lockfile",
       "buildCommand": "pnpm run build"
     }
     ```
   - Adicionar `engines` ao `package.json`:
     ```json
     "engines": { "node": ">=20.0.0", "pnpm": ">=10.0.0" }
     ```
   - Adicionar `packageManager` se ainda não estiver explícito (já está em `pnpm@10.28.2`, manter).

3. **Criar `.env.example` na raiz.** Inspecionar o código (`rg "process.env\."` no projeto) e listar **todas** as variáveis. Modelo:
````

# Supabase

NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_JWT_SECRET=

# Stripe

STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_PRICE_BASIC=
STRIPE_PRICE_PLUS=

# Groq (Íris)

GROQ_API_KEY=
GROQ_MODEL=llama-3.1-8b-instant
GROQ_TRANSCRIBE_MODEL=whisper-large-v3
GROQ_TRANSCRIBE_FORMAT=text

# App

NEXT_PUBLIC_APP_URL=http://localhost:3000

```
Cada bloco com comentário explicando origem da chave. Adicionar quaisquer outras envs encontradas no `rg`.

4. **Reescrever `README.md`** na raiz com seções:
- Título e descrição (1 parágrafo).
- Stack (lista resumida).
- Estrutura (ponteiro para `CLAUDE.md` e `docs/`).
- Setup local (clonar, `pnpm install`, copiar `.env.example` para `.env.local`, `pnpm dev`).
- Scripts (`dev`, `build`, `lint`, `start`).
- Como contribuir (referência a `docs/03-padroes-e-convencoes.md` e `docs/04-checklist-pr.md`).
- Licença (se houver — senão omitir).

5. **Atualizar `CLAUDE.md`** no necessário:
- Nome do projeto: "Gestão Garden".
- Comandos atualizados se mudou algo.
- Não reescrever do zero. Manter o conteúdo existente, apenas corrigir referências.

6. **Verificações finais (obrigatório):**
- `pnpm install --frozen-lockfile` roda do zero (deletar `node_modules` e tentar).
- `pnpm lint` passa.
- `pnpm build` passa (mesmo com warnings de TS — esses serão corrigidos em outra fase, NÃO mexer em `next.config.mjs` aqui).
- `pnpm dev` sobe a app em localhost:3000.
- Buscar "verde vivo" (case-insensitive) e confirmar que sobraram apenas referências históricas justificadas (ex: nome de variável de DB legado, se aplicável — registrar no PR).

**Restrições:**
- NÃO altere `next.config.mjs` (fica para Fase 02).
- NÃO refatore código. Se encontrar bug, abrir issue no GitHub e mencionar no PR — não corrigir agora.
- NÃO toque em migrações SQL existentes em `scripts/`.
- NÃO renomeie tabelas, colunas ou nada no Supabase.

**Entrega:**
- Commits incrementais e descritivos (pt-BR, Conventional Commits).
- PR draft seguindo o template em `docs/04-checklist-pr.md`.
- Título do PR: `chore(rebrand): renomear projeto para Gestão Garden e consolidar pnpm`.

**Definition of Done — copiar para o PR e marcar:**
- [ ] `package.json.name` = `"gestao-garden"`.
- [ ] Nenhuma ocorrência de "Verde Vivo" em UI/textos públicos (exceto se justificado no PR).
- [ ] `package-lock.json` deletado.
- [ ] `vercel.json` usa `--frozen-lockfile`.
- [ ] `.env.example` cobre todas as envs do código.
- [ ] `README.md` reescrito com setup local funcional.
- [ ] `CLAUDE.md` atualizado nos pontos afetados.
- [ ] `pnpm install --frozen-lockfile && pnpm build` funciona em máquina limpa.
- [ ] Mobile (`mobile/app.json`) atualizado ou pendência registrada no PR.
```

## Definition of Done

(mesmo do prompt — replicado para o tech lead validar)

- [ ] `package.json.name` = `"gestao-garden"`.
- [ ] Sem ocorrências de "Verde Vivo" em UI/textos públicos.
- [ ] `package-lock.json` deletado.
- [ ] `vercel.json` usa `pnpm install --frozen-lockfile`.
- [ ] `.env.example` completo.
- [ ] `README.md` reescrito.
- [ ] `CLAUDE.md` atualizado.
- [ ] Build e dev funcionam em máquina limpa.

## Riscos

- **Mobile com bundle id mudado** quebra builds nativos existentes. Se em dúvida, **não mudar bundle id** nesta fase — só nome visível.
- **Templates de email do Supabase** podem ter referências literais a "Verde Vivo" — atualizar.
- **Stripe products/prices** podem ter o nome antigo; atualizar via dashboard Stripe (fora do código), registrar no PR.
