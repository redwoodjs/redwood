import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    logHeapUsage: true,
    setupFiles: ['./vitest.setup.mts'],
    // This makes the test suites run in series
    // which is necessary because we are starting and stopping servers
    // at the same host and port between test cases.
    pool: 'threads',
    poolOptions: {
      threads: {
        singleThread: true,
      },
    },
  },
})
