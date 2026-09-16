# ADR 0006: Endpoint Paginado de Restaurantes e Feed Inicial na Tela Home (HU5)

- **Status**: Aceito
- **Data**: 2026-09-16
- **Decisores**: Equipe de Desenvolvimento ADS-PI-II / Issue #50
- **Vínculos**: Issue #50, HU5, Base para Busca, Filtros e Ordenação (Sprint #3)

---

## 1. Contexto do Problema

A HU5 estabelece a necessidade de apresentar um catálogo inicial de restaurantes na tela Home do aplicativo, permitindo que os usuários descubram opções sem precisar realizar buscas manuais ou navegar exclusivamente pelo mapa.

Para viabilizar este fluxo com alta performance e escalabilidade, foram identificadas as seguintes necessidades:
1. Um endpoint público que retorne a lista de estabelecimentos sem exigir autenticação prévia ou coordenadas de GPS obrigatórias (diferente do `GET /restaurants/nearby`).
2. Paginação eficiente (por páginas e limites) para suportar grandes volumes de restaurantes sem sobrecarregar a largura de banda mobile.
3. Exibição rica nos cards contendo foto de capa, nome, tipo de culinária, avaliação média e faixa de preço.
4. Experiência de usuário resiliente no frontend móvel com skeleton loading, pull-to-refresh, rolagem infinita e tratamento de lista vazia e erros de rede.

---

## 2. Decisão Arquitetural

Adotamos as seguintes soluções técnicas:

1. **Modelagem de Avaliação Média (`rating`)**:
   - Adicionamos a coluna `rating Float?` no modelo `Restaurant` do Prisma.
   - Enquanto o módulo completo de comentários/reviews não for introduzido, o campo permite armazenar a média consolidada. Restaurantes sem avaliação mantêm o valor `null`, sendo renderizados na interface com o badge "Novo".

2. **Endpoint REST com Metadados Estruturados (`GET /restaurants?page=&limit=`)**:
   - Aceita `page` (padrão 1, mínimo 1) e `limit` (padrão 10, máximo 50).
   - Retorno estruturado no formato:
     ```json
     {
       "restaurants": [...],
       "pagination": {
         "page": 1,
         "limit": 10,
         "total": 25,
         "totalPages": 3,
         "hasMore": true
       }
     }
     ```
   - A ordenação padrão é por data de cadastro decrescente (`createdAt: 'desc'`), garantindo destaque aos estabelecimentos mais recentes.

3. **Arquitetura Modular no Frontend Mobile (`apps/mobile`)**:
   - Criação do hook customizado `useRestaurantList` para isolar a máquina de estados de paginação (carregamento inicial, carregamento incremental, refresh e controle de concorrência).
   - Componentização estrita no design system: `RestaurantCard`, `RestaurantCardSkeleton`, `RestaurantEmptyState` e `RestaurantErrorState`.
   - Utilização de `FlatList` nativa com `onEndReached` e `RefreshControl` para fluidez a 60fps no React Native.

---

## 3. Consequências e Trade-offs

### Benefícios
- **Desempenho Otimizado**: Carregamento incremental sob demanda evita consumo desnecessário de memória no dispositivo do usuário.
- **Preparação para Sprint #3**: A estrutura de paginação e o hook `useRestaurantList` servem de alicerce imediato para a inclusão de filtros (culinária, preço, horário) e busca textual.
- **Resiliência e Clareza de Feedback**: Estados de loading (skeletons), erro com retry e tela vazia garantem que o usuário nunca fique diante de uma tela congelada ou em branco.

### Mitigações
- Como não há tabela `Review` dedicada ainda, o campo `rating` foi desenhado para ser compatível com futuras agregações automáticas via triggers ou rotinas de serviço na Sprint de Avaliações.
