// packages/ui/eslint.config.mjs
export default [
  {
    files: ['**/*.{ts,tsx,js,jsx}'],
    ignores: ['dist/**', 'node_modules/**'],
    languageOptions: {
      ecmaVersion: 2020,
      sourceType: 'module',
    },
    rules: {
      
    },
  },
];
