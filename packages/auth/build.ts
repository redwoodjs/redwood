import { renameSync, writeFileSync } from 'node:fs'

import { build, defaultBuildOptions } from '@redwoodjs/framework-tools'

// ESM build
await build({
  buildOptions: {
    ...defaultBuildOptions,
    tsconfig: 'tsconfig.build-esm.json',
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

// Because the package.json files has `type: module` the CJS entry file can't
// be named `index.js` because in that case it would be treated as an ESM file.
// By changing it to .cjs it will be treated as a CommonJS file.
renameSync('dist/index.js', 'dist/index.cjs')

// Place a package.json file with `type: commonjs` in the dist folder so that
// all .js files are treated as CommonJS files.
writeFileSync('dist/package.json', JSON.stringify({ type: 'commonjs' }))

// Place a package.json file with `type: module` in the dist/esm folder so that
// all .js files are treated as ES Module files.
writeFileSync('dist/esm/package.json', JSON.stringify({ type: 'module' }))
