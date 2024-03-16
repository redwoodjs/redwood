import { build } from '@redwoodjs/framework-tools'

import * as esbuild from 'esbuild'

await build()

// We bundle some react packages with the "react-server" condition
// so that we don't need to specify it at runtime.

await esbuild.build({
  entryPoints: ['prebundled/*'],
  outdir: 'bundled',

  bundle: true,
  conditions: ['react-server'],
  platform: 'node',
  target: ['node20'],

  logLevel: 'info',
})
