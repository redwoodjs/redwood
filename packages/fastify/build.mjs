import * as esbuild from 'esbuild'

await esbuild.build({
  entryPoints: [
    'src/api.ts',
    'src/config.ts',
    'src/graphql.ts',
    'src/index.ts',
    'src/types.ts',
    'src/web.ts',
    'src/lambda/index.ts',
    'src/plugins/withApiProxy.ts',
  ],
  outdir: 'dist',

  format: 'cjs',
  platform: 'node',
  target: ['node20'],

  logLevel: 'info',
})
