# ADR 0007: Busca Textual Insensível a Acentos e Filtros Combinados de Restaurantes (HU6)

- **Status**: Aceito
- **Data**: 2026-09-16
- **Decisores**: Equipe de Desenvolvimento ADS-PI-II / Issue #51
- **Vínculos**: Issue #51, HU6, Extensão da HU5, Base para Ordenação e Filtros Avançados (Sprint #3)

---

## 1. Contexto do Problema

A HU6 estabelece que o usuário deve ser capaz de localizar estabelecimentos rapidamente por meio de busca textual pelo nome do restaurante e filtros por culinária e cidade.

Durante o alinhamento arquitetural, foram identificados os seguintes requisitos:
1. **Insensibilidade a Acentos e Caixa Alta/Baixa**: No idioma português, termos de busca frequentemente omitam ou incluam acentuação de forma inconsistente (ex: "cafe" vs "café", "brasilia" vs "Brasília"). Uma busca restrita a `ILIKE` não atende plenamente à tolerância de acentos sem a extensão `unaccent`.
2. **Filtros Flexíveis de Culinária e Cidade**: Permitir correspondência parcial (`contains`) para que o usuário não precise digitar a nomenclatura exata.
3. **Controle de Carga e Concorrência no Mobile**: Disparar buscas a cada caractere pressionado no teclado mobile provocaria rajadas desnecessárias de requisições HTTP (race conditions e desperdício de banda). Faz-se imperativo o uso de debounce temporal (400ms).
4. **Resiliência e Feedback Visual**: Estado vazio dedicado quando uma busca ativa não retornar resultados ("Nenhum resultado encontrado para '[termo]'"), diferenciando-se da ausência global de restaurantes.

---

## 2. Decisão Arquitetural

1. **Habilitação da Extensão `unaccent` no PostgreSQL**:
   - Criada migration SQL dedicada: `CREATE EXTENSION IF NOT EXISTS unaccent;`.
   - Na API, o serviço utiliza `unaccent` para transformar o termo e o campo `name` na consulta SQL de correspondência textual, assegurando que "cafe" encontre "Café Bistrô".
   - Mantido fallback transparente para `contains` com `mode: 'insensitive'` caso o ambiente de execução ou teste não disponha da extensão.

2. **Filtros Combinados e Paginação Preservada**:
   - Os parâmetros `search`, `cuisine` e `city` são recebidos como query params opcionais no endpoint `GET /restaurants`.
   - A paginação (`page` e `limit`) opera de maneira coesa sobre o conjunto filtrado, retornando o `total` e `totalPages` reais da busca.

3. **Debounce e Estado Reativo no Frontend**:
   - Implementado debounce de 400ms na entrada de busca do hook móvel `useRestaurantList`, reiniciando a paginação para a página 1 automaticamente a cada nova consulta.
   - Componentes visuais dedicados: `SearchBar` (com botão de limpeza rápida), `CuisineFilterChips` (para filtros rápidos com 1 toque) e `SearchEmptyState` com ação para limpar filtros.

---

## 3. Consequências e Trade-offs

### Benefícios
- **Experiência de Busca Humanizada**: O usuário encontra estabelecimentos mesmo cometendo pequenas omissões de acentuação ou usando termos parciais.
- **Eficiência de Rede**: O debounce de 400ms reduz drasticamente as requisições transitórias enviadas à API enquanto o usuário digita.
- **Transparência**: Separação clara entre feed padrão e estado de busca ativa com tags de filtros.
