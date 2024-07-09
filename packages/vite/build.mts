import {
  build,
  defaultBuildOptions,
  defaultIgnorePatterns,
} from '@redwoodjs/framework-tools'

import { writeFileSync } from 'node:fs'

import * as esbuild from 'esbuild'

await build({
  entryPointOptions: {
    ignore: [...defaultIgnorePatterns, '**/bundled'],
  },
  buildOptions: {
    ...defaultBuildOptions,
    // ⭐ No special build tsconfig in this package
    outdir: 'dist/cjs',
    packages: 'external',
  },
})

await build({
  entryPointOptions: {
    ignore: [...defaultIgnorePatterns, '**/bundled'],
  },
  buildOptions: {
    ...defaultBuildOptions,
    // ⭐ No special build tsconfig in this package
    format: 'esm',
    packages: 'external',
  },
})

// We bundle some react packages with the "react-server" condition
// so that we don't need to specify it at runtime.
await esbuild.build({
  entryPoints: ['src/bundled/*'],
  outdir: 'dist/bundled',
  // format: 'esm', // what format do we need???
  bundle: true,
  conditions: ['react-server'],
  platform: 'node',
  target: ['node20'],

  logLevel: 'info',
})

// Place a package.json file with `type: commonjs` in the dist folder so that
// all .js files are treated as CommonJS files.
writeFileSync('dist/cjs/package.json', JSON.stringify({ type: 'commonjs' }))

// Place a package.json file with `type: module` in the dist/esm folder so that
// all .js files are treated as ES Module files.
writeFileSync('dist/package.json', JSON.stringify({ type: 'module' }))
