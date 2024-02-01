import { build, defaultBuildOptions } from '@redwoodjs/framework-tools'

const options = {
  ...defaultBuildOptions,
  bundle: true,
  entryPoints: ['./src/index.ts'],
  packages: 'external',
}

// ESM build.
await build({
  buildOptions: {
    ...options,
    format: 'esm',
    outExtension: { '.js': '.mjs' },
  },
})

// CJS build.
await build({
  buildOptions: {
    ...options,
    outExtension: { '.js': '.cjs' },
  },
})
