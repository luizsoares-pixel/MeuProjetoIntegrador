# Plano de Implementação: Issue #52 - Filtros por Preço, Avaliação, Distância e Horário (HU7)

- **Autor**: Equipe Menu Digital / Antigravity Agent
- **Data**: 2026-09-16
- **Branch**: `feature/52-filtros-preco-avaliacao-distancia-horario`
- **Issue**: [#52](https://github.com/CAMPUSCEUB/ADS-PI-II-MenuDigital/issues/52)

---

## 1. Contexto e Objetivos

Estender a listagem de restaurantes com filtros avançados:
- Faixa de preço (`priceRange`).
- Avaliação mínima (`minRating`).
- Raio de distância máxima (`maxDistance`) com coordenadas (`lat`, `lng`).
- Restaurantes abertos no momento (`openNow`).
- Modal de filtros com badge de contagem de filtros ativos e tratamento de permissão de GPS no Mobile.

---

## 2. Tarefas e Passos TDD

### Passo 1: Contratos (`packages/contracts`)
1. Adicionar testes unitários em `packages/contracts/src/__tests__/restaurant.test.ts` para os novos campos e regras de validação cruzada do `listRestaurantsQuerySchema`.
2. Implementar as atualizações no schema em `packages/contracts/src/index.ts`.
3. Compilar contratos: `npm run build:contracts` e executar testes unitários dos contratos.
4. Commit semântico: `feat(contracts): add advanced filter fields to listRestaurantsQuerySchema`.

### Passo 2: Lógica de Negócio e Testes na API (`apps/api`)
1. Implementar função auxiliar pura `isRestaurantOpen` e testes dedicados cobrindo:
   - Horário dentro do turno regular.
   - Horário fora do turno.
   - Turno que cruza a meia-noite (iniciado na véspera ou no dia corrente).
   - Restaurante sem horário ou fechado no dia.
2. Escrever testes unitários em `apps/api/src/__tests__/restaurant.test.ts` para `restaurantService.list`:
   - Filtro por `priceRange` (único e múltiplo).
   - Filtro por `minRating`.
   - Filtro por `maxDistance` com coordenadas.
   - Filtro por `openNow`.
   - Combinação de múltiplos filtros com paginação preservada.
3. Implementar a lógica de filtragem em `apps/api/src/services/restaurant.service.ts`.
4. Executar bateria de testes da API: `npm run test:api` e linter `npm run lint:api`.
5. Commit semântico: `feat(api): implement priceRange, minRating, maxDistance and openNow filters in restaurant service`.

### Passo 3: Cliente HTTP e Hook Mobile (`apps/mobile`)
1. Atualizar `FetchRestaurantsParams` em `apps/mobile/services/api.ts` para incluir os novos filtros (`priceRange`, `minRating`, `maxDistance`, `openNow`, `lat`, `lng`).
2. Atualizar hook `useRestaurantList` em `apps/mobile/hooks/useRestaurantList.ts` para repassar esses filtros e calcular contagem de filtros ativos.
3. Commit semântico: `feat(mobile): support advanced filter params in api client and useRestaurantList`.

### Passo 4: Componentes de UI e Integração de Telas (`apps/mobile`)
1. Criar componente `apps/mobile/components/FilterModal.tsx`:
   - Seção de Preço (Chips $, $$, $$$).
   - Seção de Avaliação (Chips 3+, 3.5+, 4+, 4.5+).
   - Seção de Distância (Chips 1km, 3km, 5km, 10km).
   - Switch "Aberto agora".
   - Botão "Limpar filtros" e "Aplicar filtros".
   - Detecção de permissão de geolocalização com `expo-location`.
2. Integrar botão de filtro com badge de contagem em:
   - `apps/mobile/app/(tabs)/home.tsx`.
   - `apps/mobile/app/(tabs)/buscar.tsx`.
3. Executar linter mobile: `npm run lint:mobile`.
4. Commit semântico: `feat(mobile): add FilterModal and filter trigger with active badge to home and search screens`.

### Passo 5: Verificação Monorepo e Conclusão
1. Executar `npm run verify` unificado.
2. Atualizar `tasks.md`.
3. Apresentar entrega completa ao usuário.
