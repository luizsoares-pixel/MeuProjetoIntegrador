# Issue #51 - Busca por Nome, Culinária e Cidade (HU6) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implementar busca textual insensível a acentos (extensão `unaccent`) e filtros por culinária e cidade no endpoint `GET /restaurants`, integrando ao frontend mobile com campo de busca com debounce (400ms), chips rápidos de culinária e tela vazia específica.

**Architecture:** Abordagem contract-first com Zod em `packages/contracts`, busca em PostgreSQL com `unaccent()` e `ILIKE` com fallback gracioso no Prisma em `apps/api`, hook com debounce temporal em `apps/mobile` e componentes modulares de busca e filtros.

**Tech Stack:** Express 5, TypeScript, Prisma ORM 6, PostgreSQL (`unaccent`), Zod, React Native 0.81, Expo SDK 54, Expo Router v6.

**Spec:** `docs/superpowers/specs/2026-09-16-issue-51-restaurant-search-design.md`

## Global Constraints
- Branch: `feature/51-busca-nome-culinaria-cidade`
- Regras de Contribuição: `CONTRIBUTING.md`
- Lint e TypeScript estritos em todos os workspaces (`npm run verify`)
- Sem dependências externas não homologadas no monorepo

---

### Task 1: Contratos Compartilhados (Schemas e Tipos de Busca)

**Files:**
- Modify: `packages/contracts/src/index.ts`
- Modify: `packages/contracts/src/__tests__/restaurant.test.ts`

**Interfaces:**
- Produces: `ListRestaurantsQuery` atualizado com `search?: string`, `cuisine?: string`, `city?: string`

- [ ] **Step 1: Escrever testes unitários em contracts para os novos parâmetros de busca**
- [ ] **Step 2: Executar testes e validar falha inicial (TDD)**
- [ ] **Step 3: Implementar `search`, `cuisine` e `city` em `listRestaurantsQuerySchema` no `packages/contracts/src/index.ts`**
- [ ] **Step 4: Compilar contratos com `npm run build:contracts` e validar testes**
- [ ] **Step 5: Commit: `feat(contracts): add search, cuisine and city filters to list schema`**

---

### Task 2: Extensão `unaccent` no PostgreSQL

**Files:**
- Create: `apps/api/prisma/migrations/20260916180000_enable_unaccent_extension/migration.sql`

**Interfaces:**
- Produces: Extensão `unaccent` disponível no PostgreSQL

- [ ] **Step 1: Criar arquivo de migration SQL com `CREATE EXTENSION IF NOT EXISTS unaccent;`**
- [ ] **Step 2: Commit: `feat(api): add migration to enable postgres unaccent extension`**

---

### Task 3: Backend API - Busca Textual e Filtros no Service

**Files:**
- Modify: `apps/api/src/services/restaurant.service.ts`
- Modify: `apps/api/src/__tests__/restaurant.test.ts`

**Interfaces:**
- Consumes: `ListRestaurantsQuery` com `search`, `cuisine`, `city`
- Produces: `restaurantService.list` com filtragem case-insensitive e unaccent

- [ ] **Step 1: Escrever testes unitários para busca por nome, culinária, cidade e combinações em `apps/api/src/__tests__/restaurant.test.ts`**
- [ ] **Step 2: Executar testes e validar falha**
- [ ] **Step 3: Implementar lógica de busca unaccent e filtros parciais em `restaurant.service.ts`**
- [ ] **Step 4: Executar testes unitários da API e validar aprovação**
- [ ] **Step 5: Executar linter da API `npm run lint:api`**
- [ ] **Step 6: Commit: `feat(api): implement unaccent search and cuisine and city filters`**

---

### Task 4: Serviço HTTP no Mobile (`services/api.ts`)

**Files:**
- Modify: `apps/mobile/services/api.ts`

**Interfaces:**
- Consumes: `FetchRestaurantsParams` atualizado
- Produces: `fetchRestaurants` repassando `search`, `cuisine` e `city` na query string

- [ ] **Step 1: Adicionar `search`, `cuisine`, `city` em `FetchRestaurantsParams` e anexar à URL**
- [ ] **Step 2: Commit: `feat(mobile): add search and filter params to fetchRestaurants`**

---

### Task 5: Componentes de Busca Mobile (`SearchBar`, `CuisineFilterChips`, `SearchEmptyState`)

**Files:**
- Create: `apps/mobile/components/SearchBar.tsx`
- Create: `apps/mobile/components/CuisineFilterChips.tsx`
- Create: `apps/mobile/components/SearchEmptyState.tsx`

**Interfaces:**
- Produces: Componentes de UI reutilizáveis seguindo tokens em `apps/mobile/theme/`

- [ ] **Step 1: Criar `SearchBar.tsx` com input, ícone de busca e botão de limpar**
- [ ] **Step 2: Criar `CuisineFilterChips.tsx` com rolagem horizontal de categorias rápidas**
- [ ] **Step 3: Criar `SearchEmptyState.tsx` com feedback específico para busca sem resultados**
- [ ] **Step 4: Commit: `feat(mobile): create search bar, cuisine filter chips and search empty state components`**

---

### Task 6: Hook `useRestaurantList` com Suporte a Filtros e Debounce

**Files:**
- Modify: `apps/mobile/hooks/useRestaurantList.ts`

**Interfaces:**
- Consumes: `UseRestaurantListOptions` com `search`, `cuisine`, `city`
- Produces: Hook reativo com debounce de 400ms para `search` e reset de página

- [ ] **Step 1: Atualizar `useRestaurantList` para receber filtros e gerenciar debounce**
- [ ] **Step 2: Commit: `feat(mobile): add reactive filters and search debounce to useRestaurantList`**

---

### Task 7: Integração na Tela `home.tsx` e Aba `buscar.tsx`

**Files:**
- Modify: `apps/mobile/app/(tabs)/home.tsx`
- Modify: `apps/mobile/app/(tabs)/buscar.tsx`

**Interfaces:**
- Produces: Tela Home com busca integrada e aba Buscar ativa

- [ ] **Step 1: Integrar `SearchBar` e `CuisineFilterChips` no topo do feed da `home.tsx`**
- [ ] **Step 2: Configurar `buscar.tsx` com a mesma experiência aprofundada de busca**
- [ ] **Step 3: Verificar linter do mobile com `npm run lint:mobile`**
- [ ] **Step 4: Commit: `feat(mobile): integrate search and filters into home tab and search tab`**

---

### Task 8: Verificação Geral e Fechamento

**Files:**
- All touched files

- [ ] **Step 1: Executar `npm run verify` unificado**
- [ ] **Step 2: Atualizar documentação de tarefas**
- [ ] **Step 3: Apresentar resumo de validação e evidências para o usuário**
