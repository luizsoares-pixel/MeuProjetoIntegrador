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
    },
  },
  {
    ignores: ['dist/*'],
  },
]);

