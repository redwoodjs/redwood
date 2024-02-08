import { build, defaultBuildOptions } from '@redwoodjs/framework-tools'

await build({
  buildOptions: {
    ...defaultBuildOptions,
    bundle: true,
    entryPoints: ['./src/web.ts'],
    packages: 'external',
  },
})
