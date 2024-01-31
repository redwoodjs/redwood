import { build, defaultBuildOptions } from './src/buildDefaults'

// ESM build.
await build({
  buildOptions: {
    ...defaultBuildOptions,
    entryPoints: ['./src/buildDefaults.ts'],
    packages: 'external',
    format: 'esm',
    outExtension: { '.js': '.mjs' },
  },
})
