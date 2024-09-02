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
          ssrHandler(ctx.request, { viteEnvRunnerRSC }),
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

          console.log('❌', this.environment.name, id)

          return c
        }
      },
    },
  ]
}

export default defineConfig({
  appType: 'custom',
  base: '/',
  clearScreen: false,
  plugins: [vitePluginReact(), vitePluginSSR(), vitePluginRSC()],
})
