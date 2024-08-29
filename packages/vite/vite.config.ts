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

let viteEnvRscRunner: ModuleRunner

export function vitePluginSSR(): PluginOption {
  const plugin: Plugin = {
    name: vitePluginSSR.name,
    async configureServer(server) {
      const runner = createServerModuleRunner(server.environments.ssr)
      const handler: Connect.NextHandleFunction = async (req, res, next) => {
        const { ssrHandler } = await runner.import(
          'src/environments/entry-ssr.tsx',
        )
        createMiddleware((ctx) =>
          ssrHandler(ctx.request, { viteEnvRscRunner }),
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
      if (!config.environments) {
        throw new Error('config.environments is undefined')
      }

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
      viteEnvRscRunner = createServerModuleRunner(envs['react-server'])
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
      name: vitePluginRSC_UseClient.name,
      async transform(code, id) {
        if (this.environment.name !== 'react-server') {
          return
        }
        // TODO: Implement proper AST parsing & modification.
        // TODO: Implement module map.
        if (code.includes('"use client') || code.includes('"use client"')) {
          let newCode =
            'import { registerClientReference } from "/src/register/client.ts";'
          const [_, exports] = parse(code)
          for (const e of exports) {
            newCode += `export const ${e.ln} = registerClientReference(${JSON.stringify(id)}, ${JSON.stringify(e.ln)});`
          }
          return newCode
        }
      },
    },
  ]
}

export default defineConfig({
  appType: 'custom',
  environments: {
    'react-server': {},
  },
  plugins: [vitePluginReact(), vitePluginSSR(), vitePluginRSC()],
})
