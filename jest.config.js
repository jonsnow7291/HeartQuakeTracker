module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  passWithNoTests: true,
  roots: ['<rootDir>/__tests__/core'],
  moduleNameMapper: { '^@contracts/(.*)$': '<rootDir>/src/contracts/$1', '^@core/(.*)$': '<rootDir>/src/core/$1' },
};
