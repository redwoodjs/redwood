import { build, defaultBuildOptions } from '@redwoodjs/framework-tools'

// ESM build
await build({
  buildOptions: {
    ...defaultBuildOptions,
    format: 'esm',
    outExtension: { '.js': '.mjs' },
    packages: 'external',
  },
})

// CJS build
await build({
  buildOptions: {
    ...defaultBuildOptions,
    outExtension: { '.js': '.cjs' },
    packages: 'external',
  },
})
