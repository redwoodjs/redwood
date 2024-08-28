import { createMiddleware } from '@hattip/adapter-node'
import react from '@vitejs/plugin-react'
import { defineConfig, createServerModuleRunner, type PluginOption, type Plugin, type Connect } from "vite";
import type { ModuleRunner } from 'vite/module-runner';

// Define our own SSR plugin.

let viteEnvRscRunner: ModuleRunner = undefined


export function vitePluginSSR(): PluginOption {
  const plugin: Plugin = {
    name: vitePluginSSR.name,


    configEnvironment(name, _config, _env) {
      if (name !== 'ssr') {
        return
      }
      return {}
    },
    async configureServer(server) {
      console.log('vitePluginSsrMiddleware.configureServer')
      const runner = createServerModuleRunner(server.environments.ssr)
      const handler: Connect.NextHandleFunction = async (req, res, next) => {
        const { handler: ssrHandler } = await runner.import('src/environments/entry-ssr.tsx')
        createMiddleware((ctx) => ssrHandler(ctx.request, { viteEnvRscRunner }))(req, res, next)
      }
      return () => server.middlewares.use(handler)
    },
  }

  return [plugin]
}

function vitePluginRSC(): PluginOption {
  const setupEnvironmentPlugin: Plugin = {
    name: vitePluginRSC.name + ":setupEnvironment",
    config(config, _env) {
      if (!config.environments) {
        throw new Error('config.environments is undefined')
      }

      config.environments['react-server'] = {
        resolve: {
          conditions: ['react-server'],
          noExternal: true
        },
        dev: {
          optimizeDeps: {
            include: [
              "react",
              "react/jsx-runtime",
              "react/jsx-dev-runtime",
              "react-server-dom-webpack/server.edge",
            ],
          }
        }
      }
    },
    configResolved(config) {
      // manager.config = config;
    },
    async configureServer(server) {
      // @ts-expect-error: The type definitions appear incorrect
      if (!server.environments['react-server']) {
        throw new Error('react-server environment is undefined')
      }
      // const rscRunner =
      viteEnvRscRunner = createServerModuleRunner(server.environments["react-server"]);
      // $__global.server = server;
      // $__global.rscRunner = rscRunner;
    },
    hotUpdate(_ctx) {



      // if (this.environment.name === 'react-server') {

      //   const ids = ctx.modules.map((module) => module.id).filter(id => typeof id === 'string')
      //   console.log(ids)

      //   if (ids.length > 0) {

      //     const invalidated = $__global.rscRunner.moduleCache.invalidateDepTree(ids)

      //     console.log(invalidated)
      //     // client handles hot reloading for interactive modules.
      //     $__global.server.environments.client.hot.send({
      //       type: "custom",
      //       event: "react-server:update",
      //       data: {
      //         file: ctx.file,
      //       },
      //     });
      //   }
      //   return []
      // }
      // return;
    }
  }

  return [
    setupEnvironmentPlugin,
    // vitePluginUseClient(),
    // vitePluginServerAction(),
    // vitePluginEntryBrowser(),
    // vitePluginServerAssets(),
  ]
}


export default defineConfig({
  appType: 'custom',
  environments: {
    ["react-server"]: {

    }
  },
  plugins: [
    react(),
    vitePluginSSR(),
    vitePluginRSC(),
  ]
})