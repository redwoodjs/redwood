#!/usr/bin/env node

import { createRequire } from 'node:module'
import { pathToFileURL } from 'node:url'

const cliPackageJsonFileUrl = pathToFileURL(
  require.resolve('@redwoodjs/cli/package.json'),
)

const requireFromCli = createRequire(cliPackageJsonFileUrl)
const bins = requireFromCli('./package.json')['bin']
const cliEntryPointUrl = new URL(bins['rwfw'], cliPackageJsonFileUrl)

import(cliEntryPointUrl.toString())
