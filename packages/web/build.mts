import { writeFileSync } from 'node:fs'

import {
  build,
  defaultBuildOptions,
  defaultIgnorePatterns,
} from '@redwoodjs/framework-tools'

// ESM build
// await build({
//   entryPointOptions: {
//     ignore: [...defaultIgnorePatterns, 'src/entry/**'],
//   },
//   buildOptions: {
//     ...defaultBuildOptions,
//     // ⭐ No special tsconfig here
//     // tsconfig: 'tsconfig.build.json',
//     format: 'esm',
//     packages: 'external',
//   },
// })

// CJS build
await build({
  entryPointOptions: {
    ignore: [...defaultIgnorePatterns, 'src/entry/**', 'src/bins/**'],
  },
  buildOptions: {
    ...defaultBuildOptions,
    // ⭐ No special tsconfig here
    // outdir: 'dist/cjs', DONT DO THIS JUST YET
    outdir: 'dist',
    packages: 'external',
  },
})

// DONT DO THIS YET
// // Place a package.json file with `type: commonjs` in the dist folder so that
// // all .js files are treated as CommonJS files.
// writeFileSync('dist/cjs/package.json', JSON.stringify({ type: 'commonjs' }))

// // Place a package.json file with `type: module` in the dist/esm folder so that
// // all .js files are treated as ES Module files.
// writeFileSync('dist/package.json', JSON.stringify({ type: 'module' }))
