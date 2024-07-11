import {
  build,
  defaultBuildOptions,
  defaultIgnorePatterns,
} from '@redwoodjs/framework-tools'
import { writeFileSync } from 'node:fs'

// CJS build
/**
 * Notes:
 * - we don't build the webpack entry point in CJS, because it produces a double wrapped module
 * instead we use the ESM version (see ./webpackEntry in package.json). The double wrapping happens
 * when you set type: module in package.json, and occurs on the App & Routes import from the project.
 * - we build bins in CJS, until projects fully switch to ESM (or we produce .mts files) this is probably
 * the better option
 */
await build({
  entryPointOptions: {
    ignore: [...defaultIgnorePatterns, 'src/__typetests__/**', 'src/entry/**'],
  },
  buildOptions: {
    ...defaultBuildOptions,
    // ⭐ No special build tsconfig in this package
    outdir: 'dist/cjs',
    packages: 'external',
  },
})

// ESM build
await build({
  entryPointOptions: {
    // @NOTE: building the cjs bins only...
    // I haven't tried esm bins yet...
    ignore: [...defaultIgnorePatterns, 'src/bins/**', 'src/__typetests__/**'],
  },
  buildOptions: {
    ...defaultBuildOptions,
    // ⭐ No special build tsconfig in this package
    format: 'esm',
    packages: 'external',
  },
})

// Place a package.json file with `type: commonjs` in the dist folder so that
// all .js files are treated as CommonJS files.
writeFileSync('dist/cjs/package.json', JSON.stringify({ type: 'commonjs' }))

// Place a package.json file with `type: module` in the dist/esm folder so that
// all .js files are treated as ES Module files.
writeFileSync('dist/package.json', JSON.stringify({ type: 'module' }))
