import { build, defaultBuildOptions } from './src/buildDefaults'

const options = {
  ...defaultBuildOptions,
  bundle: true,
  entryPoints: ['./src/buildDefaults.ts'],
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
