module.exports = {
  roots: [
    '<rootDir>/test',
  ],
  transform: {
    '^.+\\.ts$': ['ts-jest', {
      tsconfig: {
        module: 'CommonJS',
        types: ['node', 'jest'],
      },
    }],
  },
  cacheDirectory: '<rootDir>/.jest-cache',
};
