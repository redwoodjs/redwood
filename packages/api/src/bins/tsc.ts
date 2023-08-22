#!/usr/bin/env node
import { createRequire } from 'node:module'

const requireFromTypeScript = createRequire(
  require.resolve('typescript/package.json')
)

const bins = requireFromTypeScript('./package.json')['bin']

requireFromTypeScript(bins['tsc'])
