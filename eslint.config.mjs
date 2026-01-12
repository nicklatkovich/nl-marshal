import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import prettier from 'eslint-config-prettier';
import eslintPluginPrettier from 'eslint-plugin-prettier';
import importPlugin from 'eslint-plugin-import';
import prettierConfig from './.prettierrc.json' with { type: 'json' };

export default [
  js.configs.recommended,
  ...tseslint.configs.recommended,
  prettier,
  {
    files: ['**/*.ts'],
    languageOptions: { ecmaVersion: 2020 },
    plugins: {
      prettier: eslintPluginPrettier,
      import: importPlugin,
    },
    settings: { 'import/resolver': { typescript: {} } },
    rules: {
      ...importPlugin.configs.recommended.rules,
      'prettier/prettier': ['error', prettierConfig],
      'no-multi-spaces': 'error',
      'no-unneeded-ternary': 'error',
      'no-useless-return': 'error',
      '@typescript-eslint/no-namespace': ['error', { allowDeclarations: true }],
      'arrow-body-style': ['error', 'as-needed'],
      'prefer-const': 'error',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    },
  },
];
