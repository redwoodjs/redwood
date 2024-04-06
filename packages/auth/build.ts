import { renameSync, writeFileSync } from 'node:fs'

import { build, defaultBuildOptions } from '@redwoodjs/framework-tools'

// ESM build
await build({
  buildOptions: {
    ...defaultBuildOptions,
    tsconfig: 'tsconfig.build.json',
    format: 'esm',
    outdir: 'dist/esm',
    packages: 'external',
  },
})

// CJS build
await build({
  buildOptions: {
    ...defaultBuildOptions,
    tsconfig: 'tsconfig.build.json',
    packages: 'external',
  },
})

renameSync('dist/index.js', 'dist/index.cjs')
writeFileSync('dist/package.json', JSON.stringify({ type: 'commonjs' }))
writeFileSync('dist/esm/package.json', JSON.stringify({ type: 'module' }))
