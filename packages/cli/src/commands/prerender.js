import fs from 'fs'
import path from 'path'

import Listr from 'listr'
import VerboseRenderer from 'listr-verbose-renderer'

import { getPaths } from '@redwoodjs/internal'
import { runPrerender, writePrerenderedHtmlFile } from '@redwoodjs/prerender'
import { detectPrerenderRoutes } from '@redwoodjs/prerender/detection'
import { errorTelemetry } from '@redwoodjs/telemetry'

import c from '../lib/colors'

export const command = 'prerender'
export const aliases = ['render']
export const description = 'Prerender pages of your Redwood app at build time'

export const builder = (yargs) => {
  yargs.showHelpOnFail(false)

  yargs.option('path', {
    alias: ['p', 'route'],
    description: 'Router path to prerender. Especially useful for debugging',
    type: 'string',
  })

  yargs.option('dry-run', {
    alias: ['d', 'dryrun'],
    default: false,
    description: 'Run prerender and output to console',
    type: 'boolean',
  })

  yargs.option('verbose', {
    alias: 'v',
    default: false,
    description: 'Print more',
    type: 'boolean',
  })
}

const mapRouterPathToHtml = (routerPath) => {
  if (routerPath === '/') {
    return 'web/dist/index.html'
  } else {
    return `web/dist${routerPath}.html`
  }
}

// This is used directly in build.js for nested ListrTasks
export const getTasks = async (dryrun, routerPathFilter = null) => {
  const prerenderRoutes = detectPrerenderRoutes()

  if (prerenderRoutes.length === 0) {
    console.error('\nSkipping prerender...')
    console.error(
      c.warning(
        'You have not marked any routes as `prerender` in `Routes.{js,tsx}` \n'
      )
    )

    // Don't error out
    return []
  }

  if (!fs.existsSync(path.join(getPaths().web.dist), 'index.html')) {
    console.error(
      'You must run `yarn rw build web` before trying to prerender.'
    )
    process.exit(1)
    // TODO: Run this automatically at this point.
  }

  const listrTasks = prerenderRoutes
    .filter((route) => route.path)
    .flatMap((routeToPrerender) => {
      // Filter out routes that don't match the supplied routePathFilter
      if (routerPathFilter && routeToPrerender.path !== routerPathFilter) {
        return []
      }

      const outputHtmlPath = mapRouterPathToHtml(routeToPrerender.path)

      return [
        {
          title: `Prerendering ${routeToPrerender.path} -> ${outputHtmlPath}`,
          task: async () => {
            try {
              const prerenderedHtml = await runPrerender({
                routerPath: routeToPrerender.path,
              })

              if (!dryrun) {
                writePrerenderedHtmlFile(outputHtmlPath, prerenderedHtml)
              }
            } catch (e) {
              console.log()
              console.log(
                c.warning('You can use `yarn rw prerender --dry-run` to debug')
              )
              console.log()

              console.log(
                `${c.info('-'.repeat(10))} Error rendering path "${
                  routeToPrerender.path
                }" ${c.info('-'.repeat(10))}`
              )

              errorTelemetry(process.argv, `Error prerendering: ${e.message}`)

              console.error(c.error(e.stack))
              console.log()

              throw new Error(`Failed to render "${routeToPrerender.filePath}"`)
            }
          },
        },
      ]
    })

  return listrTasks
}

const diagnosticCheck = () => {
  const checks = [
    {
      message: 'Duplicate React version found in web/node_modules',
      failure: fs.existsSync(
        path.join(getPaths().web.base, 'node_modules/react')
      ),
    },
    {
      message: 'Duplicate react-dom version found in web/node_modules',
      failure: fs.existsSync(
        path.join(getPaths().web.base, 'node_modules/react-dom')
      ),
    },
    {
      message: 'Duplicate core-js version found in web/node_modules',
      failure: fs.existsSync(
        path.join(getPaths().web.base, 'node_modules/core-js')
      ),
    },
    {
      message: 'Duplicate @redwoodjs/web version found in web/node_modules',
      failure: fs.existsSync(
        path.join(getPaths().web.base, 'node_modules/@redwoodjs/web')
      ),
    },
  ]
  console.log('Running diagnostic checks')

  if (checks.some((checks) => checks.failure)) {
    console.error(c.error('node_modules are being duplicated in `./web` \n'))
    console.log('⚠️  Issues found: ')
    console.log('-'.repeat(50))

    checks
      .filter((check) => check.failure)
      .forEach((check, i) => {
        console.log(`${i + 1}. ${check.message}`)
      })

    console.log('-'.repeat(50))

    console.log(
      'Diagnostic check found issues. See the Redwood Forum link below for help:'
    )

    console.log(
      c.underline(
        'https://community.redwoodjs.com/search?q=duplicate%20package%20found'
      )
    )

    console.log()

    // Exit, no need to show other messages
    process.exit(1)
  } else {
    console.log('✔ Diagnostics checks passed \n')
  }
}

export const handler = async ({ path: routerPath, dryRun, verbose }) => {
  const listrTasks = await getTasks(dryRun, routerPath)

  const tasks = new Listr(listrTasks, {
    renderer: verbose ? VerboseRenderer : 'default',
  })

  try {
    if (dryRun) {
      console.log(c.info('::: Dry run, not writing changes :::'))
    }

    await tasks.run()
  } catch (e) {
    console.log()
    await diagnosticCheck()

    console.log(c.warning('Tips:'))
    console.log(
      c.info(
        `- This could mean that a library you're using does not support SSR.`
      )
    )
    console.log(
      c.info(
        '- Avoid using `window` in the initial render path through your React components without checks. \n  See https://redwoodjs.com/docs/prerender#prerender-utils'
      )
    )

    console.log()

    process.exit(1)
  }
}
