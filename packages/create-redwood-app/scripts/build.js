/* eslint-env node */

import * as esbuild from 'esbuild'
import fs from 'fs-extra'

const jsBanner = `\
#!/usr/bin/env node

const require = (await import("node:module")).createRequire(import.meta.url);
const __filename = (await import("node:url")).fileURLToPath(import.meta.url);
const __dirname = (await import("node:path")).dirname(__filename);
`

const result = await esbuild.build({
  entryPoints: ['src/create-redwood-app.js'],
  outdir: 'dist',

  platform: 'node',
  target: ['node20'],
  format: 'esm',
  bundle: true,
  banner: {
    js: jsBanner,
  },

  minify: true,

  logLevel: 'info',
  metafile: true,
})

await fs.writeJSON(new URL('./meta.json', import.meta.url), result.metafile, {
  spaces: 2,
})
