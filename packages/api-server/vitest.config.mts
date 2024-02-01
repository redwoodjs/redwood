import { defineConfig, configDefaults } from 'vitest/config'

export default defineConfig({
  test: {
    exclude: [
      ...configDefaults.exclude,
      '**/fixtures',
      // Dist tests are treated differently and not run in the normal test suite
      './dist.test.ts'
    ],
  },
})
