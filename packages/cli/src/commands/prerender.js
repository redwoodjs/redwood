import { runPrerender } from '@redwoodjs/prerender'
import { DefaultHost, getProject } from '@redwoodjs/structure'

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
      // importPath: route.page.importPath,
      componentPath: route.page.path.replace(`${process.cwd()}/`, ''),
      filePath: route.page.filePath,
    }))

  console.log(prerenderRoutes)

  // @TODO what we actually want to do is only render upto the layout
  // This is to avoid various issues of not having variables like _REDWOOD_PROXY_PATH etc

  // @TODO figure out how to use the directory import plugin here
  // page.path is the absolute path to the folder, so we remove the cwd
  // but even then its missing the full path, only points to the directory

  prerenderRoutes.map((routeToPrerender) => {
    const outputHtmlPath = mapRouterPathToHtml(routeToPrerender.path)

    runPrerender({
      inputComponentPath: routeToPrerender.filePath,
      outputHtmlPath,
    })
  })
}
