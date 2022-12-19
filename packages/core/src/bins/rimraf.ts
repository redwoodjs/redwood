#!/usr/bin/env node
import { createRequire } from 'module'

const requireFromRimraf = createRequire(require.resolve('rimraf/package.json'))

const bin = requireFromRimraf('./package.json')['bin']

requireFromRimraf(bin)
