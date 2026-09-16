# ADR 0005: Modelagem e Arquitetura para Ampliação de Dados do Perfil de Restaurante

- **Status**: Aceito
- **Data**: 2026-09-16
- **Decisores**: Equipe de Desenvolvimento ADS-PI-II / Issue #49
- **Vínculos**: Issue #49, Extensão da HU4, Preparação para Filtros (Sprint #3) e Detalhes/Cardápio (Sprint #4)

---

## 1. Contexto do Problema

O cadastro inicial de restaurante (HU4, Sprint #2) foi concebido com atributos mínimos: nome, endereço em texto único, tipo de culinária e coordenadas geográficas (latitude/longitude).

Entretanto, as demandas subsequentes do produto (busca com filtros avançados na Sprint #3 e exibição rica de cardápio e detalhes do local na Sprint #4) exigem atributos essenciais de operação, identificação e contato que até então inexistiam no modelo `Restaurant`:
1. Validação formal de CNPJ único e telefone de atendimento/WhatsApp.
2. Descrição detalhada do local com controle de caracteres.
3. Classificação de faixa de preço (`$`, `$$`, `$$$`) para filtros de orçamento.
4. Horários de funcionamento com suporte a múltiplos turnos diários (ex: almoço e jantar).
5. Formas de pagamento aceitas para filtros de conveniência (Pix, cartões, dinheiro).
6. Galeria de fotos adicionais além da imagem de capa.
7. Endereço formalmente estruturado (logradouro, número, bairro, cidade, UF, CEP).

---

## 2. Decisão Arquitetural

Adotamos as seguintes diretrizes técnicas alinhadas aos contratos e ao PostgreSQL/Prisma:

1. **Modelagem de Dados no Prisma (`schema.prisma`)**:
   - **Enums Nativos**:
     - `PriceRange`: com mapeamento `@map("$")`, `@map("$$")`, `@map("$$$")` para expressividade de negócio.
     - `PaymentMethod`: `PIX`, `CREDIT_CARD`, `DEBIT_CARD`, `CASH`, `MEAL_VOUCHER`.
   - **Colunas no Model `Restaurant`**:
     - `description String?`
     - `priceRange PriceRange? @map("price_range")`
     - `businessHours Json? @map("business_hours")` (JSON estruturado validado via Zod por dia da semana com array de turnos `[{ open: "HH:mm", close: "HH:mm" }]`).
     - `paymentMethods PaymentMethod[] @default([]) @map("payment_methods")` (Array escalar nativo do PostgreSQL).
     - `socialLinks Json? @map("social_links")` (JSON opcional com perfis sociais).
     - **Endereço Estruturado**: colunas diretas (`street`, `number`, `complement`, `neighborhood`, `city`, `state`, `postalCode`), preservando a coluna unificada `address` para retrocompatibilidade com telas existentes e geolocalização.
   - **Galeria de Fotos (1:N)**:
     - Criação da tabela `RestaurantPhoto` (`id`, `restaurantId`, `url`, `order`, `createdAt`), com exclusão em cascata (`onDelete: Cascade`).

2. **Abordagem Contract-First (`@menu-digital/contracts`)**:
   - Definição dos schemas Zod (`priceRangeSchema`, `paymentMethodSchema`, `businessHoursSchema`, `socialLinksSchema`, `updateRestaurantProfileSchema`).
   - Todos os tipos inferidos via `z.infer`.

3. **Endpoints de Perfil na API (`apps/api`)**:
   - `GET /restaurants/me`: recupera o restaurante do usuário logado (com fotos inclusas).
   - `PUT /restaurants/me`: atualiza todos os campos de perfil do restaurante pertencente ao usuário autenticado, com verificação de autorização e integridade.
   - Rota existente `POST /restaurants` aceita tanto o conjunto obrigatório inicial quanto os novos campos opcionais.

4. **Interface Mobile (`apps/mobile`)**:
   - Entrada a partir da aba `(tabs)/perfil.tsx` para usuários com permissão/role de restaurante.
   - Nova tela `app/editar-perfil-restaurante.tsx` com seções organizadas, validação via `react-hook-form` + `@hookform/resolvers/zod` e suporte a geocodificação.

---

## 3. Consequências e Trade-offs

### Pontos Positivos
- **Desbloqueio de Features Futuras**: Fornece a infraestrutura de dados necessária para filtros da Sprint #3 e tela de detalhes da Sprint #4.
- **Performance e Simplicidade**: O uso de array nativo `PaymentMethod[]` no PostgreSQL dispensa tabelas associativas N:N desnecessárias, tornando consultas e agregações rápidas.
- **Flexibilidade com `businessHours` em JSON**: Permite turnos complexos (fechado em dias específicos, horário corrido ou bipartido) sem engessar a base relacional com dezenas de colunas booleanas.
- **Retrocompatibilidade**: Manutenção da coluna `address` e de campos opcionais evita quebras em registros preexistentes.

### Pontos de Atenção
- Requer migração estruturada no banco de dados e execução de `npm run prisma:generate` e `npm run build:contracts`.
- No mobile, formulários extensos demandam boa divisão visual e scroll para manter usabilidade em telas menores.
