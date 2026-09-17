# ADR 0009: Ordenação dos Resultados de Restaurantes (HU8)

- **Status**: Aceito
- **Data**: 2026-09-17
- **Decisores**: Equipe de Desenvolvimento ADS-PI-II / Issue #53
- **Vínculos**: Issue #53, HU8, Extensão da HU5, HU6 e HU7, Sprint #3

---

## 1. Contexto do Problema

A HU8 estabelece:
> *"Como usuário, quero ordenar os resultados, para priorizar o que é mais relevante para mim."*

Após a implementação da listagem paginada (HU5), busca textual (HU6) e filtros avançados (HU7), a aplicação necessita fornecer ao usuário o controle explícito sobre a ordenação dos resultados, suportando múltiplos critérios:
1. `distance`: Ordenação por proximidade geográfica (menor distância primeiro).
2. `rating`: Ordenação pela avaliação média dos usuários (maior nota primeiro).
3. `priceAsc`: Ordenação por faixa de preço crescente (`$` Econômico $\rightarrow$ `$$$` Sofisticado).
4. `priceDesc`: Ordenação por faixa de preço decrescente (`$$$` Sofisticado $\rightarrow$ `$` Econômico).

### Desafios Técnicos Identificados
1. **Dependência de Geolocalização**:
   - Para ordenar por distância (`sortBy=distance`), é estritamente obrigatório que a API possua a posição do usuário (`lat` e `lng`). Caso ausente, a API deve retornar erro semântico HTTP 400 Bad Request, prevenindo falhas silenciosas ou cálculos arbitrários.
2. **Combinação com Filtros Ativos**:
   - A ordenação deve ser aplicada após ou em conjunto com todos os filtros já suportados (`search`, `cuisine`, `city`, `priceRange`, `minRating`, `maxDistance`, `openNow`), mantendo a integridade da paginação (`page`, `limit`, `total`, `hasMore`).
3. **Tratamento de Valores Nulos e Empates**:
   - Restaurantes sem avaliação (`rating: null`) devem aparecer ao final da ordenação por nota.
   - Restaurantes sem faixa de preço (`priceRange: null`) devem aparecer ao final das ordenações por preço.
   - O critério de desempate determinístico deve ser a data de criação decrescente (`createdAt: "desc"`).
4. **Experiência do Usuário e Persistência no Mobile**:
   - O usuário deve poder alternar a ordenação tanto no modal de filtros quanto por meio de um seletor visual na listagem.
   - A ordenação selecionada deve ser persistida (`@react-native-async-storage/async-storage`) para que, ao navegar entre a tela Home e a tela de Busca (ou reiniciar a sessão), a preferência do usuário seja preservada.
   - A ordenação padrão deve ser `distance` caso a geolocalização esteja autorizada e disponível; caso contrário, `rating`.

---

## 2. Decisão Arquitetural

### 2.1 Contratos Compartilhados (`packages/contracts`)
- Exportar o enum e tipo:
  ```typescript
  export const restaurantSortByEnum = z.enum(["distance", "rating", "priceAsc", "priceDesc"]);
  export type RestaurantSortBy = z.infer<typeof restaurantSortByEnum>;
  ```
- Atualizar `listRestaurantsQuerySchema`:
  - Campo opcional `sortBy` validado contra os 4 valores permitidos.
  - Regra no `superRefine`:
    ```typescript
    if (data.sortBy === "distance" && (data.lat === undefined || data.lng === undefined)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Os parâmetros 'lat' e 'lng' são obrigatórios quando 'sortBy=distance' for informado.",
        path: ["sortBy"],
      });
    }
    ```

### 2.2 Backend (`apps/api`)
- `RestaurantService.list`:
  - Se `sortBy === "distance"`, o cálculo de distâncias via fórmula de Haversine (`haversineDistance`) é realizado para todos os candidatos qualificados pelos filtros de banco, ordenando os resultados de forma crescente por `distanceInMeters`.
  - Se `sortBy === "rating"`, ordena descrescente por nota, com valores nulos alocados no fim da lista.
  - Se `sortBy === "priceAsc"` ou `sortBy === "priceDesc"`, utiliza os pesos ordinais dos níveis de preço (`CHEAP` = 1, `MODERATE` = 2, `EXPENSIVE` = 3), posicionando registros nulos ao final.
  - Quando filtros em memória (`openNow`, `maxDistance` ou `sortBy === "distance"`) estão ativos, a ordenação e fatia paginada são aplicadas após a filtragem em memória.
  - Quando nenhum filtro em memória estiver ativo e `sortBy` for `rating`, `priceAsc` ou `priceDesc`, a ordenação pode ser delegada diretamente ao PostgreSQL através da cláusula `orderBy` do Prisma com `nulls: "last"`.

### 2.3 Frontend Móvel (`apps/mobile`)
- **Módulo de Preferência de Ordenação (`hooks/useSortPreference.ts`)**:
  - Armazena a preferência de ordenação no `AsyncStorage` (`@menu-digital:sort_by`).
  - Carrega a preferência salva ou adota o padrão: `distance` se o usuário conceder permissão de localização, senão `rating`.
- **Interface com o Usuário**:
  - Inclusão da seção "Ordenar por" em `FilterModal.tsx` com chips de seleção.
  - Componente seletor rápido `SortSelector.tsx` acessível no cabeçalho das telas `home.tsx` e `buscar.tsx`.
  - Desabilita a opção `distance` caso a permissão de GPS tenha sido negada pelo usuário.

---

## 3. Consequências e Trade-offs

### Benefícios
- **Autonomia do Usuário**: Facilita encontrar restaurantes pelo critério mais conveniente (mais baratos, mais próximos ou mais bem avaliados).
- **Consistência Cross-Platform**: Contratos unificados garantem que qualquer chamada HTTP sem as coordenadas obrigatórias para `distance` receba um erro 400 claro e amigável.
- **Continuidade de Navegação**: A persistência via `AsyncStorage` evita que o usuário precise reconfigurar a ordenação ao alternar abas no app.

### Mitigações
- **Custos Computacionais de Distância**: Mantido o filtro preliminar de bounding box quando houver `maxDistance` delimitando o raio.
