import js from '@eslint/js';
import globals from 'globals';

export default [
  { ignores: ['node_modules/**', 'server/discipline.sqlite', 'dist/**'] },
  js.configs.recommended,
  {
    files: ['**/*.js'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: { ...globals.node, ...globals.browser }
    },
    rules: { 'no-unused-vars': ['error', { argsIgnorePattern: '^_' }] }
  }
];
