# ADR 0012 — Cardápio Digital por Categorias e Fotos (HU11)

**Data:** 2026-09-17  
**Status:** Aceito  
**Autor:** Equipe ADS-PI-II Menu Digital  
**Issue:** [#56 — Requisito: Cardápio Digital com Categorias e Fotos — HU11](https://github.com/CAMPUSCEUB/ADS-PI-II-MenuDigital/issues/56)

---

## Contexto

A História de Usuário 11 (HU11) estabelece: *"Como usuário, quero navegar pelo cardápio do restaurante organizado por categorias e com fotos em alta resolução, para decidir o que pedir antes de ir."*

Até então, o sistema não possuía entidade de cardápio no banco de dados, necessitando da criação do modelo relacional, contratos compartilhados no monorepo, regras de proteção de acesso e tela com agrupamento de seções e navegação rápida no aplicativo móvel.

---

## Decisões

### 1. Modelo Relacional menu_items no Prisma

Foi criada a entidade MenuItem vinculada à tabela estaurants:
* Chave estrangeira estaurantId com deleção em cascata (onDelete: Cascade).
* Campos: category, 
ame, description (opcional), price (Decimal 10,2), photoUrl (opcional), vailable (boolean com default 	rue).
* Índice composto @@index([restaurantId, category]) para otimizar consultas filtradas e agrupadas por estabelecimento e categoria.

### 2. Controle de Autorização Baseado em Papel e Vínculo de Posse

Para prevenir que usuários comuns ou gestores de outros estabelecimentos alterem o cardápio de terceiros:
* Métodos de mutação (POST /restaurants/:id/menu, PATCH /menu-items/:id, DELETE /menu-items/:id) exigem autenticação via token JWT Supabase.
* Validação ssertOwner: exige simultaneamente que o ator autenticado possua papel de restaurante (ole === "restaurant") e que seu identificador coincida com o ownerId do restaurante proprietário do item. Violações retornam status 403 Forbidden.
* A listagem de cardápio (GET /restaurants/:id/menu) é pública e acessível por qualquer usuário da plataforma.

### 3. Contratos Compartilhados (Contract-First com Zod)

Definidos em @menu-digital/contracts:
* createMenuItemSchema: valida campos obrigatórios, formatação de URL de imagem e impede valores de preço negativos.
* updateMenuItemSchema: permite atualização parcial dos atributos, exigindo pelo menos um campo modificado.
* MenuItemResponse: padroniza o tipo de retorno entre o backend Express e o cliente Expo.

### 4. Interface Mobile com SectionList e Barra Sticky de Categorias

* Rota dedicada: pps/mobile/app/restaurante/[id]/cardapio.tsx, acionada a partir do botão "Ver Cardápio" (HU10).
* Agrupamento automático dos itens em seções por categoria (Map<string, MenuItemResponse[]>).
* Barra horizontal de abas fixada no topo (categoryBarContainer), permitindo rolagem fluida e navegação rápida (scrollToCategory) sem sair do campo visual do usuário.
* Estabilidade do React Native garantida via useRef para onViewableItemsChanged e iewabilityConfig, prevenindo exceções de invariante durante a rolagem.
* Carregamento de fotos com expo-image (cache híbrido memória/disco, prioridade reduzida e placeholders) para economia de banda móvel.
* Identificação clara de pratos indisponíveis com redução de opacidade e aviso visual ESGOTADO.
* Estado vazio informativo quando o restaurante não possui itens cadastrados.

### 5. Coleta de Imagens no App via Expo Image Picker

* Adição da dependência expo-image-picker no app mobile.
* Opções nativas para "Tirar foto" (câmera) e "Galeria" em editar-perfil-restaurante.tsx com solicitação assíncrona de permissões do sistema operacional.

---

## Consequências

### Positivas
* Atendimento integral aos critérios de aceitação da HU11 e alinhamento com a arquitetura monorepo existente.
* Separação clara de responsabilidades entre API e App através dos contratos Zod.
* Navegação otimizada com abas de categoria acessíveis e carregamento resiliente de imagens.

### Limitações e Débitos Técnicos Identificados
* **Armazenamento de Imagens**: O expo-image-picker gera URIs locais do dispositivo (ile:// ou ph://). Para persistência em múltiplos dispositivos, uma issue futura deve acoplar o upload de binários ao bucket do Supabase Storage antes da persistência no banco.
