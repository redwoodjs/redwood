#!/usr/bin/env node
import { createRequire } from 'node:module'

const requireFromWebpack = createRequire(
  require.resolve('webpack/package.json')
)

const bins = requireFromWebpack('./package.json')['bin']

requireFromWebpack(`./${bins['webpack']}`)
