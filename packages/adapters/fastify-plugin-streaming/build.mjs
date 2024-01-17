import * as esbuild from 'esbuild'

await esbuild.build({
  entryPoints: ['src/**/*.ts'],
  outdir: 'dist',

  format: 'cjs',
  platform: 'node',
  target: ['node20'],

  logLevel: 'info',
})
