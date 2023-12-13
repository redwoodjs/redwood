import fs from 'node:fs/promises'

import * as esbuild from 'esbuild'
import fg from 'fast-glob'

// ─── Package ─────────────────────────────────────────────────────────────────
//
// Types don't need to be transformed by esbuild, and the bin is bundled later.

const sourceFiles = await fg.glob(['./src/**/*.ts'], {
  ignore: ['./src/__tests__', './src/types.ts', './src/bin.ts'],
})

let result = await esbuild.build({
  entryPoints: sourceFiles,
  outdir: 'dist',

  format: 'cjs',
  platform: 'node',
  target: ['node18'],

  logLevel: 'info',

  // For visualizing the bundle.
  // See https://esbuild.github.io/api/#metafile and https://esbuild.github.io/analyze/.
  metafile: true,
})

await fs.writeFile('meta.json', JSON.stringify(result.metafile, null, 2))

// ─── Bin ─────────────────────────────────────────────────────────────────────
//
// We build the bin differently because it doesn't have to asynchronously import the handler.

result = await esbuild.build({
  entryPoints: ['./src/bin.ts'],
  outdir: 'dist',

  banner: {
    js: '#!/usr/bin/env node',
  },

  bundle: true,
  minify: true,

  platform: 'node',
  target: ['node18'],
  packages: 'external',

  logLevel: 'info',

  // For visualizing the bundle.
  // See https://esbuild.github.io/api/#metafile and https://esbuild.github.io/analyze/.
  metafile: true,
})

await fs.writeFile('meta.bins.json', JSON.stringify(result.metafile, null, 2))
