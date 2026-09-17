# Plano de Implementação: Issue #53 - Ordenação dos Resultados (HU8)

- **Autor**: Equipe Menu Digital / Antigravity Agent
- **Data**: 2026-09-17
- **Branch**: `feature/53-ordenacao-resultados-hu8`
- **Issue**: [#53](https://github.com/CAMPUSCEUB/ADS-PI-II-MenuDigital/issues/53)

---

## 1. Objetivos

Implementar ordenação nos resultados de restaurantes:
1. Adicionar query param `sortBy` (`distance` | `rating` | `priceAsc` | `priceDesc`) ao `GET /restaurants`.
2. Exigir `lat`/`lng` quando `sortBy=distance`, retornando 400 Bad Request com mensagem descritiva caso ausentes.
3. Integrar seletor de ordenação no app com persistência via `AsyncStorage` entre telas e padrão `distance` (se GPS ativo) ou `rating`.

---

## 2. Tarefas e Passos TDD

### Passo 1: Contratos Compartilhados (`packages/contracts`)
1. Escrever testes em `packages/contracts/src/__tests__/restaurant.test.ts`:
   - Aceitar `sortBy=distance`, `rating`, `priceAsc`, `priceDesc`.
   - Rejeitar valores arbitrários de `sortBy`.
   - Exigir `lat` e `lng` para `sortBy=distance`.
2. Implementar schema em `packages/contracts/src/index.ts`.
3. Compilar e rodar testes: `npm run build:contracts` e `npm run test -w packages/contracts`.
4. Commit: `feat(contracts): add sortBy to listRestaurantsQuerySchema with distance coordinate validation`.

### Passo 2: Lógica de Ordenação no Backend (`apps/api`)
1. Implementar função auxiliar pura `sortRestaurants` em `apps/api/src/services/restaurant.service.ts`.
2. Escrever testes unitários em `apps/api/src/__tests__/restaurant.test.ts`:
   - Ordenação por `distance`.
   - Ordenação por `rating` (com nulos ao final).
   - Ordenação por `priceAsc` e `priceDesc`.
   - Combinação de `sortBy` com filtros de `openNow`, `cuisine`, `search`.
   - Validação de middleware `validateQuery` com `sortBy=distance` sem coordenadas.
3. Integrar no `RestaurantService.list`.
4. Rodar testes e linter: `npm run test:api` e `npm run lint:api`.
5. Commit: `feat(api): implement sortBy ordering logic in restaurant service`.

### Passo 3: Persistência e Serviço HTTP no Mobile (`apps/mobile`)
1. Atualizar `FetchRestaurantsParams` em `apps/mobile/services/api.ts` com `sortBy?: string`.
2. Criar hook `useSortPreference.ts` em `apps/mobile/hooks/` com persistência em `AsyncStorage`.
3. Atualizar hook `useRestaurantList.ts` para receber e encaminhar `sortBy`.
4. Commit: `feat(mobile): add useSortPreference hook with AsyncStorage persistence and update api service`.

### Passo 4: Componentes de UI e Integração das Telas (`apps/mobile`)
1. Criar componente `SortSelectorChips.tsx` para alternância rápida de ordenação.
2. Atualizar `FilterModal.tsx` com seção "Ordenar por".
3. Integrar `useSortPreference` e `SortSelectorChips` em:
   - `apps/mobile/app/(tabs)/home.tsx`
   - `apps/mobile/app/(tabs)/buscar.tsx`
4. Validar linter e compilação de tipos: `npm run lint:mobile` e `npx tsc --noEmit`.
5. Commit: `feat(mobile): add SortSelectorChips and sort section to FilterModal with screen persistence`.

### Passo 5: Verificação Completa e Pull Request
1. Executar `npm run verify`.
2. Publicar branch `feature/53-ordenacao-resultados-hu8` no GitHub.
3. Criar Pull Request vinculado à Issue #53 (`Closes #53`).
