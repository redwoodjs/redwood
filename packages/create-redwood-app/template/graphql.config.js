const { getPaths } = require('@redwoodjs/internal-paths')

module.exports = {
  schema: getPaths().generated.schema,
}
