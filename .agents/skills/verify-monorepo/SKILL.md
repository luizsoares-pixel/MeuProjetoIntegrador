---
name: verify-monorepo
description: Executa a verificação completa do monorepo Menu-Digital (compilação dos contratos, checagem de tipos na API e no Mobile e execução dos testes unitários).
---

# Skill: Verify Monorepo (Qualidade & CI Local)

Esta skill executa a bateria completa de validação em todos os pacotes do monorepo, garantindo que nenhuma alteração quebre contratos, tipos ou testes existentes.

## Quando Utilizar

- Sempre antes de finalizar uma tarefa ou criar um Pull Request.
- Após alterar schemas em `packages/contracts`.
- Após adicionar novas migrações ou rotas em `apps/api`.
- Após criar novas telas ou componentes em `apps/mobile`.

## Passos de Execução

Execute em sequência os seguintes comandos a partir da raiz do monorepo:

### 1. Compilar Contratos Compartilhados
```powershell
npm run build -w packages/contracts
```
*Garante que os tipos gerados e exportados pelo Zod estejam atualizados para os outros workspaces.*

### 2. Validar Tipos e Linter da API
```powershell
npm run lint -w apps/api
```
*Executa `tsc --noEmit` para garantir conformidade de tipagem estrita com TypeScript.*

### 3. Rodar Testes Automatizados da API
```powershell
npm run test -w apps/api
```
*Executa a suíte de testes com `tsx --test src/__tests__/**/*.test.ts`.*

### 4. Validar Tipos e Linter do App Mobile
```powershell
npm run lint -w apps/mobile
```
*Executa `expo lint` para garantir conformidade com o ecossistema Expo e React Native.*

## Critério de Sucesso

Todos os 4 passos devem sair com código 0 (sem erros). Se qualquer etapa falhar, o agente deve diagnosticar a causa raiz e corrigir o código antes de reportar conclusão ao usuário.
