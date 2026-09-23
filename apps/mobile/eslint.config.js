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

      // Desabilitadas no React Native: Reanimated muta .value por design
      // e os hooks do React Compiler v5 geram falsos-positivos em mobile.
      'react-hooks/immutability': 'off',
      'react-hooks/set-state-in-effect': 'warn',
      'react-hooks/refs': 'warn',


    },
  },
  {
    ignores: ['dist/*'],
  },
]);

