# ADR 0008: Filtros Avançados por Preço, Avaliação, Distância e Horário de Funcionamento (HU7)

- **Status**: Aceito
- **Data**: 2026-09-16
- **Decisores**: Equipe de Desenvolvimento ADS-PI-II / Issue #52
- **Vínculos**: Issue #52, HU7, Extensão da HU5 e HU6, Sprint #3

---

## 1. Contexto do Problema

A HU7 estabelece:
> *"Como usuário, quero filtrar restaurantes por preço, avaliação, distância e horário, para refinar os resultados."*

Os estabelecimentos possuem informações enriquecidas cadastradas (HU de perfil ampliado - Issue #49), incluindo:
- `priceRange`: Níveis de preço médio (`$`, `$$`, `$$$`).
- `rating`: Nota média de avaliação (1 a 5 estrelas).
- `latitude` e `longitude`: Coordenadas geográficas do estabelecimento.
- `businessHours`: Horários de funcionamento estruturados por dia da semana em JSON com suporte a múltiplos turnos e viradas de noite.

Era necessário estabelecer:
1. **Padronização dos parâmetros de consulta**: Formato e tipos aceitos em `GET /restaurants`.
2. **Dependência de geolocalização**: Validação estrita de que o filtro `maxDistance` exige as coordenadas `lat` e `lng` do usuário, calculando distâncias via fórmula de Haversine.
3. **Cálculo de `openNow` no servidor**: Resolução temporal no fuso horário oficial de Brasília (`America/Sao_Paulo`), considerando turnos normais e turnos que ultrapassam a meia-noite (overnight shifts).
4. **Composabilidade e integridade**: Todos os novos filtros devem poder ser combinados simultaneamente entre si e com os parâmetros existentes (`search`, `cuisine`, `city`, `page`, `limit`).
5. **Experiência do Usuário (UX) no Mobile**: Interface amigável via modal/bottom sheet (`FilterModal`), indicador visual de filtros ativos (badge com contagem) e tratamento gracioso de recusa de permissão de GPS.

---

## 2. Decisão Arquitetural

### 2.1 Contratos Compartilhados (`packages/contracts`)
- Atualização do schema `listRestaurantsQuerySchema`:
  - `priceRange`: Aceita valor único ou lista delimitada por vírgula (`$,$$`), validado contra o enum `["$", "$$", "$$$"]`.
  - `minRating`: Número decimal ou inteiro entre 1 e 5 (`z.coerce.number().min(1).max(5)`).
  - `maxDistance`: Distância máxima em metros (`z.coerce.number().positive()`).
  - `openNow`: Booleano transformado a partir de string (`"true"` / `"false"`).
  - `lat` e `lng`: Latitude e longitude do usuário.
  - **Validação Cruzada (`superRefine`)**: Se `maxDistance` for informado, `lat` e `lng` tornam-se de fornecimento estritamente obrigatório.

### 2.2 Motor de Filtragem no Backend (`apps/api`)
1. **Filtros no Banco (Prisma SQL)**:
   - `priceRange`: Cláusula `{ in: priceRanges }` aplicada diretamente na query.
   - `minRating`: Cláusula `{ gte: minRating }` sobre o campo `rating`.
   - Bounding Box geográfico prévio quando `maxDistance` for fornecido.
2. **Refinamento Haversine e Horários em Memória**:
   - `maxDistance`: Aplicação da função `haversineDistance` descartando candidatos com distância superior ao raio e populando `distanceInMeters`.
   - `openNow`: Função auxiliar `isRestaurantOpen(businessHours, date)` com timezone `America/Sao_Paulo`, testando turnos do dia corrente e turnos iniciados na véspera que ultrapassam a meia-noite.
   - A paginação (`skip`, `take`, `total`, `totalPages`, `hasMore`) opera com exatidão sobre o conjunto resultante após a filtragem completa.

### 2.3 Interface e Experiência do Usuário (`apps/mobile`)
1. **Componente `FilterModal`**:
   - Modal em formato Bottom Sheet com visual escuro consistente com o Design System.
   - Seleção de Faixa de Preço em Chips (`$`, `$$`, `$$$`).
   - Seleção de Avaliação Mínima em Chips (3.0+, 3.5+, 4.0+, 4.5+).
   - Seleção de Raio de Distância (1 km, 3 km, 5 km, 10 km).
   - Switch liga/desliga para "Aberto agora".
   - Ações de "Limpar Filtros" e "Aplicar Filtros".
2. **Badge de Filtros Ativos**:
   - Botão de filtro com ícone e badge numérico sobreposto indicando o total de filtros ativos (ex: 2 filtros aplicados).
3. **Resiliência a Permissões de Localização**:
   - Verificação de permissão via `expo-location`. Caso o usuário negue acesso à localização, a seção de distância é desabilitada com mensagem explicativa amigável.

---

## 3. Consequências e Trade-offs

### Benefícios
- **Precisão e Flexibilidade**: O usuário consegue encontrar rapidamente restaurantes abertos agora, próximos à sua posição e dentro da sua faixa de preço e avaliação desejada.
- **Robustez nos Contratos**: Validação estrita impede erros silenciosos na API (ex: enviar `maxDistance` sem coordenadas).
- **Consistência Visual**: A experiência de filtragem é uniforme na Home e na tela de Busca.
