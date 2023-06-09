#!/usr/bin/env node
/* eslint-env node */
// @ts-check

import { execSync } from 'node:child_process'
import path from 'node:path'

import c from 'ansi-colors'
import chokidar from 'chokidar'
import fs from 'fs-extra'
import { hideBin } from 'yargs/helpers'
import yargs from 'yargs/yargs'

import {
  getPackageJsonName,
  resolvePackageJsonPath,
  REDWOOD_FRAMEWORK_PATH,
  REDWOOD_PACKAGES_PATH,
} from './lib/framework.mjs'
import {
  addDependenciesToPackageJson,
  copyFrameworkFilesToProject,
} from './lib/project.mjs'

const IGNORE_EXTENSIONS = ['.DS_Store']

// Add to this array of strings, RegExps, or functions (whichever makes the most sense)
// to ignore files that we don't want triggering package rebuilds.
const ignored = [
  /node_modules/,

  /dist/,

  /__fixtures__/,
  /__mocks__/,
  /__tests__/,
  /.test./,
  /jest.config.{js,ts}/,

  /README.md/,

  // esbuild emits meta.json files that we sometimes suffix.
  /meta.(\w*\.?)json/,

  (filePath) => IGNORE_EXTENSIONS.some((ext) => filePath.endsWith(ext)),
]

const separator = '-'.repeat(process.stdout.columns)

async function main() {
  const { _: positionals, ...options } = yargs(hideBin(process.argv))
    .options({
      cleanFramework: {
        description:
          'Clean any built framework packages before watching for changes',
        type: 'boolean',
        default: true,
      },
      buildFramework: {
        description:
          'Build all the framework packages before watching for changes',
        type: 'boolean',
        default: true,
      },
      addDependencies: {
        description:
          "Add the framework's dependencies to the project and yarn install before watching for changes",
        type: 'boolean',
        default: true,
      },
      copyFiles: {
        description:
          "Copy the framework packages' files to the project's node_modules before watching for changes",
        type: 'boolean',
        default: true,
      },
      cleanUp: {
        description:
          "Restore the project's package.json when this process exits",
        type: 'boolean',
        default: true,
      },
      watch: {
        description: 'Watch for changes to the framework packages',
        type: 'boolean',
        default: true,
      },
      verbose: {
        description: 'Print more',
        type: 'boolean',
        default: true,
      },
    })
    .parseSync()

  const redwoodProjectPath = positionals[0] ?? process.env.RWJS_CWD

  // Mostly just making TS happy with the second condition.
  if (!redwoodProjectPath || typeof redwoodProjectPath !== 'string') {
    process.exitCode = 1
    console.error([
      'Error: Please specify the path to your Redwood project',
      `Usage: ${process.argv?.[1]} ./path/to/rw/project`,
    ])
    return
  }

  if (options.cleanFramework) {
    logStatus('Cleaning the Redwood framework...')
    execSync('yarn build:clean', {
      stdio: options.verbose ? 'inherit' : 'pipe',
      cwd: REDWOOD_FRAMEWORK_PATH,
    })
  }

  if (options.buildFramework) {
    try {
      logStatus('Building the Redwood framework...')
      execSync('yarn build', {
        stdio: options.verbose ? 'inherit' : 'pipe',
        cwd: REDWOOD_FRAMEWORK_PATH,
      })
      console.log()
    } catch (e) {
      // Temporary error handling for.
      //  >  Lerna (powered by Nx)   ENOENT: no such file or directory, open '/Users/dom/projects/redwood/redwood/node_modules/lerna/node_modules/nx/package.json'
      process.exitCode = 1
      console.error(
        [
          c.bgYellow(c.black('Heads up ')),
          '',
          "If this failed because Nx couldn't find its package.json file in node_modules, it's a known issue. The workaround is just trying again.",
        ].join('\n')
      )
      return
    }
  }

  // Settig up here first before we add the first SIGINT handler
  // just for visual output.
  process.on('SIGINT', () => {
    console.log()
  })

  if (options.addDependencies) {
    // Save the project's package.json so that we can restore it when this process exits.
    const redwoodProjectPackageJsonPath = path.join(
      redwoodProjectPath,
      'package.json'
    )
    const redwoodProjectPackageJson = fs.readFileSync(
      redwoodProjectPackageJsonPath,
      'utf-8'
    )

    if (options.cleanUp) {
      logStatus('Setting up clean up on SIGINT or process exit...')

      const cleanUp = createCleanUp({
        redwoodProjectPackageJsonPath,
        redwoodProjectPackageJson,
      })

      process.on('SIGINT', cleanUp)
      process.on('exit', cleanUp)
    }

    logStatus("Adding the Redwood framework's dependencies...")
    addDependenciesToPackageJson(redwoodProjectPackageJsonPath)

    try {
      execSync('yarn install', {
        cwd: redwoodProjectPath,
        stdio: options.verbose ? 'inherit' : 'pipe',
      })
      console.log()
    } catch (e) {
      process.exitCode = 1
      console.error(e)
      return
    }
  }

  if (options.copyFiles) {
    logStatus('Copying the Redwood framework files...')
    await copyFrameworkFilesToProject(redwoodProjectPath)
    console.log()
  }

  if (!options.watch) {
    return
  }

  logStatus('Waiting for changes')
  console.log(separator)

  const watcher = chokidar.watch(REDWOOD_PACKAGES_PATH, {
    ignored,
    // We don't want chokidar to emit events as it discovers paths, only as they change.
    ignoreInitial: true,
    // Debounce the events.
    awaitWriteFinish: true,
  })

  let closedWatcher = false

  async function closeWatcher() {
    if (closedWatcher) {
      return
    }

    logStatus('Closing the watcher...')
    await watcher.close()
    closedWatcher = true
  }

  process.on('SIGINT', closeWatcher)
  process.on('exit', closeWatcher)

  watcher.on('all', async (_event, filePath) => {
    logStatus(`${filePath} changed`)

    if (filePath.endsWith('package.json')) {
      logStatus(
        [
          `${c.red('Warning:')} You modified a package.json file.`,
          `If you've modified the ${c.underline('dependencies')}`,
          `then you must run ${c.underline('yarn rwfw project:sync')} again.`,
        ].join(' ')
      )
    }

    const packageJsonPath = resolvePackageJsonPath(filePath)
    const packageName = getPackageJsonName(packageJsonPath)

    let errored = false

    try {
      logStatus(`Cleaning ${c.magenta(packageName)}...`)
      execSync(
        `yarn rimraf ${path.join(path.dirname(packageJsonPath), 'dist')}`,
        {
          stdio: options.verbose ? 'inherit' : 'pipe',
          cwd: REDWOOD_FRAMEWORK_PATH,
        }
      )

      logStatus(`Building ${c.magenta(packageName)}...`)
      execSync('yarn build', {
        stdio: options.verbose ? 'inherit' : 'pipe',
        cwd: path.dirname(packageJsonPath),
      })

      logStatus(`Copying ${packageName}...`)
      await copyFrameworkFilesToProject(redwoodProjectPath, [packageJsonPath])
      console.log()
    } catch (error) {
      errored = true
    }

    if (errored) {
      logError(`Error building ${packageName}`)
    }

    logStatus(`Done, and waiting for changes...`)
    console.log(separator)
  })
}

/**
 * @param {string} m
 */
function logStatus(m) {
  console.log(c.bgYellow(c.black('rwfw ')), c.yellow(m))
}

/**
 * @param {string} m
 */
function logError(m) {
  console.error(c.bgRed(c.black('rwfw ')), c.red(m))
}

function createCleanUp({
  redwoodProjectPackageJsonPath,
  redwoodProjectPackageJson,
}) {
  let cleanedUp = false

  return function () {
    if (cleanedUp) {
      return
    }

    logStatus("Restoring the Redwood project's package.json...")

    fs.writeFileSync(redwoodProjectPackageJsonPath, redwoodProjectPackageJson)

    console.log(
      [
        '',
        'To get your project back to its original state...',
        "- undo the changes to project's your yarn.lock file",
        "- remove your project's node_modules directory",
        "- run 'yarn install'",
        '',
      ].join('\n')
    )

    cleanedUp = true
  }
}

// ------------------------

main()
