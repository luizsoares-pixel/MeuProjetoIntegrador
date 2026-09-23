# ADR 0014 — Refinamento Estrutural de UI/UX, Acessibilidade Assistiva e Separação Arquitetural de Telas

**Data:** 2026-09-23  
**Status:** Aceito  
**Autor:** Equipe ADS-PI-II Menu Digital  
**Issue Relacionada:** [Issue #76](https://github.com/CAMPUSCEUB/ADS-PI-II-MenuDigital/issues/76)  
**Pull Request Relacionada:** [PR #89](https://github.com/CAMPUSCEUB/ADS-PI-II-MenuDigital/pull/89)  

---

## Contexto

Após auditoria técnica global de interface no aplicativo móvel (`apps/mobile` — Expo SDK 57, React Native 0.86, Expo Router e Reanimated), foram constatados débitos críticos de usabilidade móvel, ergonomia, acessibilidade e redundância na experiência do usuário:

1. **Obstrução de Teclado no Fluxo de Autenticação:** As telas de Login, Cadastro, Recuperação e Redefinição de Senha utilizavam paddings fixos superiores (`paddingTop: 120`) sem `KeyboardAvoidingView` e sem `ScrollView`, fazendo com que a abertura do teclado virtual cobrisse inputs e o botão de submissão, impedindo o envio do formulário.
2. **Quebra de Safe Area em Entalhes:** O layout raiz possuía uma `View` com altura estática fixa de `20px` e não estava encapsulado por `<SafeAreaProvider>`, gerando colisões visuais com a *Dynamic Island* (iOS) e entalhes de câmeras (*Notches*) no Android.
3. **Alvos de Toque Inadequados e Contraste Baixo:** Elementos clicáveis (botões de fechar, ordenação, badges de filtro) possuíam áreas de toque inferiores a 44x44pt, violando o critério WCAG 2.5.8 e as diretrizes Apple Human Interface Guidelines (HIG). No botão de submissão de login, o contraste de cor não atendia ao critério WCAG AAA (7:1).
4. **Poluição Auditiva em Leitores de Tela (TalkBack / VoiceOver):** Ícones puramente decorativos em cards e inputs eram anunciados desnecessariamente por softwares assistivos.
5. **Memory Leak Potencial com Dimensions:** O uso de `Dimensions.get('window').width` no escopo global de arquivos impedia a atualização correta em rotações de tela e violava as regras dos hooks do React.
6. **Redundância de Telas (Home vs. Buscar):** A tela inicial (`app/(tabs)/home.tsx`) duplicava o feed vertical longo e filtros da tela de busca (`app/(tabs)/buscar.tsx`), gerando sobreposição conceitual e desperdício da vitrine inicial de descoberta.

---

## Decisões

### 1. Governança Global de Safe Area e Ergonomia de Formulários

* **Provedor Raiz Seguro:** Em `app/_layout.tsx`, removeu-se a `View` fixa de 20px e encapsulou-se toda a árvore de componentes com `<SafeAreaProvider>`.
* **Fluxo de Teclado Resiliente:** Nas telas `login.tsx`, `cadastro.tsx`, `recuperar-senha.tsx` e `redefinir-senha.tsx`:
  * Implementação de `<KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>`.
  * Envolvimento dos inputs em `<ScrollView keyboardShouldPersistTaps="handled">`, permitindo que o usuário dispense o teclado com toques fora do campo e acione o botão de envio sem necessidade de dois cliques (*double tap*).
  * Centralização via Flexbox responsivo substituindo paddings hardcoded.

### 2. Acessibilidade Assistiva e Métricas WCAG / Apple HIG

* **Área Mínima de Toque (Touch Target 44x44pt):** Adicionou-se `hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}` em botões de fechar, filtros, favoritos e ações interativas (`FilterModal`, `RestaurantPreviewCard`, `SearchBar`, `InteractiveMap`).
* **Contraste de Cores:** Ajustou-se a cor de texto do botão principal de login para `colors.accent.gold` (`#E5A93C`), atingindo razão de contraste superior a 7:1 sobre o fundo Dark Wine, atendendo ao nível WCAG AAA.
* **Supressão Auditiva de Elementos Decorativos:** Em ícones que servem apenas como adornos visuais, aplicou-se a combinação padrão para React Native moderno:
  ```tsx
  accessible={false}
  importantForAccessibility="no"
  aria-hidden={true}
  ```
  Isso elimina ruídos no TalkBack (Android) e VoiceOver (iOS), permitindo que o leitor foque estritamente em textos e botões com valor semântico.

### 3. Responsividade Dinâmica e Regras de Hooks

* **Escopo Interno de Dimensões:** Em `app/restaurante/[id].tsx`, a chamada estática `Dimensions.get('window').width` foi migrada para o hook nativo `useWindowDimensions()`, estritamente posicionado dentro do corpo funcional do componente React, respeitando as *Rules of Hooks* e reagindo com precisão a mudanças de orientação ou redimensionamento de janela.
* **Componente `Input` Desacoplado:** Unificou-se o componente `components/Input.tsx` com suporte opcional à prop `label` estilizada em Glassmorphism escuro (`rgba(47, 0, 0, 0.95)`), colapsando espaços vazios quando omitida para não gerar layout shifts em telas de busca ou modais.

### 4. Separação Arquitetural de Telas: Vitrine de Descoberta vs. Busca Profunda

Para eliminar a redundância de UX entre as abas principais:
* **Home (`app/(tabs)/home.tsx` — Vitrine de Descoberta):**
  * Transforma-se em um espaço focado em novidades, exploração rápida e destaques editoriais.
  * Composta por carrosséis horizontais temáticos ("Mais Bem Avaliados", "Perto de Você", "Destaques Gastronômicos").
  * Barra de busca rápida que redireciona de forma natural para a aba de busca aprofundada ao receber foco.
* **Buscar (`app/(tabs)/buscar.tsx` — Exploração Profunda):**
  * Centraliza o feed vertical paginado completo com paginação infinita.
  * Interface completa com `FilterModal` (filtros combinados de preço, nota mínima, raio em km e aberto agora) e ordenação multicritério (`sortBy`).
* **Favoritos Integrados:** O card flutuante do mapa (`RestaurantPreviewCard`) e o feed passaram a consumir diretamente o `FavoritesContext` com `FavoriteButton`, permitindo favoritar estabelecimentos instantaneamente.
* **Controle de Acesso (RBAC) no Perfil:** A tela de perfil (`app/(tabs)/perfil.tsx`) foi envolvida em `ScrollView` e exibe o botão "MEU RESTAURANTE: EDITAR PERFIL" de forma estritamente condicional ao papel do usuário autenticado (`user.role === 'restaurant'`), sem requisições HTTP redundantes.

---

## Consequências

### Positivas
* **Ergonomia e Conversão:** Fim das falhas em que o teclado bloqueava o cadastro e login de usuários e proprietários de restaurantes.
* **Conformidade com Padrões de Acessibilidade:** Respeito integral às diretrizes WCAG 2.5.8 e Apple HIG, oferecendo uma aplicação inclusiva para usuários com leitores de tela assistivos.
* **Consistência Visual (Design System):** Fundo Dark Wine padronizado em todas as telas, modais e cartões, mantendo identidade visual coesa.
* **Prevenção de Regressões e Crashes:** Hook de dimensões devidamente encapsulado no ciclo de renderização e Safe Area gerenciada de ponta a ponta sem valores mágicos de pixels.
* **Clareza de Fluxo de Usuário:** Diferenciação funcional evidente entre "Descobrir" na Home e "Filtrar / Pesquisar" na aba Buscar.

### Neutras / Mitigações
* Aumenta ligeiramente a árvore de componentes em formulários devido à injeção de `KeyboardAvoidingView` e `ScrollView`, compensado por uma performance estável a 60 FPS com a suite completa de 152 testes e linters 100% verdes.
