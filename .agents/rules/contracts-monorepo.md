# Regras de Monorepo e Contratos Compartilhados (Contract-First)

Este documento estabelece as diretrizes para a manutenção do monorepo e dos contratos em `packages/contracts`.

## 1. Princípio Contract-First

- Qualquer nova funcionalidade que envolva tráfego de dados entre `apps/api` e `apps/mobile` deve ter seus tipos e esquemas de validação definidos **primeiro** em `packages/contracts`.
- Não duplicar tipagens TypeScript ou schemas Zod manualmente entre o app mobile e a API backend.

## 2. Estrutura de `packages/contracts`

- Todos os esquemas de validação de payload devem ser construídos com **Zod**.
- Os tipos TypeScript correspondentes devem ser inferidos via `z.infer<typeof Schema>`.
- Exportar esquemas e tipos no `src/index.ts` do pacote.
- Após alterar os contratos, executar a compilação do pacote:
  ```bash
  npm run build -w packages/contracts
  ```

## 3. Consumo no Backend e no Mobile

- No backend (`apps/api`):
  - Validar requisições HTTP (`req.body`, `req.query`, `req.params`) utilizando os schemas importados de `@menu-digital/contracts`.
- No mobile (`apps/mobile`):
  - Integrar os schemas do contrato com `react-hook-form` via `@hookform/resolvers/zod`.
  - Tipar respostas das chamadas da API (`apps/mobile/services/api.ts`).

## 4. Gerenciamento de Dependências do Monorepo

- Não instalar dependências duplicadas com versões conflitantes nos workspaces.
- Manter as versões de bibliotecas compartilhadas alinhadas (ex: `zod`, `typescript`).
- Executar scripts direcionados pelo workspace via `-w` ou `--workspace`:
  - `npm run dev -w apps/api`
  - `npm run start -w apps/mobile`
  - `npm run test -w apps/api`
