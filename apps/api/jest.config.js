/** @type {import('jest').Config} */
module.exports = {
  rootDir: '.',
  testMatch: ['**/*.spec.ts'],
  testEnvironment: 'node',
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        tsconfig: 'tsconfig.spec.json',
      },
    ],
  },
  moduleNameMapper: {
    '^@vs/shared$': '<rootDir>/../../packages/shared/src/index.ts',
    '^@vs/shared/(.*)$': '<rootDir>/../../packages/shared/src/$1',
    '^@vs/db$': '<rootDir>/../../packages/db/src/index.ts',
    '^@vs/db/(.*)$': '<rootDir>/../../packages/db/src/$1',
    '^@vs/emails$': '<rootDir>/../../packages/emails/src/index.ts',
    '^@app/(.*)$': '<rootDir>/src/$1',
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  setupFiles: ['<rootDir>/test/setup.ts'],
  testPathIgnorePatterns: ['/node_modules/', '/dist/'],
};
