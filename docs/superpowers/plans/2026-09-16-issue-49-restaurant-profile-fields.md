# Ampliar Campos do Cadastro de Restaurante (Issue #49) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Estender o model `Restaurant` no Prisma, os contratos compartilhados Zod e a API Express, implementando a tela de edição de perfil no aplicativo móvel com todos os novos campos requeridos pela Issue #49.

**Architecture:** Abordagem Contract-First: primeiro definimos os schemas e tipos Zod em `packages/contracts`, depois estendemos o schema Prisma e criamos a migration na `apps/api`, implementamos endpoints autenticados (`GET /restaurants/me`, `PUT /restaurants/me`) com autorização por proprietário, e por fim construímos a tela completa de edição e atualização no `apps/mobile`.

**Tech Stack:** TypeScript, Zod, Prisma ORM, Express 5, PostgreSQL (Supabase), Expo SDK 54, React Native 0.81, React Hook Form.

**Spec:** `docs/superpowers/specs/2026-09-16-issue-49-restaurant-profile-fields-design.md`

## Global Constraints

- Monorepo npm workspaces: `packages/contracts`, `apps/api`, `apps/mobile`.
- Sem bibliotecas externas pesadas adicionais além das já presentes no repositório.
- Nomenclatura de branch e commits estritamente vinculados à Issue #49 (`feature/49-restaurant-profile-fields`).
- Apenas `owner` do restaurante pode editar seus dados de perfil (`PUT /restaurants/me`).
- Preservar compatibilidade com registros existentes mantendo `address` e campos adicionais opcionais no cadastro básico.

---

### Task 1: Contratos Compartilhados Zod (`packages/contracts`)

**Files:**
- Modify: `packages/contracts/src/index.ts`
- Create: `packages/contracts/src/__tests__/restaurant.test.ts`
- Modify: `packages/contracts/package.json` (adicionar script test caso necessário)

**Interfaces:**
- Produces:
  - `priceRangeEnum`, `PriceRange` (`"$"` | `"$$"` | `"$$$"`)
  - `paymentMethodEnum`, `PaymentMethod` (`"PIX"` | `"CREDIT_CARD"` | `"DEBIT_CARD"` | `"CASH"` | `"MEAL_VOUCHER"`)
  - `businessHoursSchema`, `BusinessHours`
  - `socialLinksSchema`, `SocialLinks`
  - `restaurantPhotoSchema`, `RestaurantPhotoResponse`
  - `updateRestaurantProfileSchema`, `UpdateRestaurantProfileInput`
  - Extended `createRestaurantSchema`, `registerRestaurantSchema`, `RestaurantResponse`

- [ ] **Step 1: Write test for new contracts schemas**

Criar `packages/contracts/src/__tests__/restaurant.test.ts` validando os novos schemas de faixa de preço, formas de pagamento, horários de funcionamento e edição de perfil.

```typescript
import {
  businessHoursSchema,
  paymentMethodEnum,
  priceRangeEnum,
  updateRestaurantProfileSchema,
} from "../index";

describe("Restaurant Contracts Schema", () => {
  it("should validate priceRangeEnum correctly", () => {
    expect(priceRangeEnum.parse("$")).toBe("$");
    expect(priceRangeEnum.parse("$$")).toBe("$$");
    expect(priceRangeEnum.parse("$$$")).toBe("$$$");
    expect(() => priceRangeEnum.parse("$$$$")).toThrow();
  });

  it("should validate paymentMethodEnum correctly", () => {
    expect(paymentMethodEnum.parse("PIX")).toBe("PIX");
    expect(paymentMethodEnum.parse("CREDIT_CARD")).toBe("CREDIT_CARD");
    expect(() => paymentMethodEnum.parse("BITCOIN")).toThrow();
  });

  it("should validate businessHoursSchema correctly", () => {
    const validHours = {
      monday: [
        { open: "11:30", close: "15:00" },
        { open: "18:00", close: "23:00" },
      ],
      sunday: [{ open: "12:00", close: "17:00" }],
    };
    expect(businessHoursSchema.parse(validHours)).toEqual(validHours);
  });

  it("should reject invalid business hours time format", () => {
    const invalidHours = {
      monday: [{ open: "25:00", close: "15:00" }],
    };
    expect(() => businessHoursSchema.parse(invalidHours)).toThrow();
  });

  it("should validate updateRestaurantProfileSchema with partial data", () => {
    const updateData = {
      description: "Restaurante aconchegante com opções vegetarianas.",
      priceRange: "$$" as const,
      paymentMethods: ["PIX" as const, "CREDIT_CARD" as const],
      postalCode: "70000-000",
      city: "Brasília",
      state: "DF",
    };
    expect(updateRestaurantProfileSchema.parse(updateData)).toMatchObject(updateData);
  });
});
```

- [ ] **Step 2: Run test to verify it fails before implementation**

Run: `npx jest packages/contracts/src/__tests__/restaurant.test.ts` (ou execute via ts-node/tsx)
Expected: FAIL com símbolos não exportados.

- [ ] **Step 3: Implement new schemas and exports in `packages/contracts/src/index.ts`**

Adicionar enums, schemas de `timeShiftSchema`, `businessHoursSchema`, `socialLinksSchema`, `updateRestaurantProfileSchema` e atualizar `RestaurantResponse` e `createRestaurantSchema`.

- [ ] **Step 4: Build contracts and run tests**

Run: `npm run build -w packages/contracts`
Run: `npx jest packages/contracts/src/__tests__/restaurant.test.ts` (ou compilação tsc)
Expected: PASS sem erros.

- [ ] **Step 5: Commit changes**

```bash
git add packages/contracts/
git commit -m "feat(contracts): add restaurant profile schemas and types for issue #49"
```

---

### Task 2: Modelagem Prisma e Migration (`apps/api`)

**Files:**
- Modify: `apps/api/prisma/schema.prisma`
- Create: `apps/api/prisma/migrations/20260916000005_expand_restaurant_fields/migration.sql`

**Interfaces:**
- Consumes: Enums e campos definidos na especificação da Issue #49
- Produces: Prisma Client atualizado com `PriceRange`, `PaymentMethod`, `RestaurantPhoto` e novas propriedades em `Restaurant`.

- [ ] **Step 1: Update `apps/api/prisma/schema.prisma`**

Adicionar enums `PriceRange` e `PaymentMethod`, tabela `RestaurantPhoto` e novas colunas (`description`, `priceRange`, `businessHours`, `paymentMethods`, `socialLinks`, `street`, `number`, `complement`, `neighborhood`, `city`, `state`, `postalCode`) no model `Restaurant`.

- [ ] **Step 2: Validate Prisma schema**

Run: `npx prisma validate --schema=apps/api/prisma/schema.prisma`
Expected: "The schema is valid".

- [ ] **Step 3: Generate Prisma Client**

Run: `npm run prisma:generate -w apps/api`
Expected: "Generated Prisma Client" com sucesso.

- [ ] **Step 4: Create migration SQL**

Criar `apps/api/prisma/migrations/20260916000005_expand_restaurant_fields/migration.sql` com DDL idempotente para criar types, tabelas e adicionar colunas.

- [ ] **Step 5: Commit changes**

```bash
git add apps/api/prisma/
git commit -m "feat(api): expand restaurant model with new fields and photos for issue #49"
```

---

### Task 3: Backend Services, Controllers e Rotas (`apps/api`)

**Files:**
- Modify: `apps/api/src/services/restaurant.service.ts`
- Modify: `apps/api/src/controllers/restaurant.controller.ts`
- Modify: `apps/api/src/routes/restaurant.routes.ts`
- Modify: `apps/api/src/__tests__/restaurant.test.ts`

**Interfaces:**
- Produces:
  - `GET /restaurants/me`: recupera o restaurante do usuário logado (com fotos)
  - `PUT /restaurants/me`: atualiza o perfil do restaurante do usuário logado
  - `GET /restaurants/:id`: busca restaurante por ID com dados ricos

- [ ] **Step 1: Write tests for `GET /restaurants/me` and `PUT /restaurants/me`**

Estender `apps/api/src/__tests__/restaurant.test.ts` para testar:
- `GET /restaurants/me` sem autenticação -> 401
- `GET /restaurants/me` com autenticação de dono -> 200 com dados completos e fotos
- `PUT /restaurants/me` atualizando descrição, faixa de preço, formas de pagamento e horários -> 200
- `PUT /restaurants/me` tentando atualizar dados de outro restaurante -> 404 / 403

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -w apps/api`
Expected: FAIL porque as rotas `/me` e métodos no service ainda não existem.

- [ ] **Step 3: Implement `getProfile` and `updateProfile` in `restaurant.service.ts`**

Implementar no serviço a busca pelo `ownerId` incluindo `photos: { orderBy: { order: 'asc' } }` e a atualização atômica de campos estruturados e fotos.

- [ ] **Step 4: Implement controller handlers and routes**

Adicionar métodos em `RestaurantController` e registrar rotas autenticadas em `restaurantRouter`:
```typescript
restaurantRouter.get("/me", authMiddleware, (req, res, next) => restaurantController.getProfile(req, res, next));
restaurantRouter.put("/me", authMiddleware, validateRequest(updateRestaurantProfileSchema), (req, res, next) => restaurantController.updateProfile(req, res, next));
restaurantRouter.get("/:id", (req, res, next) => restaurantController.getById(req, res, next));
```

- [ ] **Step 5: Run tests and verify they pass**

Run: `npm run test -w apps/api`
Run: `npm run lint -w apps/api`
Expected: PASS com 100% de testes bem-sucedidos.

- [ ] **Step 6: Commit changes**

```bash
git add apps/api/src/
git commit -m "feat(api): implement restaurant profile get and update endpoints for issue #49"
```

---

### Task 4: Mobile Client Services (`apps/mobile`)

**Files:**
- Modify: `apps/mobile/services/api.ts`

**Interfaces:**
- Produces:
  - `getRestaurantProfile(token: string): Promise<RestaurantResponse>`
  - `updateRestaurantProfile(data: UpdateRestaurantProfileInput, token: string): Promise<RestaurantResponse>`
  - `getRestaurantById(id: string): Promise<RestaurantResponse>`

- [ ] **Step 1: Implement API service functions in `apps/mobile/services/api.ts`**

Adicionar funções tipadas consumindo os schemas de `@menu-digital/contracts` e os endpoints `GET /restaurants/me`, `PUT /restaurants/me`, `GET /restaurants/:id`.

- [ ] **Step 2: Test API integration / lint**

Run: `npm run lint:api` e checagem de tipos.

- [ ] **Step 3: Commit changes**

```bash
git add apps/mobile/services/api.ts
git commit -m "feat(mobile): add api client functions for restaurant profile management"
```

---

### Task 5: Mobile UI - Ponto de Acesso e Tela de Edição (`apps/mobile`)

**Files:**
- Modify: `apps/mobile/app/(tabs)/perfil.tsx`
- Create: `apps/mobile/app/editar-perfil-restaurante.tsx`

**Interfaces:**
- Consumes: `getRestaurantProfile`, `updateRestaurantProfile`, `updateRestaurantProfileSchema`
- Produces: Nova tela interativa de edição de perfil do restaurante com suporte completo a todos os novos campos da Issue #49.

- [ ] **Step 1: Update `apps/mobile/app/(tabs)/perfil.tsx`**

Adicionar seção ou botão "Meu Restaurante: Editar Perfil" quando o usuário autenticado for dono de restaurante, direcionando para `/editar-perfil-restaurante`.

- [ ] **Step 2: Create `apps/mobile/app/editar-perfil-restaurante.tsx`**

Implementar formulário completo com:
- Header com botão voltar
- Seção Dados Básicos: Nome, CNPJ, Telefone, Culinária, Descrição com contador de caracteres (máx 500)
- Seção Faixa de Preço: Seletor de botões (`$`, `$$`, `$$$`)
- Seção Formas de Pagamento: Chips interativos (PIX, Cartão de Crédito, Cartão de Débito, Dinheiro, Vale Refeição)
- Seção Horários de Funcionamento: Configuração por dia da semana (abertura/fechamento com suporte a múltiplos turnos)
- Seção Endereço Estruturado: CEP, Rua, Número, Bairro, Cidade, Estado (UF) + botão de obter GPS
- Seção Fotos e Links Sociais: Input de URLs de fotos com lista/remoção e campos para Instagram/Facebook/Site
- Botão "Salvar Alterações" com loading e feedback com `CustomModal`.

- [ ] **Step 3: Test and format mobile code**

Garantir respeito às diretrizes de `expo-mobile.md` (`useSafeAreaInsets`, tema padronizado `theme/`, `StyleSheet.create`).

- [ ] **Step 4: Commit changes**

```bash
git add apps/mobile/app/(tabs)/perfil.tsx apps/mobile/app/editar-perfil-restaurante.tsx
git commit -m "feat(mobile): implement restaurant profile edit screen for issue #49"
```

---

### Task 6: Verificação Completa do Monorepo e DoD

**Files:**
- All workspace files touched

- [ ] **Step 1: Execute monorepo verification**

Run: `npm run build:contracts`
Run: `npm run lint:api`
Run: `npm run test:api`
Run: `npm run lint:mobile`

- [ ] **Step 2: Confirm all criteria from Issue #49**

Verificar:
- CNPJ (String, único, validado)
- phone (String telefone/WhatsApp)
- description (String com limite)
- priceRange (Enum: $, $$, $$$)
- businessHours (JSON estruturado por dia da semana com múltiplos turnos)
- paymentMethods (array nativo)
- socialLinks (JSON opcional)
- photos (relacionamento 1:N)
- Endereço estruturado (rua, número, bairro, cidade, CEP)
- Edição pelo restaurante na tela mobile
- Validação no frontend e backend.

- [ ] **Step 3: Commit final adjustments and update task artifact**

```bash
git status
git commit -m "chore: finalize verification for issue #49"
```
