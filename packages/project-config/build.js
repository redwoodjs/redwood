/* eslint-disable import/no-extraneous-dependencies */

import * as esbuild from 'esbuild'

const optiions = {
  entryPoints: ['./src/index.ts'],
  outdir: 'dist',

  platform: 'node',
  target: ['node20'],
  bundle: true,
  packages: 'external',

  logLevel: 'info',
  metafile: true,
}

await esbuild.build({
  ...optiions,
  format: 'esm',
  outExtension: { '.js': '.mjs' },
})

await esbuild.build({
  ...optiions,
  format: 'cjs',
  outExtension: { '.js': '.cjs' },
})
