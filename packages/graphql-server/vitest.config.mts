import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    sequence: {
      hooks: 'list',
    },
    setupFiles: ['./vitest.setup.mts'],
    logHeapUsage: true,
    server: {
      deps: {
        // Read more about why the fallback is needed in the links below:
        // https://github.com/graphql/graphql-js/issues/2801#issuecomment-1758428498
        // https://github.com/vitejs/vite/issues/7879#issuecomment-1356124664
        // https://nodejs.org/docs/latest-v18.x/api/packages.html#dual-package-hazard
        // TODO: Remove this once we're dual-mode building graphql-server
        fallbackCJS: true,
      },
    },
  },
})
