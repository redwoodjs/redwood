import { runPrerender } from '@redwoodjs/prerender'
import { getProject } from '@redwoodjs/structure'

import c from '../lib/colors'

export const command = 'prerender'
export const aliases = ['render']
export const description = 'Prerender pages of a redwood app (experimental)'

export const builder = (yargs) => {
  yargs.option('input', {
    alias: 'input',
    default: false,
    description: 'Input file to prerender',
    type: 'string',
  })

  yargs.option('output', {
    alias: 'output',
    default: false,
    description: 'Output path',
    type: 'string',
  })
}

const mapRouterPathToHtml = (routerPath) => {
  if (routerPath === '/') {
    return 'web/dist/index.html'
  } else {
    return `web/dist${routerPath}.html`
  }
}

export const handler = async ({ input, output }) => {
  if (input && output) {
    runPrerender({
      inputComponentPath: input,
      outputHtmlPath: output,
    })

    return
  }

  // Prerendering without input/output defined
  const rwProject = getProject(process.cwd())
  const routes = rwProject.getRouter().routes

  const prerenderRoutes = routes
    .filter((r) => !r.isNotFound)
    .filter((r) => r.prerender)
    .map((route) => ({
      name: route.name,
      path: route.path,
      hasParams: route.hasParameters,
      id: route.id,
      filePath: route.page.filePath,
    }))

  // @TODO for <Private> routes only render whileLoading or the layout
  // @TODO what do we do about Cells?
  // @TODO how do we deal with the routes import from router?

  prerenderRoutes.map((routeToPrerender) => {
    const outputHtmlPath = mapRouterPathToHtml(routeToPrerender.path)

    console.log(
      `Starting prerender for ${c.green(routeToPrerender.name)} -> ${c.green(
        outputHtmlPath
      )}`
    )

    runPrerender({
      inputComponentPath: routeToPrerender.filePath,
      outputHtmlPath,
    })
  })
}
