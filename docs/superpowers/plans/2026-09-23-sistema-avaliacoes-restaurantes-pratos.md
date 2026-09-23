# Plan: Sistema de Avaliações para Restaurantes e Pratos (Issue #79)
Date: 2026-09-23
Issue: #79
Branch: feature/79-sistema-avaliacoes-restaurantes-pratos

## Context
O sistema de avaliações deve operar de maneira reutilizável em dois contextos: Restaurante e Prato (MenuItem).
Cada usuário autenticado pode ter no máximo uma avaliação ativa por restaurante e uma por prato. Caso tente avaliar novamente, a interface deve abrir a avaliação existente em modo de edição em vez de tentar duplicar.
As médias e contagens de avaliações devem ser recalculadas de forma atômica via transação Prisma (`$transaction`) no create, update e delete, mantendo performance otimizada sem queries de agregação em tempo real nas listagens.
Além disso, usuários podem denunciar avaliações de terceiros, registrando uma denúncia (`ReviewReport`) para moderação, e anexar até 3 fotos por avaliação através do pipeline seguro de Presigned URLs (ADR 0013).

## Global Constraints
- Rigoroso TDD: Red -> Green -> Refactor.
- Contratos como Single Source of Truth em `packages/contracts`.
- Não quebrar nenhum dos 158 testes existentes da suíte unificada.
- Manter convenção em camadas: Middlewares -> Controllers -> Services -> Data Access (Prisma).
- Presigned URLs diretas para Supabase Storage sem tráfego de imagens em form-data pelo Express.
- Área mínima de toque de 44x44pt (WCAG 2.5.8) em ações interativas de avaliação e denúncia.

---

## Tasks

### Task 1: Modelação de Dados e Migração (Prisma ORM 6.19)
**Files to modify:**
- `apps/api/prisma/schema.prisma` — Adicionar `ReviewReport`, adicionar `reviews_count` em `Restaurant`, relacionamentos em `User` e `Review`.
- `apps/api/prisma/migrations/20260923130000_add_review_reports_and_restaurant_reviews_count/migration.sql` — Criar migration SQL idempotente.

**Implementation:**
- Definir `model ReviewReport`:
  - `id String @id @default(uuid()) @db.Uuid`
  - `reviewId String @map("review_id") @db.Uuid`
  - `reporterId String @map("reporter_id") @db.Uuid`
  - `reason String @db.Text`
  - `status String @default("PENDING")`
  - `createdAt DateTime @default(now()) @map("created_at") @db.Timestamptz(6)`
  - Relações com `Review` e `User` (onDelete: Cascade).
- Adicionar `reviewsCount Int @default(0) @map("reviews_count")` no modelo `Restaurant`.
- Executar `npx prisma generate` em `apps/api`.

**Verification:**
```powershell
npm run -w apps/api build
```

---

### Task 2: Contratos Zod em `packages/contracts`
**Files to modify:**
- `packages/contracts/src/index.ts` — Expandir schemas e types de reviews e denúncias.
- `packages/contracts/src/__tests__/review-favorite.test.ts` — Testes de validação dos novos schemas.

**Implementation:**
- `createReviewSchema`: suportar `restaurantId` e `menuItemId` opcionais, `rating` (1..5 inteiro), `comment` (max 1000), `photoUrls` (max 3 urls).
- `updateReviewSchema`: `rating` (1..5 opcional), `comment` (opcional/nullable), `photoUrls` (opcional, max 3).
- `reportReviewSchema`: `reason` (min 3, max 500).
- `getMyReviewQuerySchema`: `restaurantId` (uuid opcional) e `menuItemId` (uuid opcional).
- Tipagens inferidas (`CreateReviewInput`, `UpdateReviewInput`, `ReportReviewInput`, `ReviewReportResponse`).
- Atualizar `RestaurantResponse` com `reviewsCount?: number`.

**Tests:**
- Testar validação de `updateReviewSchema` com dados válidos e inválidos.
- Testar validação de `reportReviewSchema` (rejeitar vazia ou < 3 caracteres).
- Testar validação de `getMyReviewQuerySchema`.

**Verification:**
```powershell
npm run test -w packages/contracts
npm run build:contracts
```

---

### Task 3: Backend REST (`apps/api`)
**Files to modify:**
- `apps/api/src/services/review.service.ts` — Implementar `getMyReview`, `createReview`, `updateReview`, `deleteReview`, `reportReview`, `listRestaurantReviews`.
- `apps/api/src/controllers/review.controller.ts` — Novos handlers e tratamento de erros (401, 403, 404, 409).
- `apps/api/src/routes/review.routes.ts` — Rotas `/me`, `/`, `/:id`, `/:id/report`.
- `apps/api/src/routes/restaurant.routes.ts` — Rotas `/:id/reviews`.
- `apps/api/src/__tests__/reviews-favorites.test.ts` — Testes unitários do service e controller.

**Implementation:**
- Recálculo atômico com `prisma.$transaction`:
  - Create: insere review, agrega média e contagem, atualiza `rating` e `reviewsCount` do restaurante ou prato.
  - Update: valida ownership (`userId === actor.id`), atualiza review, recalcula média do restaurante ou prato.
  - Delete: valida ownership, exclui fotos e review, recalcula média e decrementa `reviewsCount`.
- Prevenção de duplicatas: constraint `@@unique` e verificação prévia retornando 409 Conflict.
- Endpoint `GET /reviews/me`: retorna a avaliação ativa do usuário para o restaurante ou prato.
- Endpoint `POST /reviews/:id/report`: cria registro em `review_reports`.

**Tests:**
- Testar recálculo de notas em criação, edição e exclusão.
- Testar disparo de 409 em tentativa de duplicar avaliação.
- Testar assertOwner: 403 ao tentar editar/excluir avaliação de outro usuário.
- Testar registro de denúncia.

**Verification:**
```powershell
npm run test:api
npm run lint:api
```

---

### Task 4: Mobile (`apps/mobile`)
**Files to modify:**
- `apps/mobile/services/review.service.ts` — Funções de API (`fetchMyReview`, `createReview`, `updateReview`, `deleteReview`, `reportReview`, `fetchRestaurantReviews`).
- `apps/mobile/components/ReviewModal.tsx` — Suporte a modo "Edição" (preenchimento de dados existentes, exclusão), feedback de upload e resiliência com KeyboardAvoidingView.
- `apps/mobile/components/ReviewCard.tsx` — Botão de denúncia para avaliações de terceiros (hitSlop 44x44pt) e botão de editar para avaliação própria.
- `apps/mobile/app/restaurante/[id].tsx` — Seção completa de avaliações do restaurante com botão "Avaliar Restaurante" (verificando avaliação prévia para edição) e lista paginada.
- `apps/mobile/app/restaurante/[id]/prato/[dishId].tsx` — Integrar checagem de avaliação prévia para abrir modal em modo edição caso o prato já tenha sido avaliado pelo usuário.

**Verification:**
```powershell
npm run lint:mobile
```

---

### Task 5: Verificação do Monorepo e Finalização da Branch
- Executar `npm run verify` completo.
- Validar se 100% dos testes passam e contador ultrapassou 158.
- Commitar seguindo Conventional Commits (`feat(api,mobile): implementar sistema de avaliacoes e denuncias (#79)`).
- Subir branch e abrir Pull Request com template oficial.
