const { getPaths } = require('@redwoodjs/config')

module.exports = {
  schema: getPaths().generated.schema,
}
