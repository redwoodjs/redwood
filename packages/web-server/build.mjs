import fs from 'node:fs'

import * as esbuild from 'esbuild'
import fg from 'fast-glob'

const sourceFiles = fg.sync(['./src/**/*.ts'], { ignore: ['./src/__tests__'] })

const result = await esbuild.build({
  entryPoints: sourceFiles,
  outdir: 'dist',

  format: 'cjs',
  platform: 'node',
  target: ['node20'],

  logLevel: 'info',

  // For visualizing dist.
  // See https://esbuild.github.io/api/#metafile and https://esbuild.github.io/analyze/.
  metafile: true,
})

fs.writeFileSync('meta.json', JSON.stringify(result.metafile, null, 2))
