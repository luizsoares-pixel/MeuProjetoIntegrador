# CONTEXT: Dicionário de Domínio Ubíquo (Menu Digital)

Este documento centraliza a **linguagem ubíqua** do projeto **Menu-Digital** (CEUB ADS-PI-II). Ele assegura que desenvolvedores, professores e agentes de IA utilizem exatamente os mesmos conceitos e termos para descrever o sistema, eliminando ambiguidades.

---

## 1. Atores do Sistema

* **Cliente / Usuário (`User`)**: Pessoa que utiliza o aplicativo mobile para explorar restaurantes no mapa, consultar cardápios digitais, favoritar itens e realizar pedidos/reservas.
* **Gestor do Restaurante (`Manager / Admin`)**: Responsável por gerenciar os dados do estabelecimento, categorias, pratos, disponibilidade e preços no cardápio.
* **Atendente / Garçom (`Staff`)**: Funcionário responsável por visualizar e atualizar o status de pedidos e comandas de mesas (quando aplicável).

---

## 2. Entidades Principais de Negócio

### Restaurante (`Restaurant`)
* **Definição**: O estabelecimento comercial físico cadastrado na plataforma.
* **Atributos essenciais**:
  * **Identificação**: Nome (`name`), CNPJ validado e único (`cnpj`), telefone/WhatsApp de contato (`phone`), descrição detalhada com limite de caracteres (`description`), tipo de culinária (`cuisineType`), e faixa de preço (`priceRange`: `$`, `$$`, `$$$`).
  * **Localização**: Endereço textual (`address`), coordenadas geográficas (`latitude`, `longitude`) e endereço estruturado (`street`, `number`, `complement`, `neighborhood`, `city`, `state`, `postalCode`).
  * **Operação**: Horários de funcionamento estruturados por dia da semana com múltiplos turnos (`businessHours`), formas de pagamento aceitas (`paymentMethods`) e status (aberto/fechado).
  * **Presença Digital**: Foto de capa (`imageUrl`), galeria de fotos adicionais 1:N (`RestaurantPhoto`), links para redes sociais (`socialLinks`).
* **Representação Visual**: Apresentado no mapa interativo através de um marcador customizado (`RestaurantPinMarker`) e um card de destaque (`RestaurantPreviewCard`).

### Cardápio (`Menu`)
* **Definição**: O catálogo digital completo de produtos oferecidos por um restaurante específico.
* **Relação**: Cada restaurante possui um cardápio ativo, que é dividido em várias categorias.

### Categoria (`Category`)
* **Definição**: O agrupamento temático dos pratos e produtos para navegação do usuário.
* **Exemplos**: *Entradas, Pratos Principais, Bebidas, Sobremesas, Promoções do Dia*.

### Prato / Item do Cardápio (`MenuItem / Dish`)
* **Definição**: O produto individual comercializado.
* **Atributos essenciais**: Nome, descrição, preço unitário, imagem ilustrativa, status de disponibilidade (`is_available`) e informações de restrições alimentares (ex: vegetariano, sem glúten).

### Mesa e Comanda (`Table & Tab`)
* **Definição**:
  * **Mesa**: O ponto físico de atendimento dentro do restaurante (geralmente identificado por número ou QR Code).
  * **Comanda**: A sessão de consumo aberta vinculada a uma mesa ou a um cliente.

### Pedido (`Order`)
* **Definição**: A solicitação formal de itens feita por um cliente.
* **Status do Pedido**:
  1. `PENDING` (Aguardando confirmação da cozinha)
  2. `PREPARING` (Em preparo)
  3. `READY` (Pronto para entrega/retirada)
  4. `DELIVERED` (Entregue)
  5. `CANCELED` (Cancelado)

### Avaliação (`Review`)
* **Definição**: A nota (1 a 5 estrelas) e comentário deixado por um cliente sobre a experiência gastronômica ou atendimento no restaurante.

---

## 3. Glossário Técnico e Regras de Nomenclatura

| Termo em Inglês (Código) | Termo em Português (Negócio) | Descrição |
|---|---|---|
| `signUp` / `signIn` | Cadastro / Login | Fluxos de autenticação integrados com Supabase Auth. |
| `compensatoryTransaction` | Transação Compensatória | Mecanismo que remove usuário no Auth caso falhe a persistência no Prisma. |
| `contracts` | Contratos Compartilhados | Schemas Zod e tipos em `packages/contracts` que regem a comunicação API-Mobile. |
| `RestaurantPin` | Pino de Restaurante | Marcador renderizado no `react-native-maps` com coordenadas geográficas. |
| `DoD` | Definition of Done | Critério de aceite obrigatório para fechamento de sprints no CEUB. |
| `priceRange` | Faixa de Preço | Classificação de preço médio do restaurante em níveis (`$`, `$$`, `$$$`). |
| `businessHours` | Horário de Funcionamento | Objeto estruturado com horários por dia da semana e suporte a múltiplos turnos. |
| `paymentMethods` | Formas de Pagamento | Lista padronizada de formas de pagamento aceitas (PIX, cartões, dinheiro, etc.). |
| `RestaurantPhoto` | Foto do Restaurante | Entidade de relacionamento 1:N que armazena a galeria de imagens secundárias do local. |
| `structuredAddress` | Endereço Estruturado | Decomposição formal de endereço em rua, número, complemento, bairro, cidade, UF e CEP. |
