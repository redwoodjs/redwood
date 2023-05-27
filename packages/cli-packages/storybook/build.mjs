import fs from 'node:fs'

import * as esbuild from 'esbuild'
import fg from 'fast-glob'

// Get source files
const sourceBinFiles = fg.sync(['./src/bins/**/*.ts'])
const sourceFiles = fg
  .sync(['./src/**/*.ts'])
  .filter((f) => !sourceBinFiles.includes(f))

// Build bin files, we need to insert the shebang in this case
await esbuild.build({
  entryPoints: sourceBinFiles,
  format: 'cjs',
  platform: 'node',
  target: ['node18'],
  outdir: 'dist/bins',
  logLevel: 'info',
  banner: {
    js: '#!/usr/bin/env node',
  },
})

// Build general source files
const result = await esbuild.build({
  entryPoints: sourceFiles,
  format: 'cjs',
  platform: 'node',
  target: ['node18'],
  outdir: 'dist',
  logLevel: 'info',

  // For visualizing the bundle.
  // See https://esbuild.github.io/api/#metafile and https://esbuild.github.io/analyze/.
  metafile: true,
})

fs.writeFileSync('meta.json', JSON.stringify(result.metafile))
