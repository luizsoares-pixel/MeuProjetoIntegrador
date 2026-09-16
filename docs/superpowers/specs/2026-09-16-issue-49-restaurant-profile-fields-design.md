# Design Spec: Issue #49 - Ampliar Campos do Cadastro de Restaurante (Extensão da HU4)

- **Autor**: Equipe Menu Digital / Antigravity Agent
- **Data**: 2026-09-16
- **Branch**: `feature/49-restaurant-profile-fields`
- **Issue**: [#49](https://github.com/CAMPUSCEUB/ADS-PI-II-MenuDigital/issues/49)
- **Status**: Aprovado pelo Usuário

---

## 1. Visão Geral e Objetivos

Esta especificação define as mudanças técnicas necessárias para estender o cadastro e o gerenciamento de restaurantes no sistema Menu Digital.
A HU4 cobria apenas o registro básico (nome, endereço em string, tipo de culinária e coordenadas). Esta extensão amplia o modelo de dados para atender aos requisitos das próximas sprints:
- **Sprint #3**: Filtros avançados de busca (por faixa de preço, formas de pagamento aceitas, status de abertura baseado em horário de funcionamento).
- **Sprint #4**: Tela rica de detalhes do restaurante e cardápio digital (com galeria de fotos, horários de múltiplos turnos, links sociais, descrição e endereço completo).

---

## 2. Arquitetura e Modelagem de Dados

### 2.1 Schema Prisma (`apps/api/prisma/schema.prisma`)

```prisma
enum PriceRange {
  CHEAP     @map("$")
  MODERATE  @map("$$")
  EXPENSIVE @map("$$$")
}

enum PaymentMethod {
  PIX
  CREDIT_CARD
  DEBIT_CARD
  CASH
  MEAL_VOUCHER
}

model RestaurantPhoto {
  id           String     @id @default(uuid()) @db.Uuid
  restaurantId String     @map("restaurant_id") @db.Uuid
  url          String
  order        Int        @default(0)
  createdAt    DateTime   @default(now()) @map("created_at") @db.Timestamptz(6)
  restaurant   Restaurant @relation(fields: [restaurantId], references: [id], onDelete: Cascade)

  @@map("restaurant_photos")
}

model Restaurant {
  id             String            @id @default(uuid()) @db.Uuid
  name           String
  address        String
  cuisineType    String?           @map("cuisine_type")
  imageUrl       String?           @map("image_url")
  latitude       Float
  longitude      Float
  ownerId        String?           @map("owner_id") @db.Uuid
  phone          String?
  cnpj           String?           @unique
  description    String?           @db.Text
  priceRange     PriceRange?       @map("price_range")
  businessHours  Json?             @map("business_hours")
  paymentMethods PaymentMethod[]   @default([]) @map("payment_methods")
  socialLinks    Json?             @map("social_links")
  street         String?
  number         String?
  complement     String?
  neighborhood   String?
  city           String?
  state          String?           @db.VarChar(2)
  postalCode     String?           @map("postal_code")
  photos         RestaurantPhoto[]
  owner          User?             @relation(fields: [ownerId], references: [id], onDelete: SetNull)
  createdAt      DateTime          @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt      DateTime          @updatedAt @map("updated_at") @db.Timestamptz(6)

  @@map("restaurants")
}
```

---

## 3. Contratos Compartilhados (`packages/contracts`)

### 3.1 Schemas e Tipagens Zod

```typescript
export const priceRangeEnum = z.enum(["$", "$$", "$$$"]);
export type PriceRange = z.infer<typeof priceRangeEnum>;

export const paymentMethodEnum = z.enum([
  "PIX",
  "CREDIT_CARD",
  "DEBIT_CARD",
  "CASH",
  "MEAL_VOUCHER",
]);
export type PaymentMethod = z.infer<typeof paymentMethodEnum>;

export const timeShiftSchema = z.object({
  open: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Horário deve estar no formato HH:mm"),
  close: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Horário deve estar no formato HH:mm"),
});

export const businessHoursDaySchema = z.array(timeShiftSchema);

export const businessHoursSchema = z.object({
  monday: businessHoursDaySchema.optional(),
  tuesday: businessHoursDaySchema.optional(),
  wednesday: businessHoursDaySchema.optional(),
  thursday: businessHoursDaySchema.optional(),
  friday: businessHoursDaySchema.optional(),
  saturday: businessHoursDaySchema.optional(),
  sunday: businessHoursDaySchema.optional(),
});
export type BusinessHours = z.infer<typeof businessHoursSchema>;

export const socialLinksSchema = z.object({
  instagram: z.string().trim().optional().nullable(),
  facebook: z.string().trim().optional().nullable(),
  website: z.string().trim().url("URL do website inválida").optional().nullable(),
});
export type SocialLinks = z.infer<typeof socialLinksSchema>;

export const restaurantPhotoSchema = z.object({
  id: z.string().uuid().optional(),
  url: z.string().url("URL da foto inválida"),
  order: z.number().int().nonnegative().default(0),
});
export type RestaurantPhotoInput = z.infer<typeof restaurantPhotoSchema>;

export const updateRestaurantProfileSchema = z.object({
  name: z.string().trim().min(2, "Nome deve ter pelo menos 2 caracteres").optional(),
  phone: z.string().trim().regex(/^(?:\+55\s?)?(?:\(?\d{2}\)?\s?)?\d{4,5}[-\s]?\d{4}$/, "Telefone inválido").optional().nullable(),
  cnpj: z.string().trim().regex(/^\d{14}$/, "CNPJ deve conter 14 dígitos numéricos").optional().nullable(),
  description: z.string().trim().max(500, "A descrição não pode exceder 500 caracteres").optional().nullable(),
  cuisineType: z.string().trim().min(2, "Informe a culinária").optional().nullable(),
  priceRange: priceRangeEnum.optional().nullable(),
  businessHours: businessHoursSchema.optional().nullable(),
  paymentMethods: z.array(paymentMethodEnum).optional(),
  socialLinks: socialLinksSchema.optional().nullable(),
  imageUrl: z.string().url("URL de capa inválida").optional().nullable(),
  photos: z.array(z.string().url("URL de foto inválida")).optional(),
  address: z.string().trim().optional(),
  street: z.string().trim().optional().nullable(),
  number: z.string().trim().optional().nullable(),
  complement: z.string().trim().optional().nullable(),
  neighborhood: z.string().trim().optional().nullable(),
  city: z.string().trim().optional().nullable(),
  state: z.string().trim().max(2).optional().nullable(),
  postalCode: z.string().trim().regex(/^\d{5}-?\d{3}$/, "CEP inválido").optional().nullable(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
});
export type UpdateRestaurantProfileInput = z.infer<typeof updateRestaurantProfileSchema>;
```

---

## 4. Backend API (`apps/api`)

### 4.1 Endpoints em `routes/restaurant.routes.ts`

1. **`GET /restaurants/me`**:
   - Middleware: `authMiddleware`
   - Retorna o restaurante pertencente ao usuário logado (`ownerId === req.user.id`), incluindo as fotos ordenadas.
   - Status: 200 OK com `{ restaurant }` ou 404 Not Found se o usuário autenticado ainda não tiver restaurante vinculado.

2. **`PUT /restaurants/me`**:
   - Middleware: `authMiddleware`, `validateRequest(updateRestaurantProfileSchema)`
   - Busca o restaurante onde `ownerId === req.user.id`.
   - Atualiza campos fornecidos.
   - Se `photos` for enviado como array de strings, sincroniza na tabela `RestaurantPhoto`.
   - Status: 200 OK com `{ restaurant }`.

3. **`GET /restaurants/:id`**:
   - Rota pública ou autenticada que retorna detalhes completos do restaurante pelo ID.

---

## 5. Aplicativo Mobile (`apps/mobile`)

1. **Ponto de Entrada**:
   - `apps/mobile/app/(tabs)/perfil.tsx`:
     - Exibe card "Gerenciar Restaurante" quando o usuário logado possui role `restaurant` ou restaurante associado.
     - Botão "Editar Perfil do Restaurante" direciona para `/editar-perfil-restaurante`.

2. **Tela de Edição (`apps/mobile/app/editar-perfil-restaurante.tsx`)**:
   - `useSafeAreaInsets`, scroll vertical com teclado adaptável (`KeyboardAvoidingView`).
   - Carrega dados atuais via `GET /restaurants/me`.
   - Campos organizados em cards temáticos:
     - **Dados Cadastrais**: Nome, CNPJ, Telefone, Culinária, Descrição (com limite e contador até 500 chars).
     - **Preço & Pagamento**: Seletor de Faixa de Preço (`$`, `$$`, `$$$`), chips com multi-seleção de Métodos de Pagamento.
     - **Horários de Funcionamento**: Toggles e campos de turnos para cada dia da semana.
     - **Endereço Completo**: CEP com autopreenchimento, Rua, Número, Bairro, Cidade, UF, e botão de capturar GPS.
     - **Galeria & Redes**: Adição de fotos adicionais por URL com listagem e remoção, além de Instagram/Facebook/Site.
   - Submissão via `PUT /restaurants/me` com feedback via `CustomModal`.

---

## 6. Validação e Qualidade (DoD)

- `npx prisma validate` e `npm run prisma:generate` executados sem erros.
- `npm run build:contracts` compila sem advertências.
- `npm run lint:api` e `npm run test:api` com cobertura dos novos fluxos.
- `npm run lint:mobile` com código limpo.
