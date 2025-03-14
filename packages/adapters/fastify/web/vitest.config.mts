import { defineConfig, configDefaults } from 'vitest/config'

export default defineConfig({
  test: {
    exclude: [...configDefaults.exclude, '**/__fixtures__'],
    setupFiles: ['vitest.setup.ts'],
  },
})
