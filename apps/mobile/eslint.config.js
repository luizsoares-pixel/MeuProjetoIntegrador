// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    rules: {
      // Desabilitadas: dependem do eslint-import-resolver-typescript /
      // unrs-resolver (binding nativo) que crasham em certas plataformas.
      'import/no-unresolved': 'off',
      'import/namespace': 'off',

      // Rebaixadas para warn: regras do React Compiler que geram
      // falsos-positivos para padrões válidos em Reanimated e React Native.
      // useSharedValue().value é mutável por design; funções async em
      // useEffect são idiomáticas em RN (ex: loadLocation, refetch).
      'react-hooks/immutability': 'warn',
      'react-hooks/set-state-in-effect': 'warn',
    },
  },
  {
    ignores: ['dist/*'],
  },
]);

