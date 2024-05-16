import { build, defaultBuildOptions } from '@redwoodjs/framework-tools'

// Build 'dist/bins'
await build({
  buildOptions: {
    ...defaultBuildOptions,
    entryPoints: ['src/bins/*'],
    outdir: 'dist/bins',
  },
  metafileName: 'meta.bins.json',
})

// Build 'config'
await build({
  buildOptions: {
    ...defaultBuildOptions,
    entryPoints: ['src/config/*'],
    outdir: 'config',
  },
  metafileName: 'meta.config.json',
})
