import { configDefaults, defineWorkspace } from 'vitest/config'

export default defineWorkspace([
  {
    test: {
      name: 'regular',
      testTimeout: 15_000,
      include: ['**/__tests__/**/*.[jt]s?(x)', '**/*.test.[jt]s?(x)'],
      exclude: [
        ...configDefaults.exclude,
        '**/fixtures',
        '**/dist',
        '**/__typetests__',
      ],
    },
  },
  {
    test: {
      name: 'typetests',
      include: [],
      typecheck: {
        enabled: true,
        include: ['**/__typetests__/**/*test.ts'],
        exclude: [...configDefaults.exclude, '**/fixtures', '**/dist'],
      },
    },
  },
])
