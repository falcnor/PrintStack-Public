import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import reactPlugin from 'eslint-plugin-react';
import importPlugin from 'eslint-plugin-import';

export default [
  {
    ignores: [
      'backup/**',
      'test-data.js',
      'deploy/**',
      'script.js',
      'dist/**',
      'build/**',
      'coverage/**',
      'node_modules/**',
      '.vite/**',
      '*.config.js',
      '*.config.cjs',
      '*.config.mjs'
    ]
  },
  js.configs.recommended,
  {
    files: ['**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: {
          jsx: true
        }
      }
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
      react: reactPlugin,
      import: importPlugin
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true }
      ],
      // React specific
      'react/jsx-uses-react': 'error',
      'react/jsx-uses-vars': 'error',
      'react/jsx-key': 'error',
      'react/jsx-no-duplicate-props': 'error',
      'react/jsx-no-undef': 'error',
      'react/no-children-prop': 'error',
      'react/no-danger-with-children': 'error',
      'react/no-direct-mutation-state': 'error',
      'react/no-find-dom-node': 'error',
      'react/no-is-mounted': 'error',
      'react/no-render-return-value': 'error',
      'react/no-string-refs': 'error',
      'react/no-unescaped-entities': 'error',
      'react/no-unknown-property': 'error',
      'react/no-unsafe': 'warn',
      'react/require-render-return': 'error',

      // Import/Export
      'import/order': [
        'error',
        {
          groups: [
            'builtin',
            'external',
            'internal',
            'parent',
            'sibling',
            'index'
          ],
          'newlines-between': 'always',
          alphabetize: {
            order: 'asc',
            caseInsensitive: true
          }
        }
      ],
      'import/newline-after-import': 'error',
      'import/no-amd': 'error',
      'import/no-commonjs': 'error',
      'import/no-duplicates': 'error',
      'import/no-dynamic-require': 'warn',
      'import/no-extraneous-dependencies': 'error',
      'import/no-mutable-exports': 'error',
      'import/no-nodejs-modules': 'warn',
      'import/no-self-import': 'error',
      'import/no-unresolved': 'error',

      // General
      'no-console': 'warn',
      'no-debugger': 'error',
      'no-alert': 'warn',
      'no-var': 'error',
      'prefer-const': 'error',
      'prefer-arrow-callback': 'warn',
      'prefer-template': 'warn',
      'prefer-destructuring': 'warn',
      'object-shorthand': 'warn',
      'arrow-spacing': 'error',
      'block-spacing': 'error',
      'brace-style': ['error', '1tbs'],
      'comma-dangle': ['error', 'never'],
      'comma-spacing': 'error',
      'comma-style': 'error',
      'computed-property-spacing': 'error',
      'consistent-return': 'warn',
      'dot-location': ['error', 'property'],
      indent: ['error', 2, { SwitchCase: 1 }],
      'key-spacing': 'error',
      'keyword-spacing': 'error',
      'lines-around-comment': 'warn',
      'newline-per-chained-call': 'warn',
      'no-array-constructor': 'error',
      'no-lonely-if': 'error',
      'no-mixed-operators': 'warn',
      'no-mixed-spaces-and-tabs': 'error',
      'no-multiple-empty-lines': 'warn',
      'no-nested-ternary': 'warn',
      'no-new-object': 'error',
      'no-spaced-func': 'error',
      'no-trailing-spaces': 'error',
      'no-underscore-dangle': 'warn',
      'no-unneeded-ternary': 'warn',
      'no-whitespace-before-property': 'error',
      'object-curly-spacing': ['error', 'always'],
      'one-var': ['error', 'never'],
      'one-var-declaration-per-line': ['error', 'always'],
      'operator-assignment': 'warn',
      'operator-linebreak': 'error',
      'padded-blocks': ['error', 'never'],
      'quote-props': ['error', 'as-needed'],
      quotes: ['error', 'single'],
      semi: ['error', 'always'],
      'semi-spacing': 'error',
      'sort-imports': 'off', // Using import/order instead
      'space-before-blocks': 'error',
      'space-before-function-paren': ['error', 'never'],
      'space-in-parens': 'error',
      'space-infix-ops': 'error',
      'space-unary-ops': 'error',
      'spaced-comment': 'warn'
    },
    settings: {
      react: {
        version: 'detect'
      },
      'import/resolver': {
        node: {
          extensions: ['.js', '.jsx', '.ts', '.tsx']
        }
      }
    }
  }
];
