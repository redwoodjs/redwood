import Listr from 'listr'
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
  dryrun: boolean
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

  yargs.option('dryrun', {
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

export const handler = async ({ path, output, dryrun, verbose }: CliArgs) => {
  if (path) {
    await runPrerender({
      routerPath: path,
      outputHtmlPath: output,
      dryRun: dryrun,
    })

    return
  }

  const prerenderRoutes = detectPrerenderRoutes()

  const listrTasks = prerenderRoutes
    .map((routeToPrerender) => {
      if (!routeToPrerender.path) {
        // Skip if path not specified
        return
      }

      const outputHtmlPath = mapRouterPathToHtml(routeToPrerender.path)

      return {
        title: `Prerendering ${routeToPrerender.path} -> ${outputHtmlPath}`,
        task: async () => {
          try {
            await runPrerender({
              routerPath: routeToPrerender.path as string,
              outputHtmlPath,
              dryRun: dryrun,
            })
            return
          } catch (e) {
            console.error(
              `❌  ${c.error(
                routeToPrerender.name
              )} failed to rerender: ${c.info(routeToPrerender.filePath)}`
            )
            console.log(
              c.warning(
                `This means you won't get a prerendered page, but your Redwood app should still work fine.`
              )
            )
            console.log(
              c.warning(
                `It often means that a library you are using, or your code, is not optimised for SSR \n`
              )
            )
            console.error(e)
            console.log(
              c.info('------------------------------------------------')
            )
          }
        },
      }
    })
    .filter(Boolean)

  const tasks = new Listr(listrTasks, {
    renderer: verbose && VerboseRenderer,
  })

  await tasks.run()
}
