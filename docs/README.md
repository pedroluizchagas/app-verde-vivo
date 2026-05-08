# Documentação — Gestão Garden

Documentação técnica e plano de evolução do **Gestão Garden** (anteriormente "Verde Vivo"), SaaS de gestão para profissionais de jardinagem.

> **Origem:** o projeto nasceu via v0.app e está em transição para um padrão profissional de engenharia. Esta pasta consolida visão, arquitetura, roadmap e prompts executáveis para cada fase de evolução.

## Como esta documentação é usada

1. **Leia primeiro:** `00-visao-tecnica.md` → `01-arquitetura-alvo.md` → `02-roadmap.md`.
2. **Antes de codar:** consulte `03-padroes-e-convencoes.md`.
3. **Antes de abrir PR:** valide contra `04-checklist-pr.md`.
4. **Para executar uma fase:** abra o arquivo correspondente em `fases/` e use o **prompt executável** com um agente (Claude Code, Cursor, etc.). Cada fase é autocontida e independente do agente que abriu o PR.
5. **Como CTO/Tech Lead:** revise o resumo entregue ao final de cada fase, valide o `Definition of Done`, comente no PR e faça merge.

## Índice

| # | Arquivo | Conteúdo |
|---|---|---|
| 00 | [`00-visao-tecnica.md`](./00-visao-tecnica.md) | Visão estratégica, princípios, dívida técnica conhecida |
| 01 | [`01-arquitetura-alvo.md`](./01-arquitetura-alvo.md) | Arquitetura-alvo: web, mobile, IA, dados, integrações |
| 02 | [`02-roadmap.md`](./02-roadmap.md) | Roadmap por fases, dependências, critérios de produção |
| 03 | [`03-padroes-e-convencoes.md`](./03-padroes-e-convencoes.md) | Código, commits, branches, naming, segurança |
| 04 | [`04-checklist-pr.md`](./04-checklist-pr.md) | Definition of Done para cada PR |

## Fases de execução

| Fase | Tema | Bloqueia produção? |
|---|---|---|
| [00](./fases/fase-00-preparacao.md) | Preparação e rebrand para Gestão Garden | Não |
| [01](./fases/fase-01-seguranca-critica.md) | Segurança crítica | **Sim** |
| [02](./fases/fase-02-qualidade-codigo.md) | Qualidade de código e tipagem | Não |
| [03](./fases/fase-03-pagamentos-dados.md) | Pagamentos robustos e modelo de dados | **Sim** |
| [04](./fases/fase-04-ia-iris.md) | IA (Íris): guardrails e confirmação | Parcial |
| [05](./fases/fase-05-testes.md) | Testes automatizados | Não |
| [06](./fases/fase-06-observabilidade.md) | Observabilidade e operação | Não |
| [07](./fases/fase-07-mobile-cicd.md) | Mobile alinhado e CI/CD | Não |
| [08](./fases/fase-08-performance-escala.md) | Performance e escala | Não |

## Convenção dos prompts executáveis

Cada arquivo de fase tem três blocos:

- **Contexto e objetivo** — o que está sendo resolvido e por quê.
- **Escopo** — o que entra e o que **não** entra.
- **Prompt para o agente executor** — bloco autocontido em `markdown` que o agente recebe como instrução. Pode ser copiado e colado.
- **Definition of Done** — critérios objetivos. Sem isso, o PR não faz merge.

## Branching

Cada fase abre **uma branch própria** a partir de `main`:

```
feat/fase-00-rebrand-gestao-garden
feat/fase-01-seguranca-critica
feat/fase-02-qualidade-codigo
...
```

PRs sempre **draft** até o agente executor terminar e o resumo ser entregue ao CTO/Tech Lead para revisão.
