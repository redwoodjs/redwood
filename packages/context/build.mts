import { writeFileSync } from 'node:fs'

import { build, defaultBuildOptions } from '@redwoodjs/framework-tools'

// ESM build
await build({
  buildOptions: {
    ...defaultBuildOptions,
    format: 'esm',
  },
})

// CJS build
await build({
  buildOptions: {
    ...defaultBuildOptions,
    outdir: 'dist/cjs',
  },
})

// Place a package.json file with `type: commonjs` in the 'dist/cjs' folder so that
// all files are considered CommonJS modules.
writeFileSync('dist/cjs/package.json', JSON.stringify({ type: 'commonjs' }))
