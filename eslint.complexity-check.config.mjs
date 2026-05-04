import tsParser from '@typescript-eslint/parser';
import sonarjs from 'eslint-plugin-sonarjs';

const COGNITIVE_COMPLEXITY_THRESHOLD = 15;

export default [
  {
    ignores: [
      '**/dist/**',
      '**/*.d.ts',
      '**/*.js',
      'packages/drizzle/test/**',
    ],
  },
  {
    files: ['packages/drizzle/**/*.ts'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
    },
    plugins: {
      sonarjs,
    },
    rules: {
      'sonarjs/cognitive-complexity': [
        'error',
        COGNITIVE_COMPLEXITY_THRESHOLD,
      ],
    },
  },
];
