import path from 'path'

import fg from 'fast-glob'
import task from 'tasuku'

import runTransform from '../../../lib/runTransform'

export const command = 'update-graphql-function'
export const description =
  '(v0.36->v0.37) Updates the imports and createGraphQLHandler in the GraphQL Function'

export const handler = () => {
  task('Updating the GraphQL Function', async () => {
    runTransform({
      transformPath: path.join(__dirname, 'updateGraphQLFunction.js'),
      targetPaths: fg.sync('api/src/functions/graphql.{js,ts}'),
    })
  })
}
