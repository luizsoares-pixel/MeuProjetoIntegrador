# ADR 0004: Arquitetura de Mapas, Geolocalização Híbrida e Agrupamento Espacial

- **Status**: Aceito
- **Data**: 2026-09-09
- **Decisores**: Equipe de Desenvolvimento ADS-PI-II

---

## 1. Contexto do Problema

A experiência central do usuário no aplicativo **Menu-Digital** baseia-se na descoberta de estabelecimentos gastronômicos próximos por meio de um mapa interativo georreferenciado:
- A biblioteca padrão da indústria `react-native-maps` depende dos SDKs nativos do Google Maps (Android) e Apple Maps (iOS). Essa dependência causa quebra imediata de compilação quando o projeto é executado no navegador Web (`expo start --web`), ambiente essencial para validação rápida de layout e demonstrações acadêmicas.
- Em regiões com alta densidade urbana de restaurantes (ex: centros gastronômicos e shoppings), renderizar dezenas de marcadores individuais simultâneos causa engasgos na renderização e degradação de performance do aplicativo móvel.
- Dispositivos de usuários podem ter permissão de geolocalização negada, demandando uma estratégia de fallback graciosa.

---

## 2. Decisão Arquitetural

Adotamos uma **Arquitetura de Mapas Híbrida com Agrupamento Espacial e Fallback Multiplataforma**:

1. **Separação por Plataforma via Extensão `.web.tsx`**:
   - `apps/mobile/components/InteractiveMap.tsx`: Implementação nativa consumindo `react-native-maps` e `MapView` para Android e iOS.
   - `apps/mobile/components/InteractiveMap.web.tsx`: Implementação alternativa para a Web, utilizando contêiner interativo compatível sem invocar símbolos nativos que quebrem o empacotador web.
2. **Clustering Espacial com Supercluster**:
   - Utilização da biblioteca `supercluster` para calcular clusters de marcadores dinamicamente conforme o nível de zoom e a região visível (`region`).
   - Marcadores agrupados são representados pelo componente `ClusterMarker.tsx` com contagem numérica e raio de expansão ao toque.
   - Marcadores individuais são exibidos através de `RestaurantPinMarker.tsx`, abrindo o card flutuante `RestaurantPreviewCard.tsx`.
3. **Busca Espacial e Filtragem por Raio no Backend**:
   - O endpoint `GET /restaurants/nearby` recebe `latitude`, `longitude` e `radius` (em metros).
   - O backend aplica pré-filtragem por Bounding Box no banco de dados e calcula a distância precisa via fórmula de Haversine no serviço `RestaurantService.findNearby`, ordenando os resultados por proximidade e injetando o campo `distanceInMeters`.
4. **Gerenciamento Resiliente de Permissões (`expo-location`)**:
   - Solicitação de permissão de geolocalização em primeiro plano via `Location.requestForegroundPermissionsAsync()`.
   - Caso a permissão seja negada ou o sensor esteja desabilitado, o mapa posiciona-se em uma coordenada central pré-definida de fallback (Brasília/DF) e apresenta aviso informativo amigável ao usuário.

---

## 3. Consequências e Trade-offs

### Pontos Positivos
- **Compatibilidade Universal**: Permite desenvolver e testar o aplicativo tanto em emuladores móveis quanto no navegador desktop sem bifurcar bases de código.
- **Alta Performance Gráfica**: O clustering reduz drasticamente o número de nós renderizados simultaneamente na árvore do React Native, mantendo 60 FPS nas operações de pan e zoom.
- **Experiência de Usuário Fluida**: Cards de pré-visualização evitam navegações desnecessárias, permitindo ao usuário decidir se quer explorar o cardápio completo daquele restaurante.

### Pontos de Atenção
- Requer manter paridade funcional entre `InteractiveMap.tsx` e `InteractiveMap.web.tsx` quando novos eventos ou propriedades forem adicionados.
