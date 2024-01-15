import type { Config } from 'jest'

const config: Config = {
  projects: [
    {
      displayName: 'root',
      testMatch: ['**/__tests__/**/*.[jt]s?(x)', '**/*.test.[jt]s?(x)'],
      testPathIgnorePatterns: [
        '__fixtures__',
        '__testfixtures__',
        '__codemod_tests__',
        '__tests__/utils/*',
        '__tests__/fixtures/*',
        '.d.ts',
        'dist',
      ],
      moduleNameMapper: {
        '^src/(.*)': '<rootDir>/src/$1',
      },
      setupFilesAfterEnv: ['./jest.setup.js'],
    },
    {
      displayName: 'setup codemods',
      testMatch: ['**/commands/setup/**/__codemod_tests__/*.ts'],
      testPathIgnorePatterns: [
        '__fixtures__',
        '__testfixtures__',
        '__tests__/utils/*',
        '__tests__/fixtures/*',
        '.d.ts',
        'dist',
      ],
      setupFilesAfterEnv: ['./src/jest.codemods.setup.ts'],
    },
  ],
  testTimeout: 20_000,
}

export default config
