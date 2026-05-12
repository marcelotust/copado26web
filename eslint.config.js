// Flat config replacing the old .eslintrc.cjs.
// ESLint v9 only loads this format; the legacy file is left in place for
// older tooling but is ignored at runtime.

import js from '@eslint/js'
import globals from 'globals'
import react from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'
import tseslint from 'typescript-eslint'

export default tseslint.config(
  { ignores: ['dist', 'node_modules', 'public', '*.config.js', 'supabase/'] },

  // Base: JS + TS recommended rules apply to everything in src/
  {
    files: ['src/**/*.{ts,tsx,js,jsx}'],
    extends: [
      js.configs.recommended,
      ...tseslint.configs.recommended,
    ],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: { ...globals.browser, ...globals.es2022 },
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
    },
    settings: { react: { version: '18.3' } },
    plugins: {
      react,
      'react-hooks': reactHooks,
    },
    rules: {
      // React
      ...react.configs.recommended.rules,
      ...react.configs['jsx-runtime'].rules,
      'react/prop-types': 'off',
      'react/self-closing-comp': 'warn',
      'react/no-array-index-key': 'warn',
      // Allow small stateless helper components co-located with their parent
      'react/no-multi-comp': ['warn', { ignoreStateless: true }],

      // Hooks
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',

      // Size guardrails (kept from .eslintrc.cjs)
      'max-lines': ['warn', { max: 280, skipBlankLines: true, skipComments: true }],
      'max-lines-per-function': ['warn', { max: 160, skipBlankLines: true, skipComments: true }],

      // Cleanliness
      'no-unused-vars': 'off', // delegated to @typescript-eslint/no-unused-vars below
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      'no-console': ['warn', { allow: ['warn', 'error', 'info'] }],
      'no-var': 'error',
      'prefer-const': 'error',
      eqeqeq: ['error', 'always'],
      'no-duplicate-imports': 'error',
      'no-multiple-empty-lines': ['error', { max: 1, maxEOF: 0 }],

      // TS specifics: relax a couple that would force premature refactors
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/ban-ts-comment': 'warn',
    },
  },
)
