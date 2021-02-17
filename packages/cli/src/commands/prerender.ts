import Listr, { ListrTask } from 'listr'
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore-next-line
import VerboseRenderer from 'listr-verbose-renderer'
import { Argv } from 'yargs'

import { runPrerender, detectPrerenderRoutes } from '@redwoodjs/prerender'

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore-next-line
import c from '../lib/colors'

export const command = 'prerender'
export const aliases = ['render']
export const description = 'Prerender pages of a redwood app (experimental)'

interface CliArgs {
  path: string
  output: string
  dryRun: boolean // dry-run gets converted
  verbose?: boolean
}

export const builder = (yargs: Argv<CliArgs>) => {
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

const mapRouterPathToHtml = (routerPath: string) => {
  if (routerPath === '/') {
    return 'web/dist/index.html'
  } else {
    return `web/dist${routerPath}.html`
  }
}

// This can be used directly in build.js for nested ListrTasks
export const getListrTasks = (dryrun: boolean) => {
  const prerenderRoutes = detectPrerenderRoutes()

  if (prerenderRoutes.length < 1) {
    return
  }

  const listrTasks: ListrTask<() => Promise<void>>[] = prerenderRoutes
    .filter((route) => route.path)
    .map((routeToPrerender) => {
      const outputHtmlPath = mapRouterPathToHtml(
        routeToPrerender.path as string
      )

      return {
        title: `Prerendering ${routeToPrerender.path} -> ${outputHtmlPath}`,
        task: () => {
          return runPrerender({
            routerPath: routeToPrerender.path as string,
            outputHtmlPath,
            dryRun: dryrun,
          })
        },
      }
    })

  return listrTasks
}

export const handler = async ({ path, output, dryRun, verbose }: CliArgs) => {
  if (path) {
    await runPrerender({
      routerPath: path,
      outputHtmlPath: output,
      dryRun,
    })

    return
  }

  const listrTasks = getListrTasks(dryRun)

  const tasks = new Listr(listrTasks, {
    renderer: verbose ? VerboseRenderer : 'default',
    concurrent: true,
  })

  try {
    await tasks.run()
  } catch (e) {
    console.error(c.warning('\nNot all routes were succesfully prerendered'))
    console.error(
      c.info(
        `You won't get a prerendered page, but your Redwood app should still work fine.`
      )
    )
    console.log(
      c.info(
        `It often means that a library you are using, or your code, is not optimised for SSR \n`
      )
    )

    if (verbose) {
      // Don't colourise as it truncates the error
      console.error(e)
    }

    // To make sure yarn rw build fails, if pages can't be prererendered
    process.exit(1)
  }
}
