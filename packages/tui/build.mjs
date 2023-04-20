// See https://esbuild.github.io/getting-started/#bundling-for-node.

import fs from 'node:fs'

import * as esbuild from 'esbuild'

const result = await esbuild.build({
  entryPoints: ['src/index.ts'],
  format: 'cjs',
  platform: 'node',
  target: ['node18'],
  outfile: 'dist/index.js',

  // See https://esbuild.github.io/api/#metafile.
  metafile: true,
})

// See https://esbuild.github.io/analyze/.
fs.writeFileSync('meta.json', JSON.stringify(result.metafile))
