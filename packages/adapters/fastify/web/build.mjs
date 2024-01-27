import { build, defaultBuildOptions } from '../../../../buildDefaults.mjs'

await build({
  buildOptions: {
    ...defaultBuildOptions,
    bundle: true,
    entryPoints: ['./src/web.ts'],
    packages: 'external',
  },
})
