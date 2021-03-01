import fs from 'fs'
import path from 'path'

import Listr from 'listr'
import VerboseRenderer from 'listr-verbose-renderer'

import { getPaths } from '@redwoodjs/internal'
import { runPrerender, detectPrerenderRoutes } from '@redwoodjs/prerender'

import c from 'src/lib/colors'

export const command = 'prerender'
export const aliases = ['render']
export const description = 'Prerender pages of a redwood app (experimental)'

export const builder = (yargs) => {
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
    alias: 'd',
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
export const getTasks = (dryrun) => {
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
    .map((routeToPrerender) => {
      const outputHtmlPath = mapRouterPathToHtml(routeToPrerender.path)

      return {
        title: `Prerendering ${routeToPrerender.path} -> ${outputHtmlPath}`,
        task: () => {
          return runPrerender({
            routerPath: routeToPrerender.path,
            outputHtmlPath,
            dryRun: dryrun,
          })
        },
      }
    })

  return listrTasks
}

export const handler = async ({ path, output, dryRun, verbose }) => {
  if (path) {
    await runPrerender({
      routerPath: path,
      outputHtmlPath: output,
      dryRun,
    })

    return
  }

  const listrTasks = getTasks(dryRun)

  const tasks = new Listr(listrTasks, {
    renderer: verbose ? VerboseRenderer : 'default',
    concurrent: true,
  })

  try {
    await tasks.run()
  } catch (e) {
    console.log()
    console.error(c.warning('Not all routes were succesfully prerendered'))
    console.error(
      c.info(
        `we could not prerender your page, but your Redwood app should still work fine.`
      )
    )
    console.error(
      c.info(
        `This could mean that a library you're using does not support SSR.`
      )
    )
    console.log()
    console.error(e)
    console.log()
    process.exit(1)
  }
}
