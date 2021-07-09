#!/usr/bin/env node
/* eslint-env node, es6 */

const { gatherDeps, getPackageJson, logWarnings } = require('./utils')

const projectPath = process.argv?.[2] ?? process.env.RWJS_CWD

if (!projectPath) {
  console.log('Error: Please specify the path to your Redwood Project')
  console.log(`Usage: ${process.argv?.[1]} /path/to/rwjs/proect`)
  process.exit(1)
}

try {
  const { packageJson, packageJsonLink, writePackageJson } =
    getPackageJson(projectPath)

  const { dependencies, warnings } = gatherDeps()

  if (warnings.length) {
    logWarnings(warnings)
    console.log()
  }

  console.log(
    `Adding ${
      Object.keys(dependencies).length
    } Framework dependencies to ${packageJsonLink}...`
  )

  if (packageJson.dependencies) {
    packageJson.dependencies = {
      ...packageJson.dependencies,
      ...dependencies,
    }
  } else {
    packageJson.dependencies = dependencies
  }

  writePackageJson(packageJson)

  console.log('... Done. Now run `yarn install`')
} catch (e) {
  console.log(e)
  process.exit(1)
}
