#!/usr/bin/env node
/* eslint-env node, es6 */

/**
 * - add the deps and install
 * - build and copy over the files
 * - watch for changes
 * - revert on exit
 */

const path = require('path')

const c = require('ansi-colors')
const chokidar = require('chokidar')
const execa = require('execa')
const _ = require('lodash')
const rimraf = require('rimraf')

const {
  gatherDeps,
  getPackageJson,
  REDWOOD_PACKAGES_PATH,
  redwoodPackages,
  packagesFileList,
  makeCopyPackageFiles,
  logWarnings,
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

const {
  packageJson,
  packageJsonLink,
  writePackageJson,
  updatePackageJsonDeps,
} = getPackageJson(projectPath)

let { dependencies, warnings } = gatherDeps()

const handleDeps = _.debounce(() => {
  console.log()
  const newDeps = gatherDeps()

  if (JSON.stringify(dependencies) !== JSON.stringify(newDeps.dependencies)) {
    console.log('Your dependencies have changed; run `yarn install`')
    console.log()

    dependencies = newDeps.dependencies
    warnings = newDeps.warnings

    if (warnings.length) {
      logWarnings(warnings)
      console.log()
    }

    writePackageJson(updatePackageJsonDeps(dependencies))
  }
}, 200)

const handleFiles = _.debounce((file) => {
  console.log()
  const packageDirs = redwoodPackages().map(path.dirname)
  const packageToRebuild = packageDirs.find((dir) => file.startsWith(dir))
  const packages = packagesFileList()
  const packageName = Object.keys(packages).find((packageName) =>
    packageToRebuild.endsWith(packageName.replace('@redwoodjs', ''))
  )
  console.log(`Rebuilding ${packageName}...`)

  execa.sync('yarn build', {
    cwd: packageToRebuild,
    shell: true,
    stdio: 'inherit',
  })

  console.log('Copying over files...')
  console.log()
  copyPackageFiles([packageName, packages[packageName]])
  console.log(c.green(' Done.'))
  console.log()
}, 200)

// start watching for changes

chokidar
  .watch(REDWOOD_PACKAGES_PATH, {
    ignored: [
      '**/create-redwood-app/**',
      '**/node_modules/**',
      '**/dist/**',
      '**/.vscode',
      '**/*.md',
      '**/__fixtures__/**',
      '**/fixtures/**',
      '**/*.test.{js,ts}',
      '**/{__tests__}/**',
      '**/__mocks__/**',
      '**/jest.{config,setup}.{js,ts}',
    ],
  })
  .on('ready', () => {
    console.log()

    if (warnings.length) {
      logWarnings(warnings)
      console.log()
    }

    // ---

    console.log(
      `Adding ${
        Object.keys(dependencies).length
      } Framework dependencies to ${packageJsonLink}...`
    )

    writePackageJson(updatePackageJsonDeps(dependencies))

    console.log(c.green(' Done.'))
    console.log()

    // ---

    console.log('Running yarn install...')
    try {
      execa.sync('yarn install', {
        cwd: projectPath,
        shell: true,
        stdio: 'inherit',
      })
    } catch (e) {
      console.error('Error: Could not run `yarn install`')
      console.error(e)
      process.exit(1)
    }
    console.log()

    // copy over the files

    rimraf.sync(path.join(REDWOOD_PROJECT_NODE_MODULES, '@redwoodjs'))

    console.log('Copying over files...')
    const packages = packagesFileList()
    Object.entries(packages).forEach(copyPackageFiles)
    console.log(c.green(' Done.'))
    console.log()

    console.log('Make binaries executable...')
    linkBinaries(REDWOOD_PROJECT_NODE_MODULES)
    console.log(c.green(' Done.'))
    console.log()
  })
  .on('change', (file) => {
    console.log(c.dim(`--- file changed: ${file}`))

    if (redwoodPackages().includes(file)) {
      handleDeps(file)
    } else {
      handleFiles(file)
    }
  })

process.on('SIGINT', () => {
  console.log()
  console.log()
  console.log('Removing Framework dependencies ')
  console.log()
  writePackageJson(packageJson)
  rimraf.sync(path.join(REDWOOD_PROJECT_NODE_MODULES, '@redwoodjs'))

  console.log('Running yarn install...')
  try {
    execa.sync('yarn install', {
      cwd: projectPath,
      shell: true,
      stdio: 'inherit',
    })
  } catch (e) {
    console.error('Error: Could not run `yarn install`')
    console.error(e)
    process.exit(1)
  }
})
