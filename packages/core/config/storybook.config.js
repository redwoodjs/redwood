const { getPaths } = require('@redwoodjs/internal')

module.exports = {
  stories: [`${getPaths().web.src}/src/**/*.stories.[tj]s`],
}
