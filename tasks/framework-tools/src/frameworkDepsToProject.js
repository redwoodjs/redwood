#!/usr/bin/env node
/* eslint-env node, es6 */

const fs = require('fs')
const path = require('path')

const terminalLink = require('terminal-link')

const { gatherDeps } = require('./utils')

const projectPath = process.argv?.[2] ?? process.env.RWJS_CWD
if (!projectPath) {
  console.log('Error: Please specify the path to your Redwood Project')
  console.log(`Usage: ${process.argv?.[1]} /path/to/rwjs/proect`)
  process.exit(1)
}

try {
  const packageJsonPath = path.join(projectPath, 'package.json')

  const packageJsonLink = terminalLink(
    'Redwood Project Path',
    'file://' + packageJsonPath
  )

  if (!fs.existsSync(packageJsonPath)) {
    console.log(
      `Error: The specified ${packageJsonLink} does not have a package.json file.`
    )
    console.log('Expected:', packageJsonPath)
    process.exit(1)
  }

  const { dependencies, warnings } = gatherDeps()

  if (warnings.length) {
    for (const [packageName, message] of warnings) {
      console.warn('Warning:', packageName, message)
    }
    console.log()
  }

  console.log(
    `Adding ${
      Object.keys(dependencies).length
    } Framework dependencies to ${packageJsonLink}...`
  )
  const packageJson = require(packageJsonPath)
  if (packageJson.dependencies) {
    packageJson.dependencies = {
      ...packageJson.dependencies,
      ...dependencies,
    }
  } else {
    packageJson.dependencies = dependencies
  }
  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, undefined, 2))

  console.log('... Done. Now run `yarn install`')
} catch (e) {
  console.log('Error:', e)
  process.exit(1)
}
