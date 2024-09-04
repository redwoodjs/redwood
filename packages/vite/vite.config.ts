import path from 'node:path'

import { createMiddleware } from '@hattip/adapter-node'
import vitePluginReact from '@vitejs/plugin-react'
import { init, parse } from 'es-module-lexer'
import type { DevEnvironment } from 'vite'
import {
  defineConfig,
  createServerModuleRunner,
  type PluginOption,
  type Plugin,
  type Connect,
} from 'vite'
import type { ModuleRunner } from 'vite/module-runner'

await init

let viteEnvRunnerRSC: ModuleRunner

export function vitePluginSSR(): PluginOption {
  const plugin: Plugin = {
    name: vitePluginSSR.name,
    async configureServer(server) {
      const viteEnvRunnerSSR = createServerModuleRunner(server.environments.ssr)
      const handler: Connect.NextHandleFunction = async (req, res, next) => {
        const { ssrHandler } = await viteEnvRunnerSSR.import(
          'src/envs/entry-ssr.tsx',
        )
        createMiddleware((ctx) =>
          ssrHandler({ req: ctx.request, viteEnvRunnerRSC }),
        )(req, res, next)
      }
      return () => server.middlewares.use(handler)
    },
  }
  return [plugin]
}

function vitePluginRSC(): PluginOption {
  const setupEnvironmentPlugin: Plugin = {
    name: vitePluginRSC.name + ':setupEnvironment',
    config(config, _env) {
      config.environments = config.environments ?? {}
      config.environments['react-server'] = {
        resolve: {
          conditions: ['react-server'],
          noExternal: true,
        },
        dev: {
          optimizeDeps: {
            include: [
              'react',
              'react/jsx-runtime',
              'react/jsx-dev-runtime',
              'react-server-dom-webpack/server.edge',
            ],
          },
        },
      }
    },
    async configureServer(server) {
      // TODO: Determine what's wrong with the "server.environments" type. Report to Vite team?
      const envs = server.environments as Record<
        'ssr' | 'client' | 'react-server',
        DevEnvironment
      >
      if (!envs['react-server']) {
        throw new Error('"react-server" environment is undefined.')
      }
      viteEnvRunnerRSC = createServerModuleRunner(envs['react-server'])
    },
    hotUpdate(_ctx) {
      // TODO: Implement later.
    },
  }

  return [setupEnvironmentPlugin, vitePluginRSC_UseClient()]
}

function vitePluginRSC_UseClient(): PluginOption {
  return [
    {
      name: vitePluginRSC_UseClient.name + ':transform',
      async transform(code, id) {
        console.log(this.environment.name, id)

        if (this.environment.name !== 'react-server') {
          return
        }

        // TODO: Implement AST parsing & modification.
        if (code.includes('"use client"') || code.includes("'use client'")) {
          let c =
            'import { registerClientReference } from "/src/envs/register/client.ts";'
          const [_, exports] = parse(code)
          for (const e of exports) {
            c += `export const ${e.ln} = registerClientReference(${JSON.stringify(id)}, ${JSON.stringify(e.ln)});`
          }

          return c
        }
      },
    },
  ]
}

function vitePlugin_Redwood_Router_NotFoundPage(): PluginOption {
  const virtualModuleId = 'virtual:redwoodjs-not-found-page'
  const resolvedVirtualModuleId = '\0' + virtualModuleId
  return [
    {
      name: vitePlugin_Redwood_Router_NotFoundPage.name,
      async resolveId(source) {
        if (source !== virtualModuleId) {
          return undefined
        }

        // TODO(jgmw): We must set the env var so this function picks up the mock project directory
        process.env.RWJS_CWD = path.join(
          import.meta.dirname,
          'src',
          'envs',
          '__example__',
        )

        // Extract the routes from the AST of the Routes.tsx file
        const { getProjectRoutes } = await import('@redwoodjs/internal')
        const routes = getProjectRoutes()

        // Find the not found route
        const notFoundRoute = routes.find((route) => route.isNotFound)
        if (!notFoundRoute) {
          return resolvedVirtualModuleId
        }

        // Extract the pages from the project structure
        // TODO(jgmw): Not thrilled about using the deprecated function
        const { processPagesDir } = await import('@redwoodjs/project-config')
        const pages = processPagesDir()

        const notFoundPage = pages.find(
          (page) => page.constName === notFoundRoute.pageIdentifier,
        )
        if (!notFoundPage) {
          return resolvedVirtualModuleId
        }

        // We return the path to page the user specified to handle 404s
        return notFoundPage.path
      },
      // Load provides a fallback to a default 404 page
      load(id) {
        if (id !== resolvedVirtualModuleId) {
          return undefined
        }
        // This is the most basic 404 page
        return 'export default () => "404"'
      },
    },
  ]
}

function vitePlugin_Redwood_LoadPageForRoute(): PluginOption {
  const virtualModuleId = 'virtual:redwoodjs-load-page-for-route'
  return [
    {
      name: vitePlugin_Redwood_LoadPageForRoute.name,
      async resolveId(source) {
        if (!source.startsWith(virtualModuleId)) {
          return undefined
        }

        // TODO(jgmw): We must set the env var so this function picks up the mock project directory
        process.env.RWJS_CWD = path.join(
          import.meta.dirname,
          'src',
          'envs',
          '__example__',
        )

        // Get the route from the pathname
        const searchParams = new URLSearchParams(
          source.substring(virtualModuleId.length),
        )
        const pathname = searchParams.get('pathname')
        if (!pathname) {
          throw new Error('No pathname provided')
        }

        // Extract the routes from the AST of the Routes.tsx file
        const { getProjectRoutes } = await import('@redwoodjs/internal')
        const routes = getProjectRoutes()

        const { processPagesDir } = await import('@redwoodjs/project-config')
        const pages = processPagesDir()

        const { matchPath } = await import('@redwoodjs/router')

        for (const route of routes) {
          // TODO(jgmw): Handle route params
          const { match } = matchPath(route.pathDefinition, pathname)
          if (match) {
            const page = pages.find(
              (page) => page.constName === route.pageIdentifier,
            )
            if (!page) {
              throw new Error(
                `Could not find page for route: ${route.pageIdentifier}`,
              )
            }

            return page.path
          }
        }

        // Fallback to switching the id to the not-found page module
        return this.resolve('virtual:redwoodjs-not-found-page')
      },
    },
  ]
}

export default defineConfig({
  appType: 'custom',
  base: '/',
  clearScreen: false,
  plugins: [
    vitePluginReact(),
    vitePluginRSC(),
    vitePluginSSR(),
    vitePlugin_Redwood_LoadPageForRoute(),
    vitePlugin_Redwood_Router_NotFoundPage(),
  ],
})
