# Regras de Desenvolvimento Mobile (Expo & React Native)

Este documento estabelece as diretrizes de código e arquitetura para o app mobile em `apps/mobile`.

## 1. Stack e Versões

- **Expo SDK**: ~54.0.35
- **React Native**: 0.81.5
- **React**: 19.1.0
- **Roteamento**: Expo Router v6 (`expo-router/entry`)
- **Mapas**: `react-native-maps` 1.20.1 + `expo-location`
- **Validação e Formulários**: `react-hook-form` + `zod` + `@hookform/resolvers`
- **Animações e Gestos**: `react-native-reanimated` ~4.1.1 + `react-native-gesture-handler`

## 2. Padrões de Roteamento (Expo Router v6)

- Todas as telas devem residir no diretório `apps/mobile/app/`.
- Estrutura de grupos de rotas:
  - `(tabs)/`: Telas principais com navegação por abas inferiores (`home`, `mapa`, `buscar`, `favoritos`, `perfil`).
  - Rotas de fluxo de autenticação na raiz de `app/`: `login.tsx`, `cadastro.tsx`, `recuperar-senha.tsx`, `redefinir-senha.tsx`.
- Sempre utilizar componentes `<Link href="...">` ou o hook `useRouter()` do `expo-router` para navegação.
- Preservar a consistência dos layouts nos arquivos `_layout.tsx` de cada diretório.

## 3. Componentes e Estilização

- **Atomicidade e Reutilização**: Componentes genéricos devem ser mantidos em `apps/mobile/components/` (ex: `Button.tsx`, `Input.tsx`, `ScreenHeader.tsx`, `CustomModal.tsx`).
- **SafeArea**: Sempre respeitar as margens do dispositivo utilizando `SafeAreaView` do `react-native-safe-area-context`.
- **Estilos**:
  - Utilizar `StyleSheet.create` tipado.
  - Consumir as cores, espaçamentos e tipografias padronizadas da pasta `apps/mobile/theme/`.
  - Nunca utilizar dimensões fixas que quebrem em telas de tamanhos diferentes; priorizar flexbox e dimensões relativas.

## 4. Integração com Mapas (`react-native-maps`)

- O componente principal de mapa é `apps/mobile/components/InteractiveMap.tsx`.
- Para suporte Web sem quebra de build, sempre manter a versão alternativa `InteractiveMap.web.tsx`.
- Marcadores de restaurantes devem utilizar `RestaurantPinMarker.tsx` e acionar o card de pré-visualização `RestaurantPreviewCard.tsx`.
- Tratamento obrigatório de permissão de geolocalização com fallback gracioso caso o usuário recuse acesso ao GPS.

## 5. Integração com API e Autenticação

- Nunca expor a chave administrativa `SUPABASE_SERVICE_ROLE_KEY` no client mobile.
- Utilizar apenas a `SUPABASE_ANON_KEY` via `apps/mobile/services/supabase.ts`.
- Chamar a API backend em `apps/mobile/services/api.ts` passando o JWT Bearer token obtido da sessão ativa no `AuthContext.tsx`.
