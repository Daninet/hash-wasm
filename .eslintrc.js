module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  plugins: [
    '@typescript-eslint',
  ],
  extends: [
    'airbnb',
    'plugin:@typescript-eslint/eslint-recommended',
    'plugin:@typescript-eslint/recommended',
  ],
  rules: {
    '@typescript-eslint/explicit-function-return-type': 'off',
    'import/no-unresolved': 'off',
    'import/extensions': 'off',
    '@typescript-eslint/no-explicit-any': 'off',
    'no-param-reassign': 'off',
    'no-plusplus': ['error', { allowForLoopAfterthoughts: true }],
    '@typescript-eslint/no-empty-function': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    'no-await-in-loop': 'off',
    'default-case': 'off',
    'import/prefer-default-export': 'off',
    'function-paren-newline': 'off',
  },
  ignorePatterns: [
    'benchmark/node_modules/',
  ],
};
