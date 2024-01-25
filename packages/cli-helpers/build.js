import * as esbuild from 'esbuild'

const options = {
  entryPoints: ['./src/index.ts'],
  outdir: 'dist',

  platform: 'node',
  target: ['node20'],
  bundle: true,
  packages: 'external',

  logLevel: 'info',
  metafile: true,
}

await esbuild.build({
  ...options,
  format: 'esm',
  outExtension: { '.js': '.mjs' },
})

await esbuild.build({
  ...options,
  format: 'cjs',
  outExtension: { '.js': '.cjs' },
})
