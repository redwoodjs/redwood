import fs from 'fs'
import path from 'path'

import Listr from 'listr'
import VerboseRenderer from 'listr-verbose-renderer'

import { getPaths } from '@redwoodjs/internal'
import { detectPrerenderRoutes } from '@redwoodjs/prerender/detection'

import c from 'src/lib/colors'

export const command = 'prerender'
export const aliases = ['render']
export const description = 'Prerender pages of a redwood app (experimental)'

export const builder = (yargs) => {
  yargs.showHelpOnFail(false)

  yargs.option('path', {
    alias: 'path',
    default: false,
    description: 'Router path to prerender',
    type: 'string',
  })

  yargs.option('output', {
    alias: 'output',
    default: false,
    description: 'Output path',
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

// This can be used directly in build.js for nested ListrTasks
export const getTasks = async (dryrun) => {
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

  // Import runPrerender async, so babel config et all are only loaded
  // when this task runs
  const { runPrerender } = await import('@redwoodjs/prerender')

  const listrTasks = prerenderRoutes
    .filter((route) => route.path)
    .map((routeToPrerender) => {
      const outputHtmlPath = mapRouterPathToHtml(routeToPrerender.path)

      return {
        title: `Prerendering ${routeToPrerender.path} -> ${outputHtmlPath}`,
        task: async () => {
          try {
            await runPrerender({
              routerPath: routeToPrerender.path,
              outputHtmlPath,
              dryRun: dryrun,
            })
          } catch (e) {
            console.log(
              `${c.info('-'.repeat(20))} Error rendering path "${
                routeToPrerender.path
              }" ${c.info('-'.repeat(20))}`
            )

            console.error(c.error(e.stack))
            console.log('-'.repeat(50))

            throw new Error(
              `Failed to render file "${routeToPrerender.filePath}"`
            )
          }
        },
      }
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

export const handler = async ({
  path: routerPath,
  output,
  dryRun,
  verbose,
}) => {
  if (routerPath) {
    const { runPrerender } = await import('@redwoodjs/prerender')

    await runPrerender({
      routerPath,
      outputHtmlPath: output,
      dryRun,
    })

    return
  }

  const listrTasks = await getTasks(dryRun)

  const tasks = new Listr(listrTasks, {
    renderer: verbose ? VerboseRenderer : 'default',
    concurrent: true,
  })

  try {
    if (dryRun) {
      console.log('::: Dry run, not writing changes :::')
    }

    await tasks.run()
  } catch (e) {
    console.log()
    await diagnosticCheck()

    console.log(
      c.warning(
        'Not all routes were succesfully prerendered. Run `yarn rw prerender --dry-run --verbose` for detailed logs'
      )
    )
    console.log(
      c.info(
        `This could mean that a library you're using does not support SSR.`
      )
    )

    console.log()

    process.exit(1)
  }
}
