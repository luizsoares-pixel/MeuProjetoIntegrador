# Issue #50 - Endpoint de Listagem de Restaurantes + Tela Inicial (Home) HU5 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implementar o endpoint público paginado `GET /restaurants?page=&limit=` na API e construir o feed inicial da tela Home no app móvel com scroll infinito, skeleton loading, estados vazio/erro com retry e pull-to-refresh.

**Architecture:** Abordagem contract-first com Zod em `packages/contracts`, serviço de paginação com `skip`/`take` e ordenação por `createdAt: 'desc'` no Prisma em `apps/api`, hook customizado `useRestaurantList` e componentes desacoplados no design system em `apps/mobile`.

**Tech Stack:** Express 5, TypeScript, Prisma ORM 6, PostgreSQL, Zod, React Native 0.81, Expo SDK 54, Expo Router v6, React Native Reanimated.

**Spec:** `docs/superpowers/specs/2026-09-16-issue-50-restaurant-list-home-design.md`

## Global Constraints
- Branch: `feature/50-listagem-restaurantes-home`
- Regras de Contribuição: `CONTRIBUTING.md`
- Lint e TypeScript estritos em todos os workspaces (`npm run verify`)
- Sem dependências externas não homologadas no monorepo

---

### Task 1: Contratos Compartilhados (Schemas e Tipos)

**Files:**
- Modify: `packages/contracts/src/index.ts`
- Modify: `packages/contracts/src/__tests__/restaurant.test.ts`

**Interfaces:**
- Produces:
  - `listRestaurantsQuerySchema` & `ListRestaurantsQuery`
  - `PaginationMeta`
  - `PaginatedRestaurantsResponse`
  - `RestaurantResponse.rating?: number | null`

- [ ] **Step 1: Escrever testes unitários em contracts para `listRestaurantsQuerySchema`**
- [ ] **Step 2: Executar teste e validar falha**
- [ ] **Step 3: Implementar schemas e tipos em `packages/contracts/src/index.ts`**
- [ ] **Step 4: Compilar contratos com `npm run build:contracts` e rodar testes de contratos**
- [ ] **Step 5: Commit: `feat(contracts): add schemas and types for paginated restaurant listing`**

---

### Task 2: Modelo Prisma e Coluna `rating`

**Files:**
- Modify: `apps/api/prisma/schema.prisma`
- Create: `apps/api/prisma/migrations/20260916170000_add_restaurant_rating/migration.sql`

**Interfaces:**
- Produces: `Restaurant.rating Float?`

- [ ] **Step 1: Adicionar `rating Float? @default(null)` no model `Restaurant` em `apps/api/prisma/schema.prisma`**
- [ ] **Step 2: Criar migration SQL correspondente em `apps/api/prisma/migrations/`**
- [ ] **Step 3: Executar `npx prisma generate` no workspace `apps/api`**
- [ ] **Step 4: Commit: `feat(api): add rating column to restaurant model`**

---

### Task 3: Endpoint `GET /restaurants` (Service, Controller e Rota)

**Files:**
- Modify: `apps/api/src/services/restaurant.service.ts`
- Modify: `apps/api/src/controllers/restaurant.controller.ts`
- Modify: `apps/api/src/routes/restaurant.routes.ts`
- Modify: `apps/api/src/__tests__/restaurant.test.ts`

**Interfaces:**
- Consumes: `listRestaurantsQuerySchema`, `ListRestaurantsQuery`, `PaginatedRestaurantsResponse`
- Produces: `GET /restaurants?page=&limit=`

- [ ] **Step 1: Escrever testes unitários para `GET /restaurants` em `apps/api/src/__tests__/restaurant.test.ts`**
  - Teste 1: Paginação padrão (page 1, limit 10), ordenação por `createdAt` desc
  - Teste 2: Metadados corretos de `total`, `totalPages`, `hasMore`
  - Teste 3: Validação de parâmetros inválidos (ex: `page=0`, `limit=-1`) retornando 400
- [ ] **Step 2: Executar testes da API e confirmar falha**
- [ ] **Step 3: Implementar método `list(query)` em `restaurant.service.ts`**
- [ ] **Step 4: Implementar método `list` em `restaurant.controller.ts`**
- [ ] **Step 5: Adicionar rota pública `GET /` com `validateQuery(listRestaurantsQuerySchema)` em `restaurant.routes.ts`**
- [ ] **Step 6: Executar bateria de testes da API e validar aprovação**
- [ ] **Step 7: Commit: `feat(api): implement paginated get restaurants endpoint`**

---

### Task 4: Serviço HTTP no Mobile (`api.ts`)

**Files:**
- Modify: `apps/mobile/services/api.ts`

**Interfaces:**
- Consumes: `PaginatedRestaurantsResponse`, `RestaurantResponse`
- Produces: `fetchRestaurants(params?: { page?: number; limit?: number }): Promise<PaginatedRestaurantsResponse>`

- [ ] **Step 1: Adicionar tipagens e função `fetchRestaurants` em `apps/mobile/services/api.ts`**
- [ ] **Step 2: Validar compilação e tipagem TypeScript**
- [ ] **Step 3: Commit: `feat(mobile): add fetchRestaurants api service function`**

---

### Task 5: Componentes do Feed (`RestaurantCard`, Skeletons e Estados)

**Files:**
- Create: `apps/mobile/components/RestaurantCard.tsx`
- Create: `apps/mobile/components/RestaurantCardSkeleton.tsx`
- Create: `apps/mobile/components/RestaurantEmptyState.tsx`
- Create: `apps/mobile/components/RestaurantErrorState.tsx`

**Interfaces:**
- Produces: Componentes de UI reutilizáveis seguindo tokens em `apps/mobile/theme/`

- [ ] **Step 1: Criar `RestaurantCard.tsx` com foto, badge culinária, nota (`★ X.X` ou `Novo`), faixa de preço e endereço**
- [ ] **Step 2: Criar `RestaurantCardSkeleton.tsx` com placeholders para loading suave**
- [ ] **Step 3: Criar `RestaurantEmptyState.tsx` com mensagem acolhedora e botão de atualizar**
- [ ] **Step 4: Criar `RestaurantErrorState.tsx` com indicação de falha de conexão e botão "Tentar novamente"**
- [ ] **Step 5: Commit: `feat(mobile): create restaurant card, skeleton, empty and error components`**

---

### Task 6: Hook `useRestaurantList` e Integração na Tela `home.tsx`

**Files:**
- Create: `apps/mobile/hooks/useRestaurantList.ts`
- Modify: `apps/mobile/app/(tabs)/home.tsx`

**Interfaces:**
- Consumes: `fetchRestaurants`, `RestaurantCard`, `RestaurantCardSkeleton`, `RestaurantEmptyState`, `RestaurantErrorState`
- Produces: Tela Home completa atendendo a todos os critérios da HU5

- [ ] **Step 1: Criar o hook `useRestaurantList` com suporte a `loadFirstPage`, `loadMore`, `refresh` e `retry`**
- [ ] **Step 2: Refatorar `apps/mobile/app/(tabs)/home.tsx` com `FlatList`, `RefreshControl`, headers e footer loading**
- [ ] **Step 3: Verificar lint e types do mobile**
- [ ] **Step 4: Commit: `feat(mobile): integrate paginated restaurant feed into home tab`**

---

### Task 7: Verificação Geral e Fechamento

**Files:**
- All touched files

- [ ] **Step 1: Executar bateria unificada `npm run verify`**
- [ ] **Step 2: Executar `npm run lint` em todo o monorepo**
- [ ] **Step 3: Testar cobertura de cenários de aceite (vazio, erro, paginação)**
- [ ] **Step 4: Atualizar artefatos de progresso**
- [ ] **Step 5: Apresentar resumo executivo e instruções para abertura de PR**
