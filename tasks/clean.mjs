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
