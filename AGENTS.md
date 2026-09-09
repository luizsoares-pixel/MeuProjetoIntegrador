# Menu Digital — Antigravity Agent Configuration (AGENTS.md)

Bem-vindo ao projeto **Menu-Digital** (CEUB ADS - Projeto Integrador II). Este arquivo define as diretrizes de contexto para o **Antigravity CLI** e agentes de IA que atuam neste repositório.

---

## 1. Visão Geral e Arquitetura

O projeto é um **Monorepo** com workspaces configurados no `package.json`:
* **`apps/mobile`**: Aplicativo móvel construído em **Expo SDK 54**, **React Native 0.81**, **React 19**, **Expo Router v6** e **react-native-maps**.
* **`apps/api`**: Backend REST construído em **Express 5**, **TypeScript**, **Prisma ORM 6.19** e **PostgreSQL / Supabase Auth**.
* **`packages/contracts`**: Biblioteca compartilhada de tipagens e validação de schemas construída com **Zod**.

---

## 2. Regras e Diretrizes do Projeto (`.agents/rules/`)

Ao trabalhar em qualquer funcionalidade, consulte as regras contextuais:
* **[expo-mobile.md](.agents/rules/expo-mobile.md)**: Regras de arquitetura de telas, componentes SafeArea, temas e suporte a mapas no Expo.
* **[backend-prisma-supabase.md](.agents/rules/backend-prisma-supabase.md)**: Diretrizes de backend, transação compensatória anti dual-write e segurança de credenciais.
* **[contracts-monorepo.md](.agents/rules/contracts-monorepo.md)**: Desenvolvimento Contract-First com schemas Zod compartilhados.
* **[ceub-academic-guidelines.md](.agents/rules/ceub-academic-guidelines.md)**: Requisitos institucionais CEUB, Definition of Done e formato de sprints.

---

## 3. Skills Agenticas Disponíveis (`.agents/skills/`)

* **`grill-with-docs`**: Entrevista o desenvolvedor para esclarecer regras de negócio antes de implementar, atualizando o dicionário em `CONTEXT.md` e registrando decisões em `docs/adr/`.
* **`verify-monorepo`**: Executa a bateria de verificação completa (build dos contratos, linter estático e testes unitários da API e Mobile).

---

## 4. Subagentes Especializados (`.agents/agents/`)

* **`mobile-engineer`**: Especialista em React Native, Expo Router, Reanimated e componentes de mapas.
* **`backend-architect`**: Especialista em Express 5, modelagem Prisma e fluxos de autenticação Supabase.
* **`qa-auditor`**: Especialista em testes automatizados, validação de contratos e auditoria de segurança.

---

## 5. Dicionário de Domínio e Decisões

* **Domínio Ubíquo**: Consulte sempre [CONTEXT.md](CONTEXT.md) antes de criar novos termos ou entidades.
* **Decisões Arquiteturais**: Registradas cronologicamente na pasta [docs/adr/](docs/adr/).

---

## 6. Comandos de Verificação Rápida

```powershell
# Executar a verificação completa do monorepo
npm run build -w packages/contracts
npm run lint -w apps/api
npm run test -w apps/api
npm run lint -w apps/mobile
```
