import { build, defaultBuildOptions } from '@redwoodjs/framework-tools'

// CJS build
await build({
  buildOptions: {
    ...defaultBuildOptions,
  },
})

// ESM build
// await build({
//   buildOptions: {
//     ...defaultBuildOptions,
//     format: 'esm',
//   },
// })
