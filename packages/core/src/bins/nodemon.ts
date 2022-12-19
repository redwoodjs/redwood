#!/usr/bin/env node
import { createRequire } from 'module'

const requireFromNodemon = createRequire(
  require.resolve('nodemon/package.json')
)

const bins = requireFromNodemon('./package.json')['bin']

requireFromNodemon(bins['nodemon'])
