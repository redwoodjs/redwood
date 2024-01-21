import { defineWorkspace, configDefaults } from 'vitest/config'

export default defineWorkspace([
  // {
  //   extends: './vitest.config.mts',
  //   test: {
  //     name: 'root',
  //     include: ['**/__tests__/**/*.[jt]s?(x)', '**/*.test.[jt]s?(x)'],
  //     exclude: [
  //       ...configDefaults.exclude,
  //       '__fixtures__',
  //       '__testfixtures__',
  //       '**/__codemod_tests__',
  //       '__tests__/utils/*',
  //       '**/__tests__/fixtures/**/*',
  //       '.d.ts',
  //       'dist',
  //     ],
  //     // moduleNameMapper: {
  //     //   '^src/(.*)': '<rootDir>/src/$1',
  //     // },
  //     alias: {
  //       '^src/(.*)': '<rootDir>/src/$1',
  //     },
  //     // setupFilesAfterEnv: ['./jest.setup.js'],
  //     setupFiles: ['./vitest.setup.mts'],
  //   },
  // },
  {
    extends: './vitest.config.mts',
    test: {
      name: 'setup codemods',
      include: ['**/commands/setup/**/__codemod_tests__/*.ts'],
      exclude: [
        ...configDefaults.exclude,
        '__fixtures__',
        '__testfixtures__',
        '__tests__/utils/*',
        '__tests__/fixtures/*',
        '.d.ts',
        'dist',
      ],
      setupFiles: ['./src/vitest.codemods.setup.ts'],
      pool: 'forks',
    },
  },
])
