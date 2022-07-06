import { FastifyInstance } from 'fastify'

import { loadServerConfig } from '../cliHandlers'

function registerPlugins(fastify: FastifyInstance, plugins: any[]) {
  plugins?.forEach(async (plugin: any) => {
    if (plugin.async) {
      try {
        Promise.all([
          await fastify.register(require(plugin.name), plugin.options),
          fastify.log.debug(
            `Loaded async plugin ${plugin.name} with options ${JSON.stringify(
              plugin.options
            )}\n`
          ),
        ])
      } catch (error) {
        fastify.log.error(error)
      }
    } else {
      fastify.register(require(plugin.name), plugin.options)
      fastify.log.debug(
        `Loaded plugin ${plugin.name} with options ${JSON.stringify(
          plugin.options
        )}\n`
      )
    }
  })
}

export function registerWebPlugins(fastify: FastifyInstance) {
  const { web } = loadServerConfig()

  fastify.log.debug(`Loading web plugins .... \n`)

  registerPlugins(fastify, web?.plugins)
}

export function registerFunctionPlugins(fastify: FastifyInstance) {
  const { functions } = loadServerConfig()

  fastify.log.debug(`Loading function plugins .... \n`)

  registerPlugins(fastify, functions?.plugins)
}

export function registerProxyPlugins(fastify: FastifyInstance) {
  const { proxy } = loadServerConfig()

  fastify.log.debug(`Loading api proxy plugins .... \n`)

  registerPlugins(fastify, proxy?.plugins)
}
