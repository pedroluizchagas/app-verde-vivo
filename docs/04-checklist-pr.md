# 04 — Checklist de PR (Definition of Done)

Todo PR de fase do roadmap precisa atender este checklist antes do merge. O agente executor preenche o template; o CTO/Tech Lead valida.

## Template do corpo do PR

Copiar este bloco no corpo do PR e preencher:

```markdown
## Fase
Fase NN — <título da fase>

Link: docs/fases/fase-NN-<slug>.md

## Resumo
<2–4 linhas explicando o que mudou em alto nível>

## O que foi feito
- [ ] Item 1 do escopo
- [ ] Item 2 do escopo
- [ ] ...

## O que NÃO foi feito (e por quê)
- Item X: motivo (fora do escopo / descoberto durante execução / virou Fase futura)

## Como testar localmente
1. `pnpm install`
2. `cp .env.example .env.local && preencher`
3. `pnpm dev`
4. Passos específicos de validação manual...

## Riscos
- Risco 1: <descrição> — mitigação: <…>
- Risco 2: …

## Migrações
- [ ] Sem migração / [ ] Migração reversível documentada

## Checklist de Definition of Done
- [ ] `pnpm lint` passa sem warnings
- [ ] `pnpm tsc --noEmit` passa
- [ ] `pnpm build` passa
- [ ] Testes existentes não quebraram
- [ ] Testes novos adicionados (quando aplicável)
- [ ] Sem `any` novo (ou justificado em comentário)
- [ ] Sem `// @ts-ignore` ou `// eslint-disable` sem justificativa
- [ ] `.env.example` atualizado se novas envs surgiram
- [ ] `docs/` atualizado se padrão mudou
- [ ] ADR criado se houve decisão arquitetural relevante
- [ ] DoD específico da fase (copiar de docs/fases/fase-NN-...md) atendido
```

## Validação do Tech Lead

Antes de aprovar o merge:

1. **Diff dentro do escopo.** O PR não toca arquivos que não pertencem à fase.
2. **DoD da fase.** Cada bullet do `Definition of Done` da fase está coberto pelo diff (não só pelo texto).
3. **Sem regressão.** CI verde. Build local opcional para fases sensíveis.
4. **Segurança.** Em fases que tocam auth, Stripe, IA ou RLS — leitura manual do diff completo das rotas críticas.
5. **Reversibilidade.** Migrações têm `-- DOWN` comentado. Mudanças de env documentadas.
6. **Documentação acompanha o código.** Se a fase introduziu padrão novo, `docs/` reflete.

## Critérios de rejeição automática

PR é rejeitado (volta para draft com comentário) se:

- Build/lint/tsc falha.
- Introduziu `any` novo sem justificativa.
- Tocou arquivos fora do escopo declarado.
- Faltou atualizar `.env.example` quando adicionou env.
- Resumo não menciona algum item do DoD.
- Agente declarou "feito" o que não foi (verificável por leitura do diff).
- Migração SQL sem `-- DOWN` ou sem teste de aplicação local.

## Merge

- **Estratégia:** `Squash and merge`.
- **Mensagem do squash:** título do PR (formato Conventional Commits).
- **Corpo do squash:** seção "Resumo" do PR.
- **Branch deletada** após merge.
- **Tag de fase** opcional: `fase-NN-concluida` em main após merge das fases bloqueadoras.
