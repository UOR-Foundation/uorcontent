/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src/', '<rootDir>/tests/'],
  testMatch: ['**/*.test.ts'],
  transform: {
    '^.+\\.tsx?$': 'ts-jest',
  },
  moduleNameMapper: {
    '^@core/(.*)$': '<rootDir>/src/core/$1',
    '^@models/(.*)$': '<rootDir>/src/models/$1',
    '^@utils/(.*)$': '<rootDir>/src/utils/$1',
    '^@managers/(.*)$': '<rootDir>/src/managers/$1',
    '^@services/(.*)$': '<rootDir>/src/services/$1',
    '^@server/(.*)$': '<rootDir>/src/server/$1',
    '^@cli/(.*)$': '<rootDir>/src/cli/$1',
    '^@mcp-schema/(.*)$': '<rootDir>/submodules/mcp-schema/src/$1',
    '^@schema-org/(.*)$': '<rootDir>/templates/schemaorg/$1'
  }
};
