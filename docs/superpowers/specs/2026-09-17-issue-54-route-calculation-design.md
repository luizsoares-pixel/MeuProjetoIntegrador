# Especificação Técnica — Cálculo de Rota e Tempo Estimado (HU9)

- **Issue**: [#54](https://github.com/CAMPUSCEUB/ADS-PI-II-MenuDigital/issues/54)
- **Data**: 2026-09-17
- **Autor**: Equipe de Engenharia Menu Digital
- **Status**: Aprovado

---

## 1. Visão Geral e Objetivos

A História de Usuário HU9 estabelece a necessidade de fornecer aos usuários do **Menu Digital** a estimativa de tempo e trajeto viário real até o restaurante selecionado. Atualmente, o aplicativo calcula unicamente a distância euclidiana/esférica (Haversine) em linha reta, o que pode divergir consideravelmente da distância real percorrida nas vias urbanas e não informa o tempo de deslocamento.

### Objetivos Principais
1. Integrar o serviço público **OSRM** (`https://router.project-osrm.org`) para calcular a rota viária (`/route/v1/{profile}/{coordinates}`).
2. Exibir a **distância viária** e o **tempo estimado de chegada** formatado (ex: "12 min", "1h 15 min", "3,4 km").
3. Traçar a **rota visualmente no mapa** com `<Polyline>` entre o usuário e o restaurante.
4. Suportar perfis de deslocamento: `driving` (carro) como padrão e `walking` (a pé).
5. Tratar graciosamente cenários de erro (GPS desligado, recusa de permissão de localização, timeout da API OSRM, erro 429 de limite de taxa) com fallback imediato para distância em linha reta (Haversine), sem quebrar a tela.
6. Aplicar cabeçalho `User-Agent` customizado e estruturado em conformidade com as diretrizes de uso justo de serviços públicos.

---

## 2. Arquitetura da Integração OSRM

### 2.1 Especificação da API OSRM
- **URL Base**: `https://router.project-osrm.org`
- **Endpoint**: `/route/v1/{profile}/{coordinates}`
  - `{profile}`: `driving` | `walking`
  - `{coordinates}`: Formato GeoJSON: `{origemLng},{origemLat};{destinoLng},{destinoLat}`
    * **ATENÇÃO**: A convenção do OSRM exige `longitude` primeiro e `latitude` depois.
- **Parâmetros de Query**:
  - `overview=full`: Retorna a geometria detalhada completa da rota.
  - `geometries=geojson`: Retorna as coordenadas em array GeoJSON `[[lng1, lat1], [lng2, lat2], ...]`.
  - `steps=false`: Omite passos curva a curva detalhados para reduzir payload.
- **Headers HTTP**:
  - `User-Agent: MenuDigital-App/1.0 (CEUB ADS-PI-II; contact: menu-digital@ceub.br)`
- **Controle de Timeout**:
  - `AbortSignal.timeout(8000)` (8 segundos).

---

## 3. Design dos Contratos (`packages/contracts`)

### 3.1 Schemas e Tipos
```typescript
export const routeProfileEnum = z.enum(["driving", "walking"]);
export type RouteProfile = z.infer<typeof routeProfileEnum>;

export const restaurantRouteQuerySchema = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
  profile: routeProfileEnum.default("driving"),
});
export type RestaurantRouteQuery = z.infer<typeof restaurantRouteQuerySchema>;

export const routeCoordinateSchema = z.object({
  latitude: z.number(),
  longitude: z.number(),
});
export type RouteCoordinate = z.infer<typeof routeCoordinateSchema>;

export const routeCalculationResultSchema = z.object({
  distanceInMeters: z.number(),
  durationInSeconds: z.number(),
  polylineCoordinates: z.array(routeCoordinateSchema),
  profile: routeProfileEnum,
  isFallback: z.boolean().default(false),
  fallbackReason: z.string().optional(),
});
export type RouteCalculationResult = z.infer<typeof routeCalculationResultSchema>;
```

---

## 4. Design do Backend (`apps/api`)

### 4.1 Endpoint e Rota
- `GET /restaurants/:id/route?lat=-15.7942&lng=-47.8822&profile=driving`
- Validação com middleware `validateQuery(restaurantRouteQuerySchema)`.

### 4.2 Serviço `RouteService`
- Busca restaurante pelo `id` para obter coordenadas de destino (`latitude`, `longitude`).
  - Se não encontrado: retorna `404 Not Found`.
- Tenta efetuar chamada HTTP ao OSRM com timeout de 8 segundos.
- Se sucesso:
  - Extrai `distance = routes[0].distance` e `duration = routes[0].duration`.
  - Mapeia coordenadas GeoJSON `[lng, lat]` para `{ latitude: lat, longitude: lng }`.
- Se falha (timeout, erro de rede, status !== 200, 429):
  - Executa cálculo Haversine entre `(lat, lng)` do usuário e `(latitude, longitude)` do restaurante.
  - Estima duração com velocidade média padrão (30 km/h = 8.33 m/s para `driving`; 5 km/h = 1.39 m/s para `walking`).
  - Gera rota em linha reta de 2 pontos: `[origem, destino]`.
  - Retorna `isFallback: true` e `fallbackReason`.

---

## 5. Design do Mobile (`apps/mobile`)

### 5.1 Serviço e Utilitários (`apps/mobile/services/osrm.ts`)
- Função `calculateRoute(params: { userLat, userLng, destLat, destLng, profile })`.
- Função `formatRouteDuration(seconds: number): string` (ex: "8 min", "1h 12 min").
- Função `formatRouteDistance(meters: number): string` (ex: "750 m", "3,4 km").

### 5.2 Hook `useRouteCalculation`
- Entradas: `restaurantCoordinates`, `userCoordinates`, `autoFetch?`.
- Saídas: `{ route, isLoading, isError, errorMessage, profile, setProfile, calculateRoute }`.

### 5.3 Tela de Detalhes (`apps/mobile/app/restaurante/[id].tsx`)
- Recupera `id` da rota via `useLocalSearchParams()`.
- Consulta dados do restaurante via `GET /restaurants/:id`.
- Seção *"Como Chegar / Rota"*:
  - Badge de tempo estimado com ícone do perfil ativo (`car` / `walk`).
  - Seletor de modalidade: 🚗 Carro vs 🚶 A pé.
  - Mini mapa integrado renderizando a `<Polyline>` entre o usuário e o restaurante.
  - Indicador de loading suave durante recálculo.
  - Mensagem de aviso se fallback estiver ativo.

### 5.4 Mapa Interativo (`apps/mobile/components/InteractiveMap.tsx`)
- Suporte a exibição de rota ativa com `<Polyline>` renderizada em ouro (`colors.accent.gold`) e largura 4px.
- Card inferior exibindo a estimativa e botão para limpar a rota.

---

## 6. Plano de Testes
1. **Contratos**: Validação de schemas Zod para queries e respostas de rotas.
2. **Backend**:
   - Resposta com sucesso do OSRM (mock de fetch com GeoJSON válido).
   - Simulação de timeout e erro de rede com acionamento do fallback Haversine.
   - Perfil driving e walking.
   - Parâmetros inválidos e coordenadas fora de limites (-90 a 90, -180 a 180).
   - Restaurante inexistente (404).
3. **Mobile**: Checagem de tipagem estática `tsc --noEmit` e ESLint.
