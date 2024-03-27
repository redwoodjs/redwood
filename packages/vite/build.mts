import { build, defaultIgnorePatterns } from '@redwoodjs/framework-tools'

import * as esbuild from 'esbuild'

await build({
  entryPointOptions: {
    ignore: [...defaultIgnorePatterns, '**/bundled'],
  }
})

// We bundle some react packages with the "react-server" condition
// so that we don't need to specify it at runtime.

await esbuild.build({
  entryPoints: ['src/bundled/*'],
  outdir: 'dist/bundled',

  bundle: true,
  conditions: ['react-server'],
  platform: 'node',
  target: ['node20'],

  logLevel: 'info',
})
