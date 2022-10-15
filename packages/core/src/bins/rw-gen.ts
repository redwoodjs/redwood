#!/usr/bin/env node
import { createRequire } from 'module'

const requireFromInternal = createRequire(
  require.resolve('@redwoodjs/internal/package.json')
)

const bins = requireFromInternal('./package.json')['bin']

const { run } = requireFromInternal(bins['rw-gen'])

run()
