/* eslint-env node, es6*/

// gather all the dependencies.
const fs = require('fs')
const path = require('path')

const fg = require('fast-glob')
const packlist = require('npm-packlist')
const terminalLink = require('terminal-link')

const REDWOOD_PACKAGES_PATH = path.resolve(__dirname, '../../../packages')

function sortObjectKeys(obj) {
  return Object.keys(obj)
    .sort()
    .reduce((acc, key) => {
      acc[key] = obj[key]
      return acc
    }, {})
}

/**
 * The Redwood packages that are installed into a Redwood Project.
 */
function frameworkPackages() {
  return fg.sync('**/package.json', {
    cwd: REDWOOD_PACKAGES_PATH,
    ignore: ['**/node_modules/**', '**/create-redwood-app/**'],
    absolute: true,
  })
}

/**
 * The dependencenies used by RedwoodJS packages.
 */
function gatherDeps(packages = frameworkPackages()) {
  const warnings = []
  const dependencies = {}
  for (const packageFile of packages) {
    // reduce.
    try {
      const packageJson = JSON.parse(fs.readFileSync(packageFile))
      for (const [name, version] of Object.entries(
        packageJson?.dependencies ?? {}
      )) {
        // Skip `@redwoodjs/*` packages, since these are processed
        // by the workspace.
        if (!name.startsWith('@redwoodjs/')) {
          if (dependencies[name] && dependencies[name] !== version) {
            warnings.push([
              name,
              'dependency version mismatched, please make sure the versions are the same.',
            ])
          }
          dependencies[name] = version
        }
      }
    } catch (error) {
      console.error()
      console.error(`Error: in ${packageFile}: ${error.message}.`)
      console.error("This package's dependencies will not be included.")
      console.error()
    }
  }
  return { dependencies: sortObjectKeys(dependencies), warnings }
}

/**
 * The files that are published by the Redwood Framework.
 * Note: The packages must be built.
 */
function packagesFileList(packages = frameworkPackages()) {
  const fileList = {}
  for (const packageFile of packages) {
    const packageJson = require(packageFile)

    if (!packageJson.name) {
      continue
    }

    fileList[packageJson.name] = packlist.sync({
      path: path.dirname(packageFile),
    })
  }
  return fileList
}

function redwoodBins(packages = frameworkPackages()) {
  let bins = {}
  for (const packageFile of packages) {
    const packageJson = require(packageFile)
    if (!packageJson.name) {
      continue
    }

    if (!packageJson.bin) {
      continue
    }
    for (const [binName, binPath] of Object.entries(packageJson.bin)) {
      bins[binName] = path.join(packageJson.name, binPath)
    }
  }
  return bins
}

// gets the redwood project's package.json and builds a write function around it
function getPackageJson(projectPath) {
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

  const packageJson = require(packageJsonPath)

  // for use later, after updating packageJson's dependencies
  function writePackageJson(packageJson) {
    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, undefined, 2))
  }

  return {
    packageJson,
    packageJsonPath,
    packageJsonLink,
    writePackageJson,
  }
}

module.exports.REDWOOD_PACKAGES_PATH = REDWOOD_PACKAGES_PATH
module.exports.redwoodPackages = frameworkPackages
module.exports.gatherDeps = gatherDeps
module.exports.packagesFileList = packagesFileList
module.exports.redwoodBins = redwoodBins
module.exports.getPackageJson = getPackageJson
