import { defineConfig, configDefaults } from 'vitest/config'
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  test: {
    exclude: [...configDefaults.exclude, '**/fixtures'],
    deps: {
      interopDefault: false,
    },
    globalSetup: ['vitest.setup.mts'],
    alias: {
      // We alias prisma client, so that it doesn't interfere with other packages in the mono repo
      '@prisma/client': path.resolve(__dirname, 'src/__tests__/prisma-client'),
    },
  },

})
