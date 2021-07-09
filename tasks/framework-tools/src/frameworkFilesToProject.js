#!/usr/bin/env node
/* eslint-env node, es6 */

const path = require('path')

const rimraf = require('rimraf')

const {
  packagesFileList,
  makeCopyPackageFiles,
  linkBinaries,
} = require('./utils')

const projectPath = process.argv?.[2] ?? process.env.RWJS_CWD

if (!projectPath) {
  console.log('Error: Please specify the path to your Redwood Project')
  console.log(`Usage: ${process.argv?.[1]} /path/to/rwjs/proect`)
  process.exit(1)
}

const REDWOOD_PROJECT_NODE_MODULES = path.join(projectPath, 'node_modules')
const copyPackageFiles = makeCopyPackageFiles(REDWOOD_PROJECT_NODE_MODULES)

// Delete existing and copy
try {
  rimraf.sync(path.join(REDWOOD_PROJECT_NODE_MODULES, '@redwoodjs'))

  const packages = packagesFileList()
  console.log('Copying...')
  Object.entries(packages).forEach(copyPackageFiles)

  console.log()
  linkBinaries(REDWOOD_PROJECT_NODE_MODULES)
} catch (e) {
  console.error(e)
  process.exit(1)
}
