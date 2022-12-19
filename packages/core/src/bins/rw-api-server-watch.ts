#!/usr/bin/env node
import { createRequire } from 'module'

const requireFromApiServer = createRequire(
  require.resolve('@redwoodjs/api-server/package.json')
)

const bins = requireFromApiServer('./package.json')['bin']

requireFromApiServer(bins['rw-api-server-watch'])
