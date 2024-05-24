#!/usr/bin/env node
/* eslint-env node */

import { rimraf } from 'rimraf'
import { $ } from 'zx'

await $`yarn clean:prisma`

await rimraf('packages/**/dist', {
  glob: {
    ignore: 'packages/**/{fixtures,__fixtures__}/**/dist',
  },
})

// Remove all `tsconfig.tsbuildinfo` files.
await rimraf('packages/**/tsconfig.tsbuildinfo', {
  glob: true,
})
// Our dual esm/cjs packages have a `tsconfig.build.tsbuildinfo` file instead of
// `tsconfig.tsbuildinfo` so we need to remove those as well.
await rimraf('packages/**/tsconfig.build.tsbuildinfo', {
  glob: true,
})
