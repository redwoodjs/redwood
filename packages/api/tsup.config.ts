import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts'],
  silent: true,
  format: ['cjs', 'esm'],
  outExtension: (ctx) => {
    return { js: `.${ctx.format === 'esm' ? 'mjs' : ctx.format}` }
  },
  sourcemap: true,
  outDir: 'dist',
})
