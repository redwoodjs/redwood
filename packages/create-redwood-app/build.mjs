import fs from 'node:fs'

import * as esbuild from 'esbuild'

const result = await esbuild.build({
  entryPoints: ['src/create-redwood-app.js'],
  outfile: 'dist/create-redwood-app.js',

  bundle: true,
  minify: true,

  platform: 'node',
  target: ['node20'],
  packages: 'external',

  logLevel: 'info',

  // For visualizing the bundle.
  // See https://esbuild.github.io/api/#metafile and https://esbuild.github.io/analyze/.
  metafile: true,
})

fs.writeFileSync('meta.json', JSON.stringify(result.metafile))
