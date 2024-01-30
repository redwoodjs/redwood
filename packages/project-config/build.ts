import { build, defaultBuildOptions } from '../../buildDefaults.mjs'

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
