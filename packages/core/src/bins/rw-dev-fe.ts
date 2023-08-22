#!/usr/bin/env node
import { createRequire } from 'node:module'

const requireFromRwVite = createRequire(
  require.resolve('@redwoodjs/vite/package.json')
)

const bins = requireFromRwVite('./package.json')['bin']

requireFromRwVite(bins['rw-dev-fe'])
