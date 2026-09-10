# ADR 0002: Roteamento Baseado em Arquivos com Expo Router v6 e Animações com Reanimated

- **Status**: Aceito
- **Data**: 2026-09-09
- **Decisores**: Equipe de Desenvolvimento ADS-PI-II

---

## 1. Contexto do Problema

O aplicativo móvel **Menu-Digital** exige uma estrutura de navegação robusta, manutenível e escalável que atenda tanto às necessidades de fluxos autenticados (busca de restaurantes, mapa interativo, perfil, favoritos e visualização de cardápios) quanto aos fluxos de onboarding (login, cadastro, recuperação e redefinição de senha).

Anteriormente, o ecossistema React Native dependia fortemente do `react-navigation` com configuração manual estática de pilhas (`Stack.Navigator`) e abas (`Tab.Navigator`). Isso frequentemente levava a:
- Dificuldade na sincronização do estado de rotas com deep links ou URLs da web.
- Duplicação de código na definição de rotas protegidas vs. públicas.
- Curva de aprendizado e manutenção excessiva de arquivos centrais de rotas à medida que a aplicação cresce.

---

## 2. Decisão Arquitetural

Adotamos o **Expo Router v6** integrado ao **Expo SDK 54** e animações com **React Native Reanimated**:

1. **Roteamento Baseado em Arquivos (File-Based Routing)**:
   - As telas residem no diretório `apps/mobile/app/`, espelhando a estrutura do sistema de arquivos diretamente na árvore de navegação.
   - O ponto de entrada nativo é padronizado via `expo-router/entry`.
2. **Grupos de Rotas e Layouts Aninhados**:
   - `apps/mobile/app/(tabs)/`: Grupo isolado para as telas com navegação por abas inferiores (`home.tsx`, `mapa.tsx`, `buscar.tsx`, `favoritos.tsx`, `perfil.tsx`).
   - `apps/mobile/app/(tabs)/_layout.tsx`: Configuração centralizada da barra de abas (`Tabs`), ícones e comportamento visual unificado.
   - Rotas raiz de autenticação: `login.tsx`, `cadastro.tsx`, `recuperar-senha.tsx`, `redefinir-senha.tsx`.
3. **Navegação Declarativa e Tipada**:
   - Uso de `<Link href="...">` e do hook `useRouter()` do `expo-router` para transições consistentes.
4. **Animações Fluidas com Reanimated**:
   - Uso de `react-native-reanimated` (~4.5) e `react-native-gesture-handler` para transições de tela, cards flutuantes de restaurante e microinterações de interface a 60/120 FPS na thread de UI.

---

## 3. Consequências e Trade-offs

### Pontos Positivos
- **Coesão e Previsibilidade**: Adicionar uma nova tela resume-se a criar um arquivo na pasta correspondente, eliminando boilerplate de configuração de navegadores.
- **Deep Linking e Web Nativos**: Suporte transparente a URLs na web (`expo start --web`) e deep linking em dispositivos físicos sem esforço adicional.
- **Isolamento de Layout**: Layouts compartilhados (cabeçalhos, safe areas, abas) ficam encapsulados em seus respectivos `_layout.tsx`.

### Pontos de Atenção
- Requer disciplina rigorosa de nomenclatura de arquivos e diretórios (ex: parênteses `(tabs)` para não alterar o caminho da URL).
- Dependência do ecossistema Expo e suas convenções de build.
