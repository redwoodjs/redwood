import type { ChildProcess } from 'child_process'
import { fork } from 'child_process'
import fs from 'fs'
import path from 'path'

import chalk from 'chalk'
import chokidar from 'chokidar'
import dotenv from 'dotenv'
import { debounce } from 'lodash'
import { hideBin } from 'yargs/helpers'
import yargs from 'yargs/yargs'

import {
  buildApi,
  cleanApiBuild,
  rebuildApi,
} from '@redwoodjs/internal/dist/build/api'
import { loadAndValidateSdls } from '@redwoodjs/internal/dist/validateSchema'
import {
  ensurePosixPath,
  getConfig,
  getPaths,
  resolveFile,
} from '@redwoodjs/project-config'

const rwjsPaths = getPaths()

if (!process.env.REDWOOD_ENV_FILES_LOADED) {
  dotenv.config({
    path: path.join(rwjsPaths.base, '.env'),
    // @ts-expect-error The types for dotenv-defaults are using an outdated version of dotenv
    defaults: path.join(rwjsPaths.base, '.env.defaults'),
    multiline: true,
  })

  process.env.REDWOOD_ENV_FILES_LOADED = 'true'
}

const argv = yargs(hideBin(process.argv))
  .option('debugPort', {
    description: 'Port on which to expose API server debugger',
    type: 'number',
    alias: ['debug-port', 'dp'],
  })
  .option('port', {
    description: 'The port to listen at',
    type: 'number',
    alias: 'p',
  })
  .parseSync()

let httpServerProcess: ChildProcess

const killApiServer = () => {
  httpServerProcess?.emit('exit')
  httpServerProcess?.kill()
}

const validate = async () => {
  try {
    await loadAndValidateSdls()
    return true
  } catch (e: any) {
    killApiServer()
    console.error(
      chalk.redBright(`[GQL Server Error] - Schema validation failed`),
    )
    console.error(chalk.red(e?.message))
    console.error(chalk.redBright('-'.repeat(40)))

    debouncedBuild.cancel()
    debouncedRebuild.cancel()
    return false
  }
}

const buildAndRestart = async ({
  rebuild = false,
  clean = false,
}: { rebuild?: boolean; clean?: boolean } = {}) => {
  try {
    // Shutdown API server
    killApiServer()

    const buildTs = Date.now()
    console.log(chalk.dim.italic('Building...'))

    if (clean) {
      await cleanApiBuild()
    }

    if (rebuild) {
      await rebuildApi()
    } else {
      await buildApi()
    }
    console.log(chalk.dim.italic('Took ' + (Date.now() - buildTs) + ' ms'))

    const forkOpts = {
      execArgv: process.execArgv,
    }

    // OpenTelemetry SDK Setup
    if (getConfig().experimental.opentelemetry.enabled) {
      // We expect the OpenTelemetry SDK setup file to be in a specific location
      const opentelemetrySDKScriptPath = path.join(
        rwjsPaths.api.dist,
        'opentelemetry.js',
      )
      const opentelemetrySDKScriptPathRelative = path.relative(
        rwjsPaths.base,
        opentelemetrySDKScriptPath,
      )
      console.log(
        `Setting up OpenTelemetry using the setup file: ${opentelemetrySDKScriptPathRelative}`,
      )
      if (fs.existsSync(opentelemetrySDKScriptPath)) {
        forkOpts.execArgv = forkOpts.execArgv.concat([
          `--require=${opentelemetrySDKScriptPath}`,
        ])
      } else {
        console.error(
          `OpenTelemetry setup file does not exist at ${opentelemetrySDKScriptPathRelative}`,
        )
      }
    }

    const debugPort = argv['debug-port']
    if (debugPort) {
      forkOpts.execArgv = forkOpts.execArgv.concat([`--inspect=${debugPort}`])
    }

    const port = argv.port ?? getConfig().api.port

    // Start API server

    const serverFile = resolveFile(`${rwjsPaths.api.dist}/server`)
    if (serverFile) {
      httpServerProcess = fork(
        serverFile,
        ['--apiPort', port.toString()],
        forkOpts,
      )
    } else {
      httpServerProcess = fork(
        path.join(__dirname, 'bin.js'),
        ['api', '--port', port.toString()],
        forkOpts,
      )
    }
  } catch (e) {
    console.error(e)
  }
}

// We want to delay exception when multiple files are modified on the filesystem,
// this usually happens when running RedwoodJS generator commands.
// Local writes are very fast, but writes in e2e environments are not,
// so allow the default to be adjust with a env-var.
const debouncedRebuild = debounce(
  () => buildAndRestart({ rebuild: true }),
  process.env.RWJS_DELAY_RESTART
    ? parseInt(process.env.RWJS_DELAY_RESTART, 10)
    : 500,
)

const debouncedBuild = debounce(
  () => buildAndRestart({ rebuild: false }),
  process.env.RWJS_DELAY_RESTART
    ? parseInt(process.env.RWJS_DELAY_RESTART, 10)
    : 500,
)

// NOTE: the file comes through as a unix path, even on windows
// So we need to convert the rwjsPaths

const IGNORED_API_PATHS = [
  'api/dist', // use this, because using rwjsPaths.api.dist seems to not ignore on first build
  rwjsPaths.api.types,
  rwjsPaths.api.db,
].map((path) => ensurePosixPath(path))

chokidar
  .watch([rwjsPaths.api.src], {
    persistent: true,
    ignoreInitial: true,
    ignored: (file: string) => {
      const x =
        file.includes('node_modules') ||
        IGNORED_API_PATHS.some((ignoredPath) => file.includes(ignoredPath)) ||
        [
          '.DS_Store',
          '.db',
          '.sqlite',
          '-journal',
          '.test.js',
          '.test.ts',
          '.scenarios.ts',
          '.scenarios.js',
          '.d.ts',
          '.log',
        ].some((ext) => file.endsWith(ext))
      return x
    },
  })
  .on('ready', async () => {
    // First time
    await buildAndRestart({
      clean: true,
      rebuild: false,
    })
    await validate()
  })
  .on('all', async (eventName, filePath) => {
    // On sufficiently large projects (500+ files, or >= 2000 ms build times) on older machines,
    // esbuild writing to the api directory makes chokidar emit an `addDir` event.
    // This starts an infinite loop where the api starts building itself as soon as it's finished.
    // This could probably be fixed with some sort of build caching
    if (eventName === 'addDir' && filePath === rwjsPaths.api.base) {
      return
    }

    if (eventName) {
      if (filePath.includes('.sdl')) {
        // We validate here, so that developers will see the error
        // As they're running the dev server
        const isValid = await validate()

        // Exit early if not valid
        if (!isValid) {
          return
        }
      }
    }

    console.log(
      chalk.dim(`[${eventName}] ${filePath.replace(rwjsPaths.api.base, '')}`),
    )

    if (eventName === 'add' || eventName === 'unlink') {
      debouncedBuild.cancel()
      debouncedRebuild.cancel()
      debouncedBuild()
    } else {
      // If files have just changed, then rebuild
      debouncedBuild.cancel()
      debouncedRebuild.cancel()
      debouncedRebuild()
    }
  })
