import fs from 'node:fs'

import * as esbuild from 'esbuild'
import fg from 'fast-glob'

// Get source files
const sourceFiles = fg.sync(['./src/**/*.ts'])

// Build general source files
const result = await esbuild.build({
  entryPoints: sourceFiles,
  outdir: 'dist',

  format: 'cjs',
  platform: 'node',
  target: ['node18'],

  logLevel: 'info',

  // For visualizing dist.
  // See https://esbuild.github.io/api/#metafile and https://esbuild.github.io/analyze/.
  metafile: true,
})

fs.writeFileSync('meta.json', JSON.stringify(result.metafile, null, 2))
