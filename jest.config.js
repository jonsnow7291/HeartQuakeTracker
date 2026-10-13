module.exports = {
  testEnvironment: 'node',
  passWithNoTests: true,
  testMatch: ['**/*.test.ts'],
  roots: ['<rootDir>/__tests__/core'],
  moduleNameMapper: { '^@contracts/(.*)$': '<rootDir>/src/contracts/$1', '^@core/(.*)$': '<rootDir>/src/core/$1' },
  // @noble/* se publica como ESM: se transforma a CommonJS igual que el TypeScript.
  transform: {
    '^.+\\.(ts|js)$': ['ts-jest', { tsconfig: { allowJs: true, module: 'commonjs', target: 'ES2020', esModuleInterop: true, skipLibCheck: true } }],
  },
  transformIgnorePatterns: ['/node_modules/(?!@noble/)'],
};
