import fs from 'fs'
import { argv } from 'process'

import concurrently from 'concurrently'
import fg from 'fast-glob'

import { recordTelemetryAttributes } from '@redwoodjs/cli-helpers'
import { shutdownPort } from '@redwoodjs/internal/dist/dev'
import { getConfig, getConfigPath } from '@redwoodjs/project-config'
import { errorTelemetry } from '@redwoodjs/telemetry'

import { getPaths } from '../lib'
import c from '../lib/colors'
import { exitWithError } from '../lib/exit'
import { generatePrismaClient } from '../lib/generatePrismaClient'
import { getFreePort } from '../lib/ports'

const defaultApiDebugPort = 18911

// @TODO Remove as of Redwood 7.0.0
const jsDeprecationNotice = () => {
  if (process.env.REDWOOD_DISABLE_JS_DEPRECATION_NOTICE) {
    return
  }

  // There may be actual legitimate JS-only files on the web side, so don't
  // search ALL files, just the main ones like App, Routes, pages and components
  const matches = fg.sync(
    ['App.js', 'Routes.js', 'components/**/*.js', 'pages/**/*.js'],
    {
      cwd: getPaths().web.src,
      ignore: [
        '**/.*.js',
        '**/*.fixtures.js',
        '**/*.mock.js',
        '**/*.routeHooks.js',
        '**/*.test.js',
        '**/*.spec.js',
      ],
    }
  )

  if (matches.length) {
    console.warn(
      c.warning(
        `DEPRECATION NOTICE: File extensions for JS files containing JSX must be named \`.jsx\`:\n\n  ${matches.join(
          '\n  '
        )}\n\nSupport for \`.js\` files containing JSX will be dropped in Redwood 7.0.0.\nThere is a codemod available to update these extensions for you:\n\n  npx @redwoodjs/codemods convert-js-to-jsx\n\n* Hide this notice by setting the ENV variable REDWOOD_DISABLE_JS_DEPRECATION_NOTICE=1`
      )
    )
  }
}

export const handler = async ({
  side = ['api', 'web'],
  forward = '',
  generate = true,
  watchNodeModules = process.env.RWJS_WATCH_NODE_MODULES === '1',
  apiDebugPort,
}) => {
  recordTelemetryAttributes({
    command: 'dev',
    side: JSON.stringify(side),
    generate,
    watchNodeModules,
  })

  const rwjsPaths = getPaths()

  // Starting values of ports from config (redwood.toml)
  let apiPreferredPort = parseInt(getConfig().api.port)
  let webPreferredPort = parseInt(getConfig().web.port)

  // Assume we can have the ports we want
  let apiAvailablePort = apiPreferredPort
  let apiPortChangeNeeded = false
  let webAvailablePort = webPreferredPort
  let webPortChangeNeeded = false

  // Check api port
  if (side.includes('api')) {
    apiAvailablePort = await getFreePort(apiPreferredPort)
    if (apiAvailablePort === -1) {
      exitWithError(undefined, {
        message: `Could not determine a free port for the api server`,
      })
    }
    apiPortChangeNeeded = apiAvailablePort !== apiPreferredPort
  }

  // Check web port
  if (side.includes('web')) {
    // Extract any ports the user forwarded to the webpack server and prefer that instead
    const forwardedPortMatches = [
      ...forward.matchAll(/\-\-port(\=|\s)(?<port>[^\s]*)/g),
    ]
    if (forwardedPortMatches.length) {
      webPreferredPort = parseInt(forwardedPortMatches.pop().groups.port)
    }
    webAvailablePort = await getFreePort(webPreferredPort, [
      apiPreferredPort,
      apiAvailablePort,
    ])
    if (webAvailablePort === -1) {
      exitWithError(undefined, {
        message: `Could not determine a free port for the web server`,
      })
    }
    webPortChangeNeeded = webAvailablePort !== webPreferredPort
  }

  // Check for port conflict and exit with message if found
  if (apiPortChangeNeeded || webPortChangeNeeded) {
    let message = `The currently configured ports for the development server are unavailable. Suggested changes to your ports, which can be changed in redwood.toml, are:\n`
    message += apiPortChangeNeeded
      ? `  - API to use port ${apiAvailablePort} instead of your currently configured ${apiPreferredPort}\n`
      : ``
    message += webPortChangeNeeded
      ? `  - Web to use port ${webAvailablePort} instead of your currently configured ${webPreferredPort}\n`
      : ``
    message += `\nCannot run the development server until your configured ports are changed or become available.`
    exitWithError(undefined, {
      message,
    })
  }

  if (side.includes('api')) {
    try {
      await generatePrismaClient({
        verbose: false,
        force: false,
        schema: rwjsPaths.api.dbSchema,
      })
    } catch (e) {
      errorTelemetry(
        process.argv,
        `Error generating prisma client: ${e.message}`
      )
      console.error(c.error(e.message))
    }

    try {
      await shutdownPort(apiAvailablePort)
    } catch (e) {
      errorTelemetry(process.argv, `Error shutting down "api": ${e.message}`)
      console.error(
        `Error whilst shutting down "api" port: ${c.error(e.message)}`
      )
    }
  }

  if (side.includes('web')) {
    // @TODO Remove as of Redwood 7.0.0
    jsDeprecationNotice()

    try {
      await shutdownPort(webAvailablePort)
    } catch (e) {
      errorTelemetry(process.argv, `Error shutting down "web": ${e.message}`)
      console.error(
        `Error whilst shutting down "web" port: ${c.error(e.message)}`
      )
    }
  }

  const webpackDevConfig = require.resolve(
    '@redwoodjs/core/config/webpack.development.js'
  )

  const getApiDebugFlag = () => {
    // Passed in flag takes precedence
    if (apiDebugPort) {
      return `--debug-port ${apiDebugPort}`
    } else if (argv.includes('--apiDebugPort')) {
      return `--debug-port ${defaultApiDebugPort}`
    }

    const apiDebugPortInToml = getConfig().api.debugPort
    if (apiDebugPortInToml) {
      return `--debug-port ${apiDebugPortInToml}`
    }

    // Dont pass in debug port flag, unless configured
    return ''
  }

  const redwoodConfigPath = getConfigPath()

  const streamingSsrEnabled = getConfig().experimental.streamingSsr?.enabled

  // @TODO (Streaming) Lot of temporary feature flags for started dev server.
  // Written this way to make it easier to read

  // 1. default: Vite (SPA)
  let webCommand = `yarn cross-env NODE_ENV=development rw-vite-dev ${forward}`

  // 2. Vite with SSR
  if (streamingSsrEnabled) {
    webCommand = `yarn cross-env NODE_ENV=development rw-dev-fe ${forward}`
  }

  // 3. Webpack (SPA): we will remove this override after v7
  if (getConfig().web.bundler === 'webpack') {
    if (streamingSsrEnabled) {
      throw new Error(
        'Webpack does not support SSR. Please switch your bundler to Vite in redwood.toml first'
      )
    } else {
      webCommand = `yarn cross-env NODE_ENV=development RWJS_WATCH_NODE_MODULES=${
        watchNodeModules ? '1' : ''
      } webpack serve --config "${webpackDevConfig}" ${forward}`
    }
  }

  /** @type {Record<string, import('concurrently').CommandObj>} */
  const jobs = {
    api: {
      name: 'api',
      command: `yarn cross-env NODE_ENV=development NODE_OPTIONS=--enable-source-maps yarn nodemon --quiet --watch "${redwoodConfigPath}" --exec "yarn rw-api-server-watch --port ${apiAvailablePort} ${getApiDebugFlag()} | rw-log-formatter"`,
      prefixColor: 'cyan',
      runWhen: () => fs.existsSync(rwjsPaths.api.src),
    },
    web: {
      name: 'web',
      command: webCommand,
      prefixColor: 'blue',
      cwd: rwjsPaths.web.base,
      runWhen: () => fs.existsSync(rwjsPaths.web.src),
    },
    gen: {
      name: 'gen',
      command: 'yarn rw-gen-watch',
      prefixColor: 'green',
      runWhen: () => generate,
    },
  }

  // TODO: Convert jobs to an array and supply cwd command.
  const { result } = concurrently(
    Object.keys(jobs)
      .map((job) => {
        if (side.includes(job) || job === 'gen') {
          return jobs[job]
        }
      })
      .filter((job) => job && job.runWhen()),
    {
      prefix: '{name} |',
      timestampFormat: 'HH:mm:ss',
      handleInput: true,
    }
  )
  result.catch((e) => {
    if (typeof e?.message !== 'undefined') {
      errorTelemetry(
        process.argv,
        `Error concurrently starting sides: ${e.message}`
      )
      exitWithError(e)
    }
  })
}
