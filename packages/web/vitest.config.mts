import { defineConfig, configDefaults } from 'vitest/config'

import { babel } from '@rollup/plugin-babel'

export default defineConfig({
  test: {
    exclude: [...configDefaults.exclude, '**/fixtures', '**/__typetests__'],
    environment: 'jsdom',
    setupFiles: ['vitest.setup.mts'],
  },
  define: {
    RWJS_ENV: {},
  },
})


