/**
 * This config allows you to configure the fastify settings for the
 * dev api server, but also if you are using `yarn rw serve`
 *
 *  See https://www.fastify.io/docs/latest/Reference/Server/#factory
 *
 * Note: They do not apply on serverless deploy
 */

/** @type {import('fastify').FastifyServerOptions} */
const config = {
  requestTimeout: 15000,
  logger: {
    level: process.env.NODE_ENV === 'development' ? 'debug' : 'warn',
  },
}

module.exports = config
