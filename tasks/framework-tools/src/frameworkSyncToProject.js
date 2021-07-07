#!/usr/bin/env node
/* eslint-env node, es6 */

/**
 * - add the deps and install
 * - build and copy over files
 * - remove them when user cancels
 */

const c = require('ansi-colors')
const chokidar = require('chokidar')
const execa = require('execa')

const {
  gatherDeps,
  getPackageJson,
  REDWOOD_PACKAGES_PATH,
  redwoodPackages,
} = require('./utils')

const projectPath = process.argv?.[2] ?? process.env.RWJS_CWD

if (!projectPath) {
  console.log('Error: Please specify the path to your Redwood Project')
  console.log(`Usage: ${process.argv?.[1]} /path/to/rwjs/proect`)
  process.exit(1)
}

const { packageJson, packageJsonLink, writePackageJson } =
  getPackageJson(projectPath)

let { dependencies, warnings } = gatherDeps()

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

    if (packageJson.dependencies) {
      packageJson.dependencies = {
        ...packageJson.dependencies,
        ...dependencies,
      }
    } else {
      packageJson.dependencies = dependencies
    }

    writePackageJson(packageJson)

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
  .on('change', (file) => {
    console.log(c.dim(`[${file}`))

    if (redwoodPackages().includes(file)) {
      const newDeps = gatherDeps()

      if (
        JSON.stringify(dependencies) !== JSON.stringify(newDeps.dependencies)
      ) {
        console.log('Your dependencies have changed; run `yarn install`')
        console.log()

        dependencies = newDeps.dependencies
        warnings = newDeps.warnings

        if (warnings.length) {
          for (const [packageName, message] of warnings) {
            console.warn('Warning:', packageName, message)
          }
          console.log()
        }
      }
    } else {
      console.log('rebuild files')
      // - Copying the files: then if a change is detected in a particular package,
      // run yarn build in that packages folder, and copy over the files of that package.
      // (packagesFileList allows you to specify an array of packages that it should operate against.)
    }
  })
