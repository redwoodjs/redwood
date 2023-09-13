#!/usr/bin/env node
/* eslint-env node */
// @ts-check

import { execSync } from 'node:child_process'
import path from 'node:path'

import c from 'ansi-colors'
import chokidar from 'chokidar'
import fs from 'fs-extra'
import { rimraf } from 'rimraf'
import { hideBin } from 'yargs/helpers'
import yargs from 'yargs/yargs'

import {
  getPackageName,
  resolvePackageJsonPathFromFilePath,
  REDWOOD_FRAMEWORK_PATH,
  REDWOOD_PACKAGES_PATH,
} from './lib/framework.mjs'
import {
  addDependenciesToPackageJson,
  copyFrameworkFilesToProject,
  fixProjectBinaries,
  resolveViteConfigPath,
} from './lib/project.mjs'
import modifyViteConfigToForceOptimize from './lib/viteConfig.mjs'

const IGNORE_EXTENSIONS = ['.DS_Store']

// Add to this array of strings, RegExps, or functions (whichever makes the most sense)
// to ignore files that we don't want triggering package rebuilds.
const ignored = [
  /node_modules/,

  /packages\/codemods/,
  /packages\/create-redwood-app/,

  /dist/,

  /__fixtures__/,
  /__mocks__/,
  /__tests__/,
  /\.test\./,
  /jest.config.{js,ts}/,

  /README.md/,

  // esbuild emits meta.json files that we sometimes suffix.
  /meta.(\w*\.?)json/,

  (filePath) => IGNORE_EXTENSIONS.some((ext) => filePath.endsWith(ext)),
]

const separator = '-'.repeat(process.stdout.columns)

async function main() {
  const { _: positionals, ...options } = yargs(hideBin(process.argv))
    .option('setUpForWatch', {
      description: 'Set up the project for watching for framework changes',
      type: 'boolean',
      default: true,
    })
    .option('addFwDeps', {
      description:
        'Modify the projects package.json to include fw dependencies',
      type: 'boolean',
      default: true,
    })
    .option('watch', {
      description: 'Watch for changes to the framework packages',
      type: 'boolean',
      default: true,
    })
    .option('cleanUp', {
      description: 'Clean up the Redwood project on SIGINT or process exit',
      type: 'boolean',
      default: true,
    })
    .option('verbose', {
      description: 'Print more',
      type: 'boolean',
      default: true,
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

  if (options.setUpForWatch) {
    logStatus('Cleaning the Redwood framework...')
    execSync('yarn build:clean', {
      stdio: options.verbose ? 'inherit' : 'pipe',
      cwd: REDWOOD_FRAMEWORK_PATH,
    })
  }

  if (options.setUpForWatch) {
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

  if (options.setUpForWatch) {
    // Save the project's package.json so that we can restore it when this process exits.
    const redwoodProjectPackageJsonPath = path.join(
      redwoodProjectPath,
      'package.json'
    )
    const redwoodProjectPackageJson = fs.readFileSync(
      redwoodProjectPackageJsonPath,
      'utf-8'
    )

    const viteConfigPath = resolveViteConfigPath(redwoodProjectPath)
    let viteConfigContents

    if (viteConfigPath) {
      viteConfigContents = fs.readFileSync(viteConfigPath, 'utf-8')
      const newViteConfig = modifyViteConfigToForceOptimize(viteConfigContents)

      fs.writeFileSync(viteConfigPath, newViteConfig)
    }

    if (options.cleanUp) {
      logStatus('Setting up clean up on SIGINT or process exit...')

      const cleanUp = createCleanUp({
        redwoodProjectPackageJsonPath,
        redwoodProjectPackageJson,
        viteConfigPath,
        viteConfigContents,
      })

      process.on('SIGINT', cleanUp)
      process.on('exit', cleanUp)
    }

    if (options.addFwDeps) {
      // Rare case, but sometimes we don't want to modify any dependency versions
      logStatus("Adding the Redwood framework's dependencies...")
      addDependenciesToPackageJson(redwoodProjectPackageJsonPath)
    } else {
      logStatus("Skipping adding framework's dependencies...")
    }

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

  if (options.setUpForWatch) {
    logStatus('Copying the Redwood framework files...')
    await copyFrameworkFilesToProject(redwoodProjectPath)
    console.log()
  }

  if (options.setUpForWatch) {
    logStatus("Fixing the project's binaries...")
    fixProjectBinaries(redwoodProjectPath)
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

  watcher.on('all', async (event, filePath) => {
    logStatus(`${event}: ${filePath}`)

    if (filePath.endsWith('package.json')) {
      logStatus(
        [
          `${c.red('Warning:')} You modified a package.json file.`,
          `If you've modified the ${c.underline('dependencies')}`,
          `then you must run ${c.underline('yarn rwfw project:sync')} again.`,
        ].join(' ')
      )
    }

    const packageJsonPath = resolvePackageJsonPathFromFilePath(filePath)
    const packageName = getPackageName(packageJsonPath)

    let errored = false

    try {
      logStatus(`Cleaning ${c.magenta(packageName)}...`)
      await rimraf(path.join(path.dirname(packageJsonPath), 'dist'))

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
  viteConfigPath,
  viteConfigContents,
}) {
  let cleanedUp = false

  return function () {
    if (cleanedUp) {
      return
    }

    logStatus("Restoring the Redwood project's package.json & vite config...")

    fs.writeFileSync(redwoodProjectPackageJsonPath, redwoodProjectPackageJson)

    if (viteConfigPath && viteConfigContents) {
      fs.writeFileSync(viteConfigPath, viteConfigContents)
    }

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
