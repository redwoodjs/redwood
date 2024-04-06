import { build, defaultBuildOptions } from '@redwoodjs/framework-tools'

// ESM build
await build({
  buildOptions: {
    ...defaultBuildOptions,
    tsconfig: 'tsconfig.build.json',
    format: 'esm',
    outExtension: { '.js': '.mjs' },
    packages: 'external',
  },
})

// CJS build
await build({
  buildOptions: {
    ...defaultBuildOptions,
    tsconfig: 'tsconfig.build.json',
    outExtension: { '.js': '.cjs' },
    packages: 'external',
  },
})
