import {
  build,
  defaultBuildOptions,
  defaultIgnorePatterns,
} from '../../buildDefaults.mjs'

await build({
  entryPointOptions: {
    ignore: [...defaultIgnorePatterns, './src/bin.ts'],
  },
})

await build({
  buildOptions: {
    ...defaultBuildOptions,
    banner: {
      js: '#!/usr/bin/env node',
    },
    bundle: true,
    entryPoints: ['./src/bin.ts'],
    packages: 'external',
  },
  metafileName: 'meta.bin.json',
})
