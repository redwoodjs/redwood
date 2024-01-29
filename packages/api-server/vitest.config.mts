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
  plugins: [
    {
      name: 'virtual-modules',
      resolveId(id) {
        if (id === '/redwood-app/api/server.config.js' || id === '\\redwood-app\\api\\server.config.js')
          return 'virtual:sever.config.js'
      }
    }
  ]
})
