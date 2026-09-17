# ADR 0010: Cálculo de Rota e Tempo Estimado via OSRM (HU9)

- **Status**: Aceito
- **Data**: 2026-09-17
- **Decisores**: Equipe de Desenvolvimento ADS-PI-II / Issue #54
- **Vínculos**: Issue #54, HU9, Sprint #4, ADR 0004 (Mapas e Geolocalização)

---

## 1. Contexto do Problema

A HU9 define o seguinte requisito funcional:
> *"Como usuário, quero ver a rota e o tempo estimado até um restaurante, para decidir se vale a pena ir até lá."*

Até a Sprint #3, o projeto calculava apenas a distância euclidiana/esférica em linha reta utilizando a fórmula de Haversine (`haversineDistance`), sem considerar a malha viária real, sentidos de tráfego, vias bloqueadas e velocidade média dos trajetos.

### Desafios Técnicos e Restrições
1. **Custo e Dependências Externas**:
   - Seguindo as diretrizes acadêmicas e arquiteturais do projeto (CEUB), não devem ser utilizadas chaves pagas (ex: Google Directions API ou Mapbox Directions). O serviço público **OSRM** (`router.project-osrm.org`) fornece roteamento open-source gratuito baseado em OpenStreetMap sem exigência de API keys.
2. **Boas Práticas de Uso Justo (Fair Use) e Limites do Servidor Demo**:
   - O servidor demo do OSRM possui limites de taxa (rate limits) e é fornecido como serviço de melhor esforço comunitário.
   - É obrigatório o envio de um cabeçalho `User-Agent` customizado e estruturado (`MenuDigital-App/1.0 (CEUB ADS-PI-II; contact: menu-digital@ceub.br)`).
   - Deve ser registrado em documentação que, para implantação em produção de larga escala, o self-hosting do OSRM (via container Docker OSRM-backend) é a abordagem recomendada.
3. **Resiliência e Fallback Gracioso**:
   - Falhas de rede, timeouts no OSRM (servidor fora do ar) ou ausência de permissão de geolocalização do usuário não podem quebrar a aplicação nem travar a interface do usuário.
   - Na indisponibilidade do OSRM, deve ocorrer fallback para cálculo de distância em linha reta (Haversine) com aviso textual amigável ao usuário.
4. **Convenção de Coordenadas do OSRM**:
   - Diferente do `react-native-maps` (`{ latitude, longitude }`), a API do OSRM exige o formato `{longitude},{latitude};{longitude},{latitude}` (longitude primeiro, padrão GeoJSON / RFC 7946). A inversão de eixos causaria rotas incorretas ou erros 400.
5. **Renderização Visual e Detalhes**:
   - A rota retornada em formato GeoJSON (`LineString`) deve ser convertida para coordenadas de `Polyline` no mapa do aplicativo.
   - A distância (em metros/km) e a duração estimada (em minutos/horas) devem ser expostas na tela de detalhes do restaurante e no mapa interativo com feedback visual de carregamento (*loading state*).
   - Suporte inicial ao perfil automotivo (`driving`), com extensibilidade nativa para perfil de pedestre (`walking`/`foot`).

---

## 2. Decisão Arquitetural

### 2.1 Contratos Compartilhados (`packages/contracts`)
Definição dos tipos e schemas de rota:
- `routeProfileEnum`: `z.enum(["driving", "walking"])` (default: `"driving"`).
- `routeCoordinatesSchema`: validação de coordenadas de origem e destino (`lat`, `lng`).
- `routeCalculationResultSchema`: estrutura normalizada do resultado:
  - `distanceInMeters`: distância viária total calculada.
  - `durationInSeconds`: tempo estimado em segundos.
  - `polylineCoordinates`: array de `{ latitude: number, longitude: number }` pronto para o `<Polyline>`.
  - `profile`: perfil utilizado (`driving` | `walking`).
  - `isFallback`: booleano indicando se o resultado é oriundo do fallback Haversine.
  - `fallbackReason`: motivo do fallback, se aplicável.

### 2.2 Backend (`apps/api`)
- Criação do serviço `RouteService` e endpoint `GET /restaurants/:id/route?lat=&lng=&profile=`:
  - Valida parâmetros via Zod.
  - Consulta as coordenadas cadastradas do restaurante pelo `id`.
  - Realiza a requisição ao OSRM (`https://router.project-osrm.org/route/v1/{profile}/{userLng},{userLat};{restLng},{restLat}?overview=full&geometries=geojson`) com `User-Agent` institucional e timeout controlado (8 segundos).
  - Em caso de falha de conexão ou timeout do OSRM, aplica fallback imediato para Haversine com velocidade média estimada (30 km/h para `driving` e 5 km/h para `walking`), evitando falha 500 no cliente.

### 2.3 Mobile (`apps/mobile`)
1. **Serviço de Roteamento (`apps/mobile/services/osrm.ts`)**:
   - Consome o endpoint da API com capacidade de fallback local direto via OSRM ou Haversine, garantindo funcionamento contínuo.
2. **Hook `useRouteCalculation`**:
   - Gerencia estados `isLoading`, `route`, `isError`, `errorMessage`, `profile` e métodos `calculateRoute` e `toggleProfile`.
3. **Tela de Detalhes do Restaurante (`apps/mobile/app/restaurante/[id].tsx`)**:
   - Tela dedicada exibindo os dados completos do restaurante (fotos, culinária, avaliação, endereço, horário, formas de pagamento).
   - Seção dedicada de Rota e Deslocamento com exibição de tempo estimado, distância, seletor de modalidade (Carro / A pé), loading skeleton/spinner e mapa interativo com traçado da `<Polyline>`.
4. **Mapa Interativo (`apps/mobile/components/InteractiveMap.tsx`)**:
   - Suporte a traçado de rota ativa via `<Polyline>` entre a localização do usuário e o restaurante selecionado.
   - Enquadramento automático com `fitToCoordinates`.
   - Card flutuante com tempo estimado, distância e botão para limpar/fechar rota.

---

## 3. Consequências

### Positivas
- **Experiência do Usuário (UX)**: O usuário agora visualiza o tempo real e trajeto viário antes de decidir seu deslocamento.
- **Custo Zero**: Sem dependência de APIs proprietárias com cobrança em dólar ou quotas pagas.
- **Alta Disponibilidade**: Arquitetura resiliente com timeout controlado e fallback automático para Haversine.
- **Conformidade CEUB**: Segue boas práticas de `User-Agent` para serviços comunitários abertos e respeita a Definition of Done.

### Negativas / Mitigações
- **Latência do Servidor Demo OSRM**: O servidor público pode apresentar picos de resposta. *Mitigação*: timeout de 8 segundos e indicação clara de carregamento, com fallback silencioso para linha reta.
- **Recomendação de Self-Hosting**: Para lançamento comercial ou produção real, recomenda-se hospedar uma instância própria do OSRM-backend em VPS/Docker com os mapas do Brasil/Distrito Federal.
