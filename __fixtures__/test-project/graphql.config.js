const { getPaths } = require('@redwoodjs/paths')

module.exports = {
  schema: getPaths().generated.schema,
}
