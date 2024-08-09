import { defineConfig, configDefaults } from 'vitest/config'

export default defineConfig({
  test: {
    testTimeout: 15_000,
    include: ['**/__tests__/**/*.test.[jt]s'],
    exclude: [...configDefaults.exclude, '**/fixtures', '**/dist'],
  },
})
