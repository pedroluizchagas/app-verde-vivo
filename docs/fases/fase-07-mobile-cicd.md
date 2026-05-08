# Fase 07 — Mobile Alinhado e CI/CD

## Contexto

- Mobile (`/mobile/`) está separado do web mas compartilha backend.
- Ainda não há CI/CD para mobile (lint, build, teste de smoke).
- Schemas Zod e tipos de domínio estão duplicados ou desalinhados.
- Auth do mobile usa Bearer JWT, ainda precisa garantir compatibilidade após Fase 01.
- Sem fluxo de release (EAS Build) automatizado.

## Objetivo

Alinhar mobile com web (compartilhar tipos e schemas), estabelecer CI próprio, formalizar fluxo de release via EAS.

## Escopo

### Entra
- Pacote interno `lib/shared/` (ou similar) com tipos e schemas Zod consumidos por web e mobile.
- Configuração TS estrita no mobile (sem `any`).
- ESLint próprio para mobile com regras coerentes.
- CI de mobile no GitHub Actions (lint, typecheck, build de smoke).
- EAS Build automatizado em PR para main (preview build) e em tag `v*` (production build).
- Documentação de release mobile.
- Smoke tests com Maestro (3 fluxos críticos: login, criar cliente, abrir assistente).

### Não entra
- App nativo (Swift/Kotlin).
- Refator visual.
- Internacionalização.
- Push notifications (já existe).

## Prompt para o agente executor

```markdown
Você está executando a **Fase 07 — Mobile Alinhado e CI/CD** do Gestão Garden.

**Pré-requisitos:** Fases 01, 02, 05 mergeadas.

**Branch:** `feat/fase-07-mobile-cicd`.

**Tarefas:**

### 1. Compartilhar código entre web e mobile

Decidir entre:
- **Opção A (preferida):** workspace pnpm com pacote `packages/shared/`. Migra raiz para monorepo leve.
- **Opção B (mais simples):** pasta `lib/shared/` na raiz, importada por relative path no mobile (`../lib/shared`). Ajustar `tsconfig` do mobile.

Recomendação: **Opção B** se mobile não tiver dependências conflitantes com web. Caso contrário, A.

Mover para `lib/shared/`:
- `lib/agent/intents/schemas.ts` (depois de Fase 04).
- `lib/domain/clients/types.ts`, `lib/domain/finance/types.ts`, etc.
- Helpers de formatação (moeda, data, telefone) que são reusados.

Web e mobile importam de `@/lib/shared` (web) ou caminho relativo equivalente (mobile).

### 2. Mobile com TS estrito

Editar `mobile/tsconfig.json`:
```json
{
  "compilerOptions": {
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "skipLibCheck": true
  }
}
```

Rodar `pnpm --filter mobile tsc --noEmit` (ou no diretório mobile diretamente). Corrigir tudo. Eliminar `any`.

### 3. ESLint mobile

Mobile já está excluído do ESLint do web. Criar `mobile/eslint.config.mjs` com regras equivalentes:
- `@typescript-eslint/no-explicit-any: error`.
- `react-native/no-unused-styles`, `react-native/no-inline-styles` (instalar `eslint-plugin-react-native`).
- `no-console: warn`.

Adicionar script `mobile/package.json`:
```json
"lint": "eslint .",
"typecheck": "tsc --noEmit"
```

### 4. Auth do mobile alinhada

Conferir que `mobile/src/services/api.ts` (ou equivalente) usa **apenas** `Authorization: Bearer <token>` (sem aliases), conforme Fase 01.

Centralizar criação de cliente HTTP:
```ts
// mobile/src/services/http.ts
const baseUrl = process.env.EXPO_PUBLIC_APP_URL!;
export async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const token = await obterToken();
  const res = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", ...init?.headers },
  });
  if (!res.ok) throw new ApiError(res.status, await res.text());
  return res.json();
}
```

Substituir chamadas dispersas.

### 5. Smoke tests com Maestro

Adicionar `mobile/.maestro/`:

- `login.yaml`:
  ```yaml
  appId: com.iris.jardinagem
  ---
  - launchApp
  - tapOn: "Entrar"
  - inputText: "qa@gestao-garden.test"
  - tapOn: "Senha"
  - inputText: "senha-de-teste"
  - tapOn: "Entrar"
  - assertVisible: "Dashboard"
  ```
- `criar-cliente.yaml`
- `abrir-assistente.yaml`

Documentar como rodar: `maestro test mobile/.maestro/login.yaml` (com app rodando em emulador).

### 6. CI mobile

Adicionar job em `.github/workflows/ci.yml`:

```yaml
mobile:
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v4
    - uses: pnpm/action-setup@v4
      with: { version: 10 }
    - uses: actions/setup-node@v4
      with: { node-version: 20, cache: pnpm }
    - run: pnpm install --frozen-lockfile
    - run: pnpm --filter mobile lint
    - run: pnpm --filter mobile typecheck
    - run: pnpm --filter mobile exec expo prebuild --clean --no-install
      # smoke build, não publica
```

(Smoke tests Maestro precisam de emulador — rodar em workflow separado manual ou nightly.)

### 7. EAS Build em release

Configurar EAS:
- `eas.json` (já existe? completar):
  ```json
  {
    "cli": { "version": ">= 5.0.0" },
    "build": {
      "preview": {
        "distribution": "internal",
        "channel": "preview",
        "ios": { "simulator": false },
        "android": { "buildType": "apk" }
      },
      "production": {
        "channel": "production",
        "autoIncrement": true
      }
    },
    "submit": { "production": {} }
  }
  ```

Workflow `.github/workflows/mobile-release.yml`:
```yaml
on:
  push:
    tags: ["v*"]
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20 }
      - run: npm install -g eas-cli
      - run: cd mobile && eas build --profile production --platform all --non-interactive
        env:
          EXPO_TOKEN: ${{ secrets.EXPO_TOKEN }}
```

Documentar release flow em `docs/release-mobile.md`:
- Bump de versão em `mobile/app.json`.
- Tag `v1.2.3`.
- Push tag → EAS builda automaticamente.
- Submissão manual à store após validação.

### 8. Verificações finais

- `pnpm --filter mobile typecheck && lint` passam.
- Mobile sobe localmente (`expo start`) sem warnings novos.
- CI mobile verde em PR.

**Entrega:**
- PR draft.
- Título: `feat(mobile): tipos compartilhados, CI mobile e fluxo EAS de release`.

**Definition of Done:**
- [ ] `lib/shared/` criada e consumida por web e mobile.
- [ ] Mobile com `strict: true` e zero `any`.
- [ ] ESLint mobile configurado.
- [ ] Auth mobile usando apenas `Authorization: Bearer`.
- [ ] CI mobile rodando lint + typecheck + smoke build.
- [ ] EAS configurado com profiles preview e production.
- [ ] Workflow de release em tag `v*`.
- [ ] `docs/release-mobile.md` criado.
- [ ] 3 fluxos Maestro criados (rodar não é obrigatório no CI).
```

## Definition of Done

- [ ] `lib/shared/` em uso.
- [ ] Mobile estrito.
- [ ] CI mobile.
- [ ] EAS automatizado.
- [ ] Smoke tests existentes.

## Riscos

- **Tipos compartilhados podem importar deps web (Next, Server)** indiretamente. Cuidado para não puxar Server-only para o mobile. Manter `lib/shared/` puro: só tipos, Zod, helpers sem dependências de runtime.
- **Expo prebuild em CI demora.** Cachear `~/.npm` e `~/.gradle`.
- **EAS quota.** Plano gratuito tem limite. Usar com parcimônia, builds production só em tag.
