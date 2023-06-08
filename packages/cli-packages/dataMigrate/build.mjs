import fs from 'node:fs'

import * as esbuild from 'esbuild'
import fg from 'fast-glob'

// Get source files. Types don't need to be transformed, and bins are bundled lattransformed,
// and bins are bundled later.
const sourceFiles = fg.sync(['./src/**/*.ts'], {
  ignore: ['./src/types.ts', './src/bins'],
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

fs.writeFileSync('srcMeta.json', JSON.stringify(result.metafile, null, 2))

result = await esbuild.build({
  entryPoints: ['./src/bins/up.ts'],
  outdir: 'dist/bins',

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

fs.writeFileSync('binMeta.json', JSON.stringify(result.metafile, null, 2))
