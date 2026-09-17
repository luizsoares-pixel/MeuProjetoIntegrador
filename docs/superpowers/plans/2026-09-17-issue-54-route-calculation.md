# Plano de Implementação — Cálculo de Rota e Tempo Estimado (HU9)

- **Issue**: [#54](https://github.com/CAMPUSCEUB/ADS-PI-II-MenuDigital/issues/54)
- **Data**: 2026-09-17
- **Status**: Em Execução

---

## Passo 1: Contratos Compartilhados (`packages/contracts`)
- [ ] 1.1 Adicionar `routeProfileEnum`, `restaurantRouteQuerySchema`, `routeCoordinateSchema` e `routeCalculationResultSchema` em `packages/contracts/src/index.ts`.
- [ ] 1.2 Criar testes unitários em `packages/contracts/src/__tests__/route.test.ts` validando parâmetros de consulta, valores permitidos e estrutura de retorno.
- [ ] 1.3 Executar build e testes: `npm run build -w packages/contracts` e `npm run test -w packages/contracts`.

---

## Passo 2: Backend API (`apps/api`)
- [ ] 2.1 Criar `apps/api/src/services/route.service.ts` com chamada HTTP ao OSRM, timeout com `AbortSignal`, parsing de GeoJSON para coordenadas, e fallback para Haversine com velocidade estimada.
- [ ] 2.2 Criar método no controller e registrar rota `GET /restaurants/:id/route` em `apps/api/src/routes/restaurant.routes.ts`.
- [ ] 2.3 Escrever testes unitários em `apps/api/src/__tests__/route.test.ts` cobrindo cenários:
  - Sucesso na consulta OSRM (mock de `globalThis.fetch`).
  - Timeout / falha no OSRM acionando fallback Haversine com status 200 e `isFallback: true`.
  - Perfis `driving` e `walking`.
  - Restaurante inexistente (404).
  - Parâmetros inválidos (400 via `validateQuery`).
- [ ] 2.4 Executar lint e testes: `npm run lint -w apps/api` e `npm run test -w apps/api`.

---

## Passo 3: Mobile Services e Hooks (`apps/mobile`)
- [ ] 3.1 Implementar `apps/mobile/services/osrm.ts` com funções auxiliares de chamada e formatação de distância e tempo.
- [ ] 3.2 Atualizar `apps/mobile/services/api.ts` com `fetchRestaurantRoute` e `fetchRestaurantById`.
- [ ] 3.3 Criar hook `apps/mobile/hooks/useRouteCalculation.ts` para controle de estado da rota e alternância de perfil.

---

## Passo 4: Mobile UI e Telas (`apps/mobile`)
- [ ] 4.1 Criar a tela de detalhes do restaurante `apps/mobile/app/restaurante/[id].tsx` com suporte a exibição de dados completos, card de tempo/distância estimado, seletor `driving` / `walking`, e mapa com `<Polyline>`.
- [ ] 4.2 Atualizar `RestaurantPreviewCard.tsx` com opção "Ver Rota" e navegação.
- [ ] 4.3 Atualizar `InteractiveMap.tsx` e `InteractiveMap.web.tsx` para suporte à renderização de rota ativa com `<Polyline>`.
- [ ] 4.4 Conectar cliques em `RestaurantCard` em `home.tsx` e `buscar.tsx` para navegar para `app/restaurante/[id].tsx`.

---

## Passo 5: Verificação e Conclusão
- [ ] 5.1 Executar verificação unificada do monorepo: `npm run verify`.
- [ ] 5.2 Checar tipagem estática no mobile: `npx tsc --noEmit -p apps/mobile/tsconfig.json`.
- [ ] 5.3 Commits atômicos no padrão semântico, push da branch e abertura do PR vinculando a Issue #54 e milestone `SPRINT 04`.
