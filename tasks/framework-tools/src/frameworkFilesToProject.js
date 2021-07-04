#!/usr/bin/env node
/* eslint-env node, es6 */

const fs = require('fs')
const path = require('path')

const rimraf = require('rimraf')
const terminalLink = require('terminal-link')

const {
  packagesFileList,
  redwoodBins,
  REDWOOD_PACKAGES_PATH,
} = require('./utils')

const projectPath = process.argv?.[2] ?? process.env.RWJS_CWD
if (!projectPath) {
  console.log('Error: Please specify the path to your Redwood Project')
  console.log(`Usage: ${process.argv?.[1]} /path/to/rwjs/proect`)
  process.exit(1)
}

// Delete existing files.
const REDWOOD_PROJECT_NODE_MODULES = path.join(projectPath, 'node_modules')
rimraf.sync(path.join(REDWOOD_PROJECT_NODE_MODULES, '@redwoodjs'))

console.log('Copying...')
const packages = packagesFileList()
for (const [packageName, files] of Object.entries(packages)) {
  console.log(
    terminalLink(
      packageName,
      'file://' + path.join(REDWOOD_PROJECT_NODE_MODULES, packageName)
    ),
    files.length,
    'files'
  )
  for (const file of files) {
    const src = path.join(
      REDWOOD_PACKAGES_PATH,
      packageName.replace('@redwoodjs', ''),
      file
    )
    const dst = path.join(REDWOOD_PROJECT_NODE_MODULES, packageName, file)
    fs.mkdirSync(path.dirname(dst), { recursive: true })
    fs.copyFileSync(src, dst)
  }
}

console.log()
const bins = redwoodBins()
for (let [binName, binPath] of Object.entries(bins)) {
  // if the binPath doesn't exist, create it.
  const binSymlink = path.join(REDWOOD_PROJECT_NODE_MODULES, '.bin', binName)
  binPath = path.join(REDWOOD_PROJECT_NODE_MODULES, binPath)
  if (!fs.existsSync(binSymlink)) {
    fs.symlinkSync(binPath, binSymlink)
  }

  console.log('chmod +x', binName)
  fs.chmodSync(binPath, '755')
}
