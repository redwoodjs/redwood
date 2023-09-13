import fs from 'fs'
import path from 'path'

import execa from 'execa'
import { Listr } from 'listr2'

import { registerApiSideBabelHook } from '@redwoodjs/babel-config'
import { errorTelemetry } from '@redwoodjs/telemetry'

import {
  generateTemplate,
  writeFilesTask,
  readFile,
  transformTSToJS,
  existsAnyExtensionSync,
  getGraphqlPath,
  graphFunctionDoesExist,
} from '../../../lib'
import c from '../../../lib/colors'
import { isTypeScriptProject } from '../../../lib/project'

import { getOutputPath, generatePayload } from './graphiqlHelpers'
import { supportedProviders } from './supportedProviders'

const addHeaderOption = () => {
  const graphqlPath = getGraphqlPath()
  let content = readFile(graphqlPath).toString()

  const [_, hasHeaderImport] =
    content.match(/(import .* from 'src\/lib\/generateGraphiQLHeader.*')/s) ||
    []

  if (!hasHeaderImport) {
    // add header import statement
    content = content.replace(
      /^(.*services.*)$/m,
      `$1\n\nimport generateGraphiQLHeader from 'src/lib/generateGraphiQLHeader'`
    )
    // add object to handler
    content = content.replace(
      /^(\s*)(loggerConfig:)(.*)$/m,
      `$1generateGraphiQLHeader,\n$1$2$3`
    )

    fs.writeFileSync(graphqlPath, content)
  }
}

const printHeaders = async () => {
  // Import babel settings so we can write es6 scripts
  registerApiSideBabelHook()

  const srcPath = getOutputPath()
  if (!existsAnyExtensionSync(srcPath) && `File doesn't exist`) {
    throw new Error(
      'Must run yarn rw setup graphiql <provider> to generate headers before viewing'
    )
  }

  const script = require(srcPath)
  await script.default()
}

export const handler = async ({ provider, id, token, expiry, view }) => {
  let payload

  const tasks = new Listr(
    [
      {
        title: 'Generating graphiql header...',
        task: () => {
          payload = generatePayload(provider, id, token, expiry)
        },
      },
      {
        title: 'Generating file in src/lib/generateGraphiQLHeader.{js,ts}...',
        task: () => {
          const fileName =
            token || provider === 'dbAuth'
              ? 'graphiql-token.ts.template'
              : 'graphiql-mock.ts.template'

          const content = generateTemplate(
            path.join(__dirname, 'templates', fileName),
            {
              name: 'graphiql',
              payload: JSON.stringify(payload),
              env: supportedProviders[provider].env,
              provider,
              expireTime: expiry
                ? new Date(Date.now() + expiry * 60 * 1000)
                : new Date(Date.now() + 3600 * 1000),
            }
          )

          const outputPath = getOutputPath()

          return writeFilesTask(
            {
              [outputPath]: isTypeScriptProject()
                ? content
                : transformTSToJS(outputPath, content),
            },
            { overwriteExisting: true }
          )
        },
      },
      {
        title: 'Importing generated headers into createGraphQLHandler',
        task: (ctx, task) => {
          if (graphFunctionDoesExist()) {
            addHeaderOption()
          } else {
            task.skip('GraphQL function not found, skipping')
          }
        },
      },
      {
        title: 'Installing packages...',
        task: async () => {
          if (!token && provider !== 'dbAuth') {
            await execa('yarn', ['workspace', 'api', 'add', 'jsonwebtoken'])
          }
        },
      },
    ].filter(Boolean),
    { rendererOptions: { collapseSubtasks: false } }
  )

  try {
    if (view) {
      return await printHeaders()
    }
    await tasks.run()
  } catch (e) {
    errorTelemetry(process.argv, e.message)
    console.error(c.error(e.message))
    process.exit(e?.exitCode || 1)
  }
}
