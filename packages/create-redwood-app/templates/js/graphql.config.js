// This file is used by the VSCode GraphQL Extension

const { getPaths } = require('@redwoodjs/project-config')

module.exports = {
  schema: getPaths().generated.schema,
  documents: './web/src/**/!(*.d).{ts,tsx,js,jsx}',
}
