# ADR 0011 — Tela de Detalhes do Restaurante (HU10)

**Data:** 2026-09-17
**Status:** Aceito
**Autor:** Equipe ADS-PI-II Menu Digital
**Issue:** [#55 — Requisito: Tela de Detalhes do Restaurante — HU10](https://github.com/CAMPUSCEUB/ADS-PI-II-MenuDigital/issues/55)

---

## Contexto

A HU10 requer uma tela dedicada de detalhes do restaurante, consumindo `GET /restaurants/:id`, exibindo todos os dados cadastrais ampliados do estabelecimento e fornecendo acesso às funcionalidades de rota (HU9) e cardápio (HU11).

A issue depende da ampliação de cadastro (HU de perfil de restaurante, Issue #49), cujos campos já estão disponíveis no modelo Prisma e no `RestaurantResponse` dos contratos compartilhados.

---

## Decisões

### 1. Reaproveitamento da rota existente `restaurante/[id].tsx`

A tela `apps/mobile/app/restaurante/[id].tsx` foi criada durante a HU9 (Issue #54) para exibir o mini-mapa e a rota OSRM. A decisão foi **expandir essa tela** em vez de criar uma nova rota, mantendo a consistência do Expo Router v6 e evitando fragmentação de estado.

**Motivação:** O `restaurantId` como parâmetro de rota é compartilhado entre HU10 (exibição) e HU9 (rota). Uma única tela unifica ambas as responsabilidades sem duplicação de chamada à API.

### 2. Galeria de fotos horizontal com paginação (FlatList)

A galeria combina a `imageUrl` (foto de capa) com a `photos[]` (galeria adicional), eliminando duplicatas. O componente `FlatList` horizontal paginado com `pagingEnabled` é utilizado para que cada foto ocupe a largura total da tela, seguindo o padrão de produto de apps de restaurante.

**Alternativa descartada:** `ScrollView` horizontal — não fornece comportamento de paginação fluida sem lógica adicional.

### 3. Horários por dia com destaque do dia atual

O horário de funcionamento (`businessHours`) é um JSON estruturado por dia da semana com múltiplos turnos. A tela identifica o dia corrente via `new Date().getDay()` e aplica destaque visual (fundo âmbar translúcido + texto dourado) à linha do dia atual, informando o usuário diretamente sobre o horário de hoje.

### 4. Botão de Cardápio (HU11) como CTA primário

O botão "Ver Cardápio" é o CTA (Call-to-Action) primário da tela e navega para a rota `/restaurante/:id/cardapio`. Esta rota será implementada na Issue #56 (HU11). A navegação é definida agora para garantir a arquitetura correta mesmo antes da tela de cardápio existir — ao pressionar, o Expo Router emitirá um aviso de rota não encontrada, sem crash.

### 5. Ações de contato (telefone e WhatsApp)

O telefone é exibido como link tocável que abre o discador nativo via `Linking.openURL("tel:...")`. O botão WhatsApp navega para `https://wa.me/55{phone}`, usando o DDI do Brasil por padrão. Não há internacionalização planejada para esta sprint.

### 6. Tratamento diferenciado de 404 vs. erro genérico

A tela distingue dois estados de erro:
- **404 (restaurante não encontrado):** ícone de loja removida, mensagem específica "Restaurante não encontrado", sem botão de retry (pois a re-tentativa com o mesmo ID resultará no mesmo 404).
- **Erro genérico de rede:** ícone de alerta, mensagem do erro, botão "Voltar".

A distinção é feita inspecionando se a mensagem de erro contém `"404"` ou `"não encontrado"`.

### 7. Mapa estático do restaurante sem rota calculada

Quando a localização do usuário está disponível mas a rota ainda não foi calculada, ou quando a rota falha silenciosamente, a tela exibe um mapa estático apenas com o marcador do restaurante. Isso garante que a localização geográfica do estabelecimento seja sempre visível, independentemente da disponibilidade do OSRM.

---

## Consequências

### Positivas
- Tela única e coesa que atende HU9 + HU10, reduzindo navegação desnecessária.
- Galeria de fotos com carrossel nativo e indicadores de página.
- Horário de funcionamento sempre legível com destaque do dia atual.
- Botão de cardápio pronto para integração com HU11 (Issue #56).
- Tratamento de erro com distinção clara entre 404 e falha de rede.

### Negativas / Riscos
- A rota `/restaurante/:id/cardapio` ainda não existe — pressionar o botão de cardápio resultará em aviso de rota não encontrada até a implementação da HU11.
- `Linking.openURL` para WhatsApp pressupõe número brasileiro (DDI 55). Restaurantes internacionais (fora do escopo atual) poderiam precisar de lógica adicional.

---

## Termos Adicionados ao CONTEXT.md

| Termo em Inglês (Código) | Termo em Português (Negócio) | Descrição |
|---|---|---|
| `RestaurantDetailsScreen` | Tela de Detalhes do Restaurante | Tela dedicada que exibe todas as informações de um restaurante, incluindo galeria, horários, formas de pagamento, redes sociais, rota e acesso ao cardápio. |
| `photoGallery` | Galeria de Fotos | Carrossel horizontal de imagens do restaurante composto pela foto de capa e fotos adicionais da entidade `RestaurantPhoto`. |
| `contactActions` | Ações de Contato | Botões de acesso rápido ao telefone (discador nativo) e WhatsApp do restaurante. |
