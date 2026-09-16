# Design Spec: Issue #50 - Endpoint de Listagem de Restaurantes + Tela Inicial (Home) HU5

- **Autor**: Equipe Menu Digital / Antigravity Agent
- **Data**: 2026-09-16
- **Branch**: `feature/50-listagem-restaurantes-home`
- **Issue**: [#50](https://github.com/CAMPUSCEUB/ADS-PI-II-MenuDigital/issues/50)
- **Status**: Aprovado pelo Usuário

---

## 1. Visão Geral e Objetivos

Esta especificação define o design técnico e arquitetural para a **HU5**:
> *"Como usuário, quero ver uma lista de restaurantes ao abrir o app, para descobrir opções sem precisar buscar manualmente."*

A funcionalidade compreende duas partes integradas:
1. **Backend REST (`apps/api`)**: Criação do endpoint público `GET /restaurants?page=&limit=`, retornando restaurantes paginados ordenados pelos mais recentes primeiro (`createdAt: 'desc'`), com suporte a metadados estruturados de paginação e campo de avaliação média (`rating`).
2. **Mobile (`apps/mobile`)**: Reformulação da tela principal `app/(tabs)/home.tsx` para consumir o endpoint, renderizando cards atrativos de restaurantes com foto de capa, nome, culinária, avaliação média e faixa de preço, paginação via scroll infinito, skeleton de carregamento, estados amigáveis de lista vazia e erro de rede com retry, além de pull-to-refresh.

---

## 2. Modelagem de Dados e Contratos

### 2.1 Schema Prisma (`apps/api/prisma/schema.prisma`)
Adição do campo `rating` (Float opcional/nulo) na tabela `restaurants`:

```prisma
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
  rating         Float?            @default(null)
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

### 2.2 Contratos Compartilhados (`packages/contracts`)
1. **Query Params Schema**:
   ```typescript
   export const listRestaurantsQuerySchema = z.object({
     page: z
       .string()
       .optional()
       .transform((v) => (v !== undefined && v.trim() !== "" ? Number(v) : 1))
       .refine((v) => !isNaN(v) && Number.isInteger(v) && v >= 1, {
         message: "O parâmetro 'page' deve ser um número inteiro maior ou igual a 1.",
       }),
     limit: z
       .string()
       .optional()
       .transform((v) => (v !== undefined && v.trim() !== "" ? Number(v) : 10))
       .refine((v) => !isNaN(v) && Number.isInteger(v) && v >= 1 && v <= 50, {
         message: "O parâmetro 'limit' deve ser um número inteiro entre 1 e 50.",
       }),
   });

   export type ListRestaurantsQuery = z.infer<typeof listRestaurantsQuerySchema>;
   ```

2. **Metadados de Paginação e Resposta**:
   ```typescript
   export interface PaginationMeta {
     page: number;
     limit: number;
     total: number;
     totalPages: number;
     hasMore: boolean;
   }

   export interface PaginatedRestaurantsResponse {
     restaurants: RestaurantResponse[];
     pagination: PaginationMeta;
   }
   ```

3. **Atualização em `RestaurantResponse`**:
   Inclusão de `rating?: number | null` na interface de resposta do restaurante.

---

## 3. Arquitetura da API (`apps/api`)

### 3.1 Rota e Middleware
- Rota: `GET /restaurants` associada a `validateQuery(listRestaurantsQuerySchema)`.
- Ordem no arquivo `restaurant.routes.ts`:
  - `GET /nearby`
  - `GET /me`
  - `PUT /me`
  - `GET /` (nova rota pública paginada)
  - `POST /`
  - `GET /:id`

### 3.2 Service Layer (`restaurant.service.ts`)
Método `list(query: ListRestaurantsQuery)`:
- Executa em paralelo `prisma.restaurant.findMany` (com `skip: (page - 1) * limit`, `take: limit`, `orderBy: { createdAt: 'desc' }`, `include: { photos: { orderBy: { order: 'asc' } } }`) e `prisma.restaurant.count()`.
- Calcula:
  - `totalPages = Math.ceil(total / limit) || 1` (caso total seja 0, totalPages é 0).
  - `hasMore = page < totalPages`.
- Retorna `{ restaurants: formattedList, pagination: { page, limit, total, totalPages, hasMore } }`.

---

## 4. Arquitetura Mobile (`apps/mobile`)

### 4.1 Client HTTP (`apps/mobile/services/api.ts`)
Função:
```typescript
export async function fetchRestaurants(
  params?: { page?: number; limit?: number }
): Promise<PaginatedRestaurantsResponse>
```
Com tratamento de fallback de erro legível e montagem de query string via `URL`.

### 4.2 Hook Customizado `useRestaurantList` (`apps/mobile/hooks/useRestaurantList.ts`)
Responsável pelo ciclo de vida dos dados:
- Estado:
  - `restaurants: RestaurantResponse[]`
  - `pagination: PaginationMeta | null`
  - `isLoading: boolean` (carregamento da primeira página)
  - `isLoadingMore: boolean` (carregamento de páginas subsequentes)
  - `isRefreshing: boolean` (pull-to-refresh)
  - `error: string | null`
- Métodos:
  - `loadFirstPage()`: limpa lista, busca página 1.
  - `refresh()`: disparado pelo pull-to-refresh, substitui a lista pela página 1 sem piscar a tela inteira.
  - `loadMore()`: se `!isLoadingMore && !isLoading && pagination?.hasMore`, busca `pagination.page + 1` e anexa à lista existente.
  - `retry()`: limpa erro e tenta carregar novamente a primeira página.

### 4.3 Componentes da Interface (`apps/mobile/components/`)
1. **`RestaurantCard.tsx`**:
   - Foto de capa com fallback elegante (caso `imageUrl` seja nulo).
   - Nome do restaurante em tipografia de destaque.
   - Badge com o tipo de culinária (`cuisineType`).
   - Indicador de avaliação: se houver nota, exibe `★ 4.8` em dourado; se nulo, exibe `Novo`.
   - Faixa de preço: `$`, `$$` ou `$$$` destacado sutilmente.
   - Endereço / bairro resumido.
2. **`RestaurantCardSkeleton.tsx`**:
   - Esqueleto com shimmering / placeholders retangulares idênticos às dimensões do card real para evitar saltos visuais (layout shift).
3. **`RestaurantEmptyState.tsx`**:
   - Ilustração/ícone moderno, mensagem clara de que nenhum restaurante foi cadastrado e botão opcional de recarregar.
4. **`RestaurantErrorState.tsx`**:
   - Ícone de aviso/falha de conexão, mensagem amigável e botão destacado "Tentar novamente".

### 4.4 Tela `app/(tabs)/home.tsx`
- Layout baseado em `FlatList` virtualizada com alta performance.
- `ListHeaderComponent`: cabeçalho de boas-vindas "Encontre seu próximo sabor" e mensagem convidativa.
- `renderItem`: renderiza `RestaurantCard`.
- `ListEmptyComponent`: exibe múltiplos `RestaurantCardSkeleton` se `isLoading`; exibe `RestaurantErrorState` se `error`; exibe `RestaurantEmptyState` se a lista estiver vazia após carregar.
- `ListFooterComponent`: exibe spinner de carregamento sutil se `isLoadingMore`.
- `onEndReached={loadMore}` e `onEndReachedThreshold={0.4}`.
- `refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={refresh} colors={[colors.accent.gold]} tintColor={colors.accent.gold} />}`.

---

## 5. Estratégia de Testes e Validação

1. **Testes de Contratos (`packages/contracts/src/__tests__/restaurant.test.ts`)**:
   - Validação de `listRestaurantsQuerySchema` com parâmetros válidos, inválidos, defaults e transforms numéricos.
2. **Testes da API (`apps/api/src/__tests__/restaurant.test.ts`)**:
   - `GET /restaurants`: paginação correta (`page=1&limit=2`).
   - Verificação de metadados: `total`, `totalPages`, `hasMore`.
   - Ordenação decrescente por `createdAt`.
   - Limite máximo de 50 registros por página.
   - Tratamento de parâmetros inválidos (ex: `page=0`, `limit=100`) retornando 400.
3. **Testes Mobile / Verificação Monorepo**:
   - `npm run verify` executando compilação dos contratos, linter e testes unitários.
