import path from 'path'

import pluginTester from 'babel-plugin-tester'

import redwoodGraphqlOptionsExtract from '../babel-plugin-redwood-graphql-options-extract'

jest.mock('@redwoodjs/project-config', () => {
  return {
    getBaseDirFromFile: () => {
      return ''
    },
  }
})

pluginTester({
  plugin: redwoodGraphqlOptionsExtract,
  pluginName: 'babel-plugin-redwood-graphql-options-extract',
  fixtures: path.join(__dirname, '__fixtures__/graphql-options-extract'),
})
