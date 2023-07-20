#!/usr/bin/env node
import { createRequire } from 'module'

const requireFromFeServer = createRequire(
  require.resolve('@redwoodjs/web-server/package.json')
)

const bins = requireFromFeServer('./package.json')['bin']

requireFromFeServer(bins['rw-web-server'])
