const { getConfig } = require('@redwoodjs/internal')

const config = getConfig()

module.exports = {
  schema: `http://${config.api.host}:${config.api.port}/graphql`,
}
