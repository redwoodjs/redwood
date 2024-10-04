#!/usr/bin/env node
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const requireFromRwVite = createRequire(
  require.resolve('@redwoodjs/vite/package.json'),
)

console.log('core/src/bins/rw-dev-fe.ts')
console.log('core/src/bins/rw-dev-fe.ts')
console.log('core/src/bins/rw-dev-fe.ts')
console.log('core/src/bins/rw-dev-fe.ts')
console.log('core/src/bins/rw-dev-fe.ts')

const bins = requireFromRwVite('./package.json')['bin']

requireFromRwVite(bins['rw-dev-fe'])
