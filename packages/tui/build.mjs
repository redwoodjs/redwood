import fs from 'node:fs'

import * as esbuild from 'esbuild'
import fg from 'fast-glob'

// Get source files
const sourceFiles = fg.sync(['./src/**/*.ts'])

// Since this is a library, there's no bundling going on here by design.
// Instead we plan for this library to be bundled by leaf packages so-to-speak like create-redwood-app.
const result = await esbuild.build({
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

fs.writeFileSync('meta.json', JSON.stringify(result.metafile, undefined, 2))
