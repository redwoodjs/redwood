import { build, defaultBuildOptions } from '@redwoodjs/framework-tools'

// ESM build
await build({
  buildOptions: {
    ...defaultBuildOptions,
    bundle: true,
    entryPoints: ['./src/index.ts'],
    format: 'esm',
    outExtension: { '.js': '.mjs' },
    packages: 'external',
  },
})

// CJS build
await build({
  buildOptions: {
    ...defaultBuildOptions,
    bundle: true,
    entryPoints: ['./src/index.ts'],
    outExtension: { '.js': '.cjs' },
    packages: 'external',
  },
})
