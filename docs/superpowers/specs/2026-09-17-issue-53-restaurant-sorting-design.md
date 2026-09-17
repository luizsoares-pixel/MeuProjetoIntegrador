# Design Spec: Issue #53 - Ordenação dos Resultados de Restaurantes (HU8)

- **Autor**: Equipe Menu Digital / Antigravity Agent
- **Data**: 2026-09-17
- **Branch**: `feature/53-ordenacao-resultados-hu8`
- **Issue**: [#53](https://github.com/CAMPUSCEUB/ADS-PI-II-MenuDigital/issues/53)
- **Status**: Aprovado

---

## 1. Visão Geral e Objetivos

Esta especificação detalha o design técnico e arquitetural para a **HU8**:
> *"Como usuário, quero ordenar os resultados, para priorizar o que é mais relevante para mim."*

### Critérios de Aceite
1. Endpoint `GET /restaurants?sortBy=` implementado, suportando:
   - `distance`: Ordenação crescente por proximidade física em metros.
   - `rating`: Ordenação decrescente pela nota média de avaliação.
   - `priceAsc`: Ordenação crescente pela faixa de preço (`$` $\rightarrow$ `$$$`).
   - `priceDesc`: Ordenação decrescente pela faixa de preço (`$$$` $\rightarrow$ `$`).
2. Aplicação do `sortBy` em conjunto com filtros ativos (`search`, `cuisine`, `city`, `priceRange`, `minRating`, `maxDistance`, `openNow`).
3. `sortBy=distance` exige obrigatoriamente `lat` e `lng` nos parâmetros de consulta; retorna erro 400 amigável e informativo caso estejam ausentes.
4. Seletor de ordenação no aplicativo mobile, mantendo a seleção ao navegar entre telas e voltar (persistência via `AsyncStorage`).
5. Ordenação padrão definida: `distance` se localização do usuário estiver disponível e autorizada, senão `rating`.

---

## 2. Contratos Compartilhados (`packages/contracts`)

### 2.1 Enum e Tipagem
```typescript
export const restaurantSortByEnum = z.enum([
  "distance",
  "rating",
  "priceAsc",
  "priceDesc",
]);
export type RestaurantSortBy = z.infer<typeof restaurantSortByEnum>;
```

### 2.2 Extensão do `listRestaurantsQuerySchema`
```typescript
sortBy: z
  .string()
  .optional()
  .transform((v) => (v !== undefined && v.trim() !== "" ? v.trim() : undefined))
  .refine(
    (v) =>
      v === undefined ||
      ["distance", "rating", "priceAsc", "priceDesc"].includes(v),
    {
      message:
        "O parâmetro 'sortBy' deve ser um dos seguintes valores: distance, rating, priceAsc, priceDesc.",
    }
  )
  .transform((v) => v as RestaurantSortBy | undefined),
```

### 2.3 Regra de Refinamento Cruzado (`superRefine`)
```typescript
if (
  data.sortBy === "distance" &&
  (data.lat === undefined || data.lng === undefined)
) {
  ctx.addIssue({
    code: z.ZodIssueCode.custom,
    message:
      "Os parâmetros 'lat' e 'lng' são obrigatórios quando 'sortBy=distance' for informado.",
    path: ["sortBy"],
  });
}
```

---

## 3. Backend (`apps/api`)

### 3.1 Função Utilitária de Ordenação
```typescript
export function sortRestaurants<T extends {
  distanceInMeters?: number;
  rating?: number | null;
  priceRange?: string | null;
  createdAt: Date;
}>(items: T[], sortBy?: RestaurantSortBy): T[]
```
- Se `sortBy === "distance"`:
  `(a.distanceInMeters ?? Infinity) - (b.distanceInMeters ?? Infinity)`
- Se `sortBy === "rating"`:
  `(b.rating ?? -1) - (a.rating ?? -1)`
- Se `sortBy === "priceAsc"`:
  `PRICE_WEIGHT[a.priceRange ?? ""] (onde $ = 1, $$ = 2, $$$ = 3, null = 999)`
- Se `sortBy === "priceDesc"`:
  `PRICE_WEIGHT[b.priceRange ?? ""] (onde $ = 1, $$ = 2, $$$ = 3, null = -1)`
- Desempate padrão: `new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()`.

### 3.2 Execução no `RestaurantService.list`
- Caso `sortBy === "distance"` ou filtros em memória estejam ativos (`openNow`, `hasDistanceFilter`):
  - Busca candidatos no Prisma com filtros de banco.
  - Popula `distanceInMeters` via `haversineDistance`.
  - Aplica filtros em memória.
  - Ordena a lista usando `sortRestaurants(filtered, query.sortBy)`.
  - Calcula paginação e fatia `filtered.slice(skip, skip + limit)`.
- Caso contrário:
  - Aplica `orderBy` diretamente na query do Prisma (`rating`, `priceRange` ou `createdAt`).
  - Popula `distanceInMeters` se `lat`/`lng` estiverem presentes.

---

## 4. Frontend Móvel (`apps/mobile`)

### 4.1 Persistência e Padrão
- Hook `useSortPreference(hasLocation: boolean)`:
  - Chave de armazenamento: `@menu_digital:sort_by`.
  - Inicialização: recupera do `AsyncStorage`. Se não houver preferência prévia, define `distance` se `hasLocation === true`, senão `rating`.
  - Sincronização entre abas: salva alterações imediatamente no storage e atualiza o estado da tela.

### 4.2 Integração na UI
1. **Modal de Filtros (`FilterModal.tsx`)**:
   - Nova seção "Ordenar por" com chips selecionáveis:
     - 📍 Proximidade (`distance`) — desabilitado com aviso se GPS indisponível.
     - ★ Avaliação (`rating`).
     - 💲 Menor Preço (`priceAsc`).
     - 💎 Maior Preço (`priceDesc`).
2. **Seletor de Ordenação Rápido (`SortSelectorChips.tsx`)**:
   - Fileira horizontal compacta no topo das listas de restaurantes em `home.tsx` e `buscar.tsx`.
   - Permite troca instantânea com 1 toque sem necessidade de abrir o modal de filtros completo.

---

## 5. Estratégia de Testes

1. **Contratos (`packages/contracts`)**:
   - Validar `sortBy` com valores individuais válidos (`distance`, `rating`, `priceAsc`, `priceDesc`).
   - Rejeitar valores inválidos (ex: `invalidSort`).
   - Rejeitar `sortBy=distance` sem `lat`/`lng`.
   - Aceitar `sortBy=distance` com `lat` e `lng` válidos.
2. **Backend (`apps/api`)**:
   - Testar `sortRestaurants` isoladamente com cada critério.
   - Testar `sortBy=distance` ordenando por `distanceInMeters`.
   - Testar `sortBy=rating` ordenando decrescente por nota (nulos no final).
   - Testar `sortBy=priceAsc` e `sortBy=priceDesc`.
   - Testar combinação de `sortBy` com filtros de busca, culinária, cidade e `openNow`.
   - Testar middleware `validateQuery` rejeitando `sortBy=distance` sem coordenadas.
