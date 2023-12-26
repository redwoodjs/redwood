#!/usr/bin/env node
import { createRequire } from 'module'

const requireFromWebServer = createRequire(
  require.resolve('@redwoodjs/web-server/package.json')
)

const bins = requireFromWebServer('./package.json')['bin']

requireFromWebServer(bins['rw-web-server'])
