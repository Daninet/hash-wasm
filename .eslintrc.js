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
    'no-plusplus': ["error", { "allowForLoopAfterthoughts": true }],
    '@typescript-eslint/no-empty-function': 'off',
    'no-await-in-loop': 'off',
  },
  ignorePatterns: [
    'benchmark/node_modules/',
  ]
};
