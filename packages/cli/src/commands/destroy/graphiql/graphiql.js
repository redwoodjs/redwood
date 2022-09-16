import { Listr } from 'listr2'

import {
  existsAnyExtensionSync,
  deleteFile,
  readFile,
  writeFile,
  getGraphqlPath,
} from '../../../lib'
import c from '../../../lib/colors'
import { getOutputPath } from '../../setup/graphiql/graphiql'

const removeGraphiqlFromGraphqlHandler = () => {
  const graphqlPath = getGraphqlPath()
  let content = readFile(graphqlPath).toString()

  const [_, hasHeaderImport] =
    content.match(
      /(import {.*generateGraphiQLHeader.*} from '@redwoodjs\/graphql-server')/s
    ) || []

  if (hasHeaderImport) {
    // remove import and object from handler
    content = content.replaceAll(`generateGraphiQLHeader,\n`, '')
  }
  writeFile(graphqlPath, content, {
    overwriteExisting: true,
  })
}
export const command = 'graphiql'
export const description = 'Destroy graphiql header'

export const handler = () => {
  const path = getOutputPath()
  const tasks = new Listr(
    [
      {
        title: 'Destroying graphiql files...',
        skip: () => !existsAnyExtensionSync(path) && `File doesn't exist`,
        task: () => deleteFile(path),
      },
      {
        title: 'Removing graphiql import from createGraphQLHandler',
        task: removeGraphiqlFromGraphqlHandler,
      },
    ],
    { rendererOptions: { collapse: false }, exitOnError: true }
  )
  try {
    tasks.run()
  } catch (e) {
    console.log(c.error(e.message))
  }
}
