/**
 * This file allows you to configure the Fastify Server settings
 * used by the RedwoodJS dev server.
 *
 * It also applies when running the api server with `yarn rw serve`.
 *
 * For the Fastify server options that you can set, see:
 * https://www.fastify.io/docs/latest/Reference/Server/#factory
 *
 * Examples include: logger settings, timeouts, maximum payload limits, and more.
 *
 * Note: This configuration does not apply in a serverless deploy.
 */

/** @type {import('fastify').FastifyServerOptions} */
const config = {
  requestTimeout: 15_000,
  logger: {
    level: process.env.NODE_ENV === 'development' ? 'debug' : 'warn',
  },
}

/* _Important note! If you are using @fastify/compress plugin together with @fastify/static plugin,_ you must register the @fastify/compress (with global hook) before registering @fastify/static. */
 const registerPreStaticPlugins = async (fastify) => { fastify.logger.debug('Registering pre-static plugin')
 await fastify.register(import('@fastify/compress'), { global: false })}

     const registerApiProxyPlugins = async (fastify) => { fastify.logger.debug('Registering api proxy plugin')}
     const registerFunctionPlugins = async (fastify) => { fastify.logger.debug('Registering function plugin')}
     const registerWebServerPlugins = async (fastify) => { fastify.logger.debug('Registering web server plugin')}

module.exports = config
