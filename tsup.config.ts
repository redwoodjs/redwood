import { defineConfig } from 'tsup'

export default defineConfig({
  bundle: false,
  clean: true,
  entry: ['src/**/*.ts', '!src/**/*.test.*'],
  format: 'esm',
  outDir: 'dist',
})
