// eslint.config.mjs
import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import nextPlugin from '@next/eslint-plugin-next';




export default [
  js.configs.recommended,
  ...tseslint.configs.recommended,
  nextPlugin.configs['core-web-vitals'],
  {
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@next/next/no-img-element': 'off',
      'jsx-a11y/alt-text': 'off',
    },
  },
];
