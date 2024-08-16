import { defineConfig, configDefaults } from 'vitest/config'

export default defineConfig({
  test: {
    exclude: [...configDefaults.exclude, '**/fixtures'],
    env: {
      WEBHOOK_SECRET: 'MY_VOICE_IS_MY_PASSPORT_VERIFY_ME',
    },
    setupFiles: ['vitest.setup.mts'],
  },
})
