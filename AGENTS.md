# Menu Digital — Antigravity Agent Configuration (AGENTS.md)

Bem-vindo ao projeto **Menu-Digital** (CEUB ADS - Projeto Integrador II). Este arquivo define as diretrizes de contexto para o **Antigravity CLI**, Codex, Claude Code e subagentes de IA que atuam neste repositório.

---

## 1. Visão Geral e Arquitetura

O projeto é um **Monorepo** com workspaces configurados no `package.json`:
* **`apps/mobile`**: Aplicativo móvel construído em **Expo SDK ~57**, **React Native 0.86**, **React 19**, **Expo Router ~57** e **react-native-maps**.
* **`apps/api`**: Backend REST construído em **Express 5**, **TypeScript**, **Prisma ORM 6.19** e **PostgreSQL / Supabase Auth**.
* **`packages/contracts`**: Biblioteca compartilhada de tipagens e validação de schemas construída com **Zod**.

---

## 2. Toolchain de IA Integrada (Os 3 Repositórios Oficiais)

Este repositório possui uma infraestrutura de engenharia e agentes orientada por 3 projetos abertos de referência oficial, integrados diretamente na pasta versionada `.agents/skills/`:

### 🚀 1. `obra/superpowers` (https://github.com/obra/superpowers)
* **`subagent-driven-development`**: Execução autônoma de planos através de subagentes especializados, isolamento de contexto e ciclos de revisão por tarefa.
* **`writing-plans`**: Elaboração de planos de implementação atômicos com passos TDD antes de tocar em código.
* **`test-driven-development`**: Ciclo rigoroso de TDD (Red -> Green -> Refactor).
* **`systematic-debugging`**: Investigação metódica de causa raiz proibindo correções precipitadas de sintomas.
* **`verification-before-completion`**: Proibição estrita de alegar sucesso antes de inspecionar logs de comandos reais.
* **`finishing-a-development-branch`**: Checklist de finalização de branch com testes verdes e abertura de Pull Requests.

### 🧠 2. `mattpocock/skills` (https://github.com/mattpocock/skills)
* **`grill-with-docs`**: Entrevista interativa com o desenvolvedor para esclarecer regras de negócio e refinar requisitos.
* **`domain-modeling-matt`**: Construção e refinamento ativo do modelo de domínio ubíquo em `CONTEXT.md` e decisões em `docs/adr/`.
* **`code-review-matt`**: Revisão em dois eixos paralelos (Conformidade com Padrões + Fidelidade à Especificação da Issue).
* **`wayfinder-matt`**: Mapeamento e decomposição de demandas complexas em mapas de decisão sequenciais.

### 🛡️ 3. `affaan-m/ECC` (https://github.com/affaan-m/ECC)
* **`tdd-workflow-ecc`**: Workflow TDD completo exigindo 80%+ de cobertura em unitários, integração e contratos.
* **`security-review-ecc`**: Auditoria defensiva de segredos, validação estrita com Zod e proteção contra dual-write / vazamento de credenciais.
* **`backend-patterns-ecc`**: Padrões em camadas para Express 5 e Prisma ORM (Controller -> Service -> Data Access).
* **`frontend-patterns-ecc`**: Padrões de engenharia para React Native, SafeAreaContext, temas e componentes desacoplados.

### 🎨 4. `nextlevelbuilder/ui-ux-pro-max-skill` (https://github.com/nextlevelbuilder/ui-ux-pro-max-skill)
* **`ui-ux-pro-max`**: Design intelligence com banco de dados pesquisável de 79 estilos UI, 192 paletas de cores, 74 font pairings, 119 diretrizes UX e padrões específicos para `react-native`. Use **antes** de qualquer trabalho visual no `apps/mobile`.

> **Zero Setup Externo**: Todas as skills e regras estão versionadas no Git dentro de `.agents/`. Ao clonar o repositório (`git clone`), todo o fluxo de engenharia e agentes já está imediatamente disponível para qualquer máquina e desenvolvedor.

---

## 3. Regras e Diretrizes do Projeto (`.agents/rules/`)

Ao trabalhar em qualquer funcionalidade, consulte as regras contextuais:
* **[expo-mobile.md](.agents/rules/expo-mobile.md)**: Regras de arquitetura de telas, componentes SafeArea, temas e suporte a mapas no Expo.
* **[backend-prisma-supabase.md](.agents/rules/backend-prisma-supabase.md)**: Diretrizes de backend, transação compensatória anti dual-write e segurança de credenciais.
* **[contracts-monorepo.md](.agents/rules/contracts-monorepo.md)**: Desenvolvimento Contract-First com schemas Zod compartilhados.
* **[ceub-academic-guidelines.md](.agents/rules/ceub-academic-guidelines.md)**: Requisitos institucionais CEUB, Definition of Done e formato de sprints.

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
# Executar a verificação completa do monorepo de forma unificada
npm run verify

# Ou executar individualmente por workspace:
npm run build:contracts
npm run lint:api
npm run test:api
npm run lint:mobile

# Validar a integridade das skills e toolchain de IA:
npm run ai:verify

# Design intelligence (ui-ux-pro-max-skill) — buscar dados de UI/UX:
npm run design:search -- "dark luxury restaurant" --domain style
npm run design:search -- "restaurant food service" --domain color
npm run design:search -- "<query>" --domain ux
npm run design:search -- "<query>" --stack react-native
npm run design:system -- "Menu Digital" -p "Menu Digital"
```
