#!/usr/bin/env node
import { createRequire } from 'node:module'

const requireFromCrossEnv = createRequire(
  require.resolve('cross-env/package.json')
)

const bins = requireFromCrossEnv('./package.json')['bin']

requireFromCrossEnv(`./${bins['cross-env']}`)
