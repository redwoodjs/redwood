import { Listr } from 'listr2'

import { recordTelemetryAttributes } from '@redwoodjs/cli-helpers'

import {
  existsAnyExtensionSync,
  deleteFile,
  readFile,
  writeFile,
  getGraphqlPath,
} from '../../../lib'
import c from '../../../lib/colors'
import { getOutputPath } from '../../setup/graphiql/graphiqlHelpers'

const removeGraphiqlFromGraphqlHandler = () => {
  const graphqlPath = getGraphqlPath()
  let content = readFile(graphqlPath).toString()
  const [_, hasHeaderImport] =
    content.match(/(import .* from 'src\/lib\/generateGraphiQLHeader.*')/s) ||
    []
  if (hasHeaderImport) {
    // remove header import statement
    content = content.replace(
      `\n\nimport generateGraphiQLHeader from 'src/lib/generateGraphiQLHeader'`,
      ''
    )
    // remove object from handler
    content = content.replace(`generateGraphiQLHeader,\n`, '')
  }
  writeFile(graphqlPath, content, {
    overwriteExisting: true,
  })
}
export const command = 'graphiql'
export const description = 'Destroy graphiql header'

export const handler = () => {
  recordTelemetryAttributes({
    command: 'destory graphiql',
  })
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
    { rendererOptions: { collapseSubtasks: false }, exitOnError: true }
  )
  try {
    tasks.run()
  } catch (e) {
    console.log(c.error(e.message))
  }
}
