#!/usr/bin/env node
/* eslint-env node */

import { rimraf } from 'rimraf'
import { $ } from 'zx'

await $`yarn clean:prisma`

await rimraf('packages/**/dist', {
  glob: {
    ignore: 'packages/**/{fixtures,__fixtures__,node_modules}/**/dist',
  },
})

// Remove all `tsconfig.tsbuildinfo` files.
await rimraf('packages/**/tsconfig.tsbuildinfo', {
  glob: true,
})

await rimraf('packages/**/tsconfig.build.tsbuildinfo', {
  glob: true,
})

await rimraf('packages/**/tsconfig.cjs.tsbuildinfo', {
  glob: true,
})
