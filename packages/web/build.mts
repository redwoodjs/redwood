// import { writeFileSync } from 'node:fs'

import {
  build,
  defaultBuildOptions,
  defaultIgnorePatterns,
} from '@redwoodjs/framework-tools'

// CJS build
await build({
  entryPointOptions: {
    // @NOTE: I'm not building src/entry, it's included in "files" in package.json
    // this used to be for custom-web-index.
    ignore: [...defaultIgnorePatterns, 'src/entry/**'],
  },
  buildOptions: {
    ...defaultBuildOptions,
    // ⭐ No special tsconfig here
    // outdir: 'dist/cjs', DONT DO THIS JUST YET
    outdir: 'dist',
    packages: 'external',
  },
})

// THIS IS IN PART 2 ~ making this a dual module

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

// // Place a package.json file with `type: commonjs` in the dist folder so that
// // all .js files are treated as CommonJS files.
// writeFileSync('dist/cjs/package.json', JSON.stringify({ type: 'commonjs' }))

// // Place a package.json file with `type: module` in the dist/esm folder so that
// // all .js files are treated as ES Module files.
// writeFileSync('dist/package.json', JSON.stringify({ type: 'module' }))
