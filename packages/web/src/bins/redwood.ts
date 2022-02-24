#!/usr/bin/env node
import { createRequire } from 'module'

const requireFromCli = createRequire(
  require.resolve('@redwoodjs/cli/package.json')
)

const bins = requireFromCli('./package.json')['bin']

process.chdir('../')
requireFromCli(bins['redwood'])
