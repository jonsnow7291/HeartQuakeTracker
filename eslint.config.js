const tsParser = require('@typescript-eslint/parser');
const tsPlugin = require('@typescript-eslint/eslint-plugin');

module.exports = [
  { ignores: ['src/ui/**', 'design/**', 'preview/**', 'node_modules/**', 'dist/**', 'coverage/**', 'android/**', 'ios/**', 'server/dist/**'] },
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: { parser: tsParser, parserOptions: { ecmaVersion: 2020, sourceType: 'module' } },
    plugins: { '@typescript-eslint': tsPlugin },
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    },
  },
  // Mocks (escritos antes de este linter): avisos, no errores.
  {
    files: ['src/core/mocks/**/*.ts'],
    rules: { '@typescript-eslint/no-explicit-any': 'warn', '@typescript-eslint/no-unused-vars': 'warn' },
  },
  // Fronteras: contracts es solo tipos y no depende de nada.
  {
    files: ['src/contracts/**/*.ts'],
    rules: {
      'no-restricted-imports': ['error', { patterns: [
        { group: ['**/core/**', '**/ui/**', '@core/*', '@ui/*'], message: 'contracts no puede importar core ni ui' },
      ] }],
    },
  },
  // core no importa UI.
  {
    files: ['src/core/**/*.ts'],
    rules: {
      'no-restricted-imports': ['error', { patterns: [
        { group: ['**/ui/**', '@ui/*'], message: 'core no puede importar ui' },
      ] }],
    },
  },
  // ui (Santiago) solo importa contracts, nunca core (excepto el container vía hook acordado).
  {
    files: ['src/ui/**/*.ts', 'src/ui/**/*.tsx'],
    rules: {
      'no-restricted-imports': ['error', { patterns: [
        { group: ['**/core/**', '@core/*'], message: 'ui usa src/contracts (y useServices); no importa src/core' },
      ] }],
    },
  },
];
