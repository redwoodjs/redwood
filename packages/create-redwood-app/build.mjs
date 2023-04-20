import fs from 'node:fs'

import * as esbuild from 'esbuild'

// There's minimal bundling going on here by design. Only "src/create-redwood-app.js" and "src/telemetry.js"
// are bundled into a single "dist/create-redwood-app.js" file.
// As we audit more of this package's dependencies, we'll remove them from a handcrafted "external" list,
// instead of using the catch-all `packages: 'external'` option.
const result = await esbuild.build({
  entryPoints: ['src/create-redwood-app.js'],
  bundle: true,
  platform: 'node',
  target: ['node18'],
  outfile: 'dist/create-redwood-app.js',
  minify: true,

  // For visualizing the bundle.
  // See https://esbuild.github.io/api/#metafile and https://esbuild.github.io/analyze/.
  metafile: true,
})

fs.writeFileSync('meta.json', JSON.stringify(result.metafile))
