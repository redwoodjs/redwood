import path from 'path'

import fg from 'fast-glob'
import task from 'tasuku'

import { getPaths as getRWPaths } from '@redwoodjs/internal'

import runTransform from '../../../lib/runTransform'

export const command = 'update-graphql-function'
export const description = 'Updates GraphQL functions'

export const handler = () => {
  task('Updating GraphQL functions', async () => {
    const rwPaths = getRWPaths()

    runTransform({
      transformPath: path.join(__dirname, 'updateGraphQLFunction.js'),
      targetPaths: fg.sync(path.join(rwPaths.api.functions, 'graphql.{js,ts}')),
    })
  })
}
