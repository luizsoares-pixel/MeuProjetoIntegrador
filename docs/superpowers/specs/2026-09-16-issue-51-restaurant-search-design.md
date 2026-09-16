# Design Spec: Issue #51 - Busca por Nome, Culinária e Cidade (HU6)

- **Autor**: Equipe Menu Digital / Antigravity Agent
- **Data**: 2026-09-16
- **Branch**: `feature/51-busca-nome-culinaria-cidade`
- **Issue**: [#51](https://github.com/CAMPUSCEUB/ADS-PI-II-MenuDigital/issues/51)
- **Status**: Aprovado pelo Usuário

---

## 1. Visão Geral e Objetivos

Esta especificação define a arquitetura técnica e o design de interação para a **HU6**:
> *"Como usuário, quero buscar restaurantes por nome, culinária ou cidade, para encontrar rapidamente o que procuro."*

A funcionalidade estende o endpoint `GET /restaurants` implementado na HU5, permitindo buscas dinâmicas e filtros combinados, com suporte a acentuação e variação de caixa alta/baixa, além de uma interface ágil com debounce e feedback visual no aplicativo móvel.

---

## 2. Contratos Compartilhados (`packages/contracts`)

### 2.1 Schema de Consulta (`listRestaurantsQuerySchema`)
Atualização de `listRestaurantsQuerySchema` para aceitar os parâmetros opcionais:
- `search`: termo de busca textual aplicado ao nome do restaurante (`z.string().trim().max(100).optional()`).
- `cuisine`: filtro por tipo de culinária (`z.string().trim().max(50).optional()`).
- `city`: filtro por cidade do restaurante (`z.string().trim().max(100).optional()`).
- Preservação dos parâmetros de paginação `page` (default 1) e `limit` (default 10).

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
  search: z.string().trim().max(100).optional(),
  cuisine: z.string().trim().max(50).optional(),
  city: z.string().trim().max(100).optional(),
});

export type ListRestaurantsQuery = z.infer<typeof listRestaurantsQuerySchema>;
```

---

## 3. Arquitetura da API e Banco de Dados (`apps/api`)

### 3.1 Extensão PostgreSQL `unaccent`
- Criação de migration SQL `20260916180000_enable_unaccent_extension/migration.sql`:
  ```sql
  CREATE EXTENSION IF NOT EXISTS unaccent;
  ```

### 3.2 Camada de Serviço (`restaurant.service.ts`)
A busca por `search` deve ser insensível a maiúsculas/minúsculas e acentuação:
- Quando `search` for fornecido:
  - Tenta realizar uma consulta otimizada utilizando a função `unaccent()` do PostgreSQL:
    ```sql
    SELECT id FROM restaurants WHERE unaccent(name) ILIKE unaccent('%search%')
    ```
  - Vincula os IDs correspondentes à cláusula `where` do Prisma: `{ id: { in: matchedIds } }`.
  - Fallback: se o banco local ou mock de teste não possuir a extensão `unaccent`, aplica o fallback nativo do Prisma `{ name: { contains: search, mode: 'insensitive' } }`.
- Quando `cuisine` for fornecido:
  - Adiciona à cláusula `where`: `{ cuisineType: { contains: cuisine, mode: 'insensitive' } }`.
- Quando `city` for fornecido:
  - Adiciona à cláusula `where`: `{ city: { contains: city, mode: 'insensitive' } }`.
- Suporte a filtros simultâneos (`search` + `cuisine` + `city`).

---

## 4. Arquitetura do Frontend Mobile (`apps/mobile`)

### 4.1 Client HTTP (`services/api.ts`)
Atualização da função `fetchRestaurants`:
```typescript
export interface FetchRestaurantsParams {
  page?: number;
  limit?: number;
  search?: string;
  cuisine?: string;
  city?: string;
}
```
Anexa automaticamente `search`, `cuisine` e `city` à query string da URL se definidos e não vazios.

### 4.2 Hook `useRestaurantList` (`hooks/useRestaurantList.ts`)
- Evolução do hook para aceitar filtros reativos:
  ```typescript
  interface UseRestaurantListOptions {
    limit?: number;
    search?: string;
    cuisine?: string;
    city?: string;
  }
  ```
- Implementação de debounce interno de 400ms para alterações de `search`, resetando a paginação para a página 1 e evitando disparos excessivos de requisições a cada caractere digitado.
- Exposição do termo de busca e filtros ativos no retorno do hook.

### 4.3 Componentes de Interface
1. **`SearchBar.tsx`**:
   - Campo de entrada estilizado no tema do app (ícone de lupa, placeholder intuitivo, botão "X" para limpar busca).
2. **`CuisineFilterChips.tsx`**:
   - Carrossel horizontal de categorias/culinárias comuns ("Todos", "Brasileira", "Italiana", "Japonesa", "Hamburgueria", "Pizzaria", "Cafeteria").
3. **`SearchEmptyState.tsx`**:
   - Exibido quando a busca com filtros não retorna nenhum restaurante.
   - Mensagem amigável com indicação do termo buscado e botão de ação "Limpar busca e filtros".
4. **Tela `home.tsx`**:
   - Integração da `SearchBar` e dos chips de filtro no cabeçalho.
   - Transição suave entre a listagem geral e os resultados filtrados.
5. **Tela `buscar.tsx`**:
   - Aba dedicada de busca para pesquisa aprofundada com campo de busca e filtros combinados de cidade e culinária.

---

## 5. Validação e Qualidade
1. Testes unitários em `packages/contracts` para os novos campos da query.
2. Testes unitários na API (`apps/api`) validando:
   - Busca com e sem acentos (`café` vs `cafe`).
   - Match parcial e case-insensitive (`ita` -> `Italiana`).
   - Combinação de filtros simultâneos (`search` + `cuisine` + `city`).
   - Paginação mantida durante a busca.
3. Execução completa da suíte de verificação: `npm run verify`.
