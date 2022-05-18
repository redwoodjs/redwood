import fs from 'fs'
import path from 'path'

import CryptoJS from 'crypto-js'
import Listr from 'listr'
import terminalLink from 'terminal-link'
import { v4 as uuidv4 } from 'uuid'

import { getProject } from '@redwoodjs/structure'
import { errorTelemetry } from '@redwoodjs/telemetry'

import {
  generateTemplate,
  writeFilesTask,
  readFile,
  getPaths,
} from '../../../lib'
import c from '../../../lib/colors'
import { graphFunctionDoesExist, getGraphqlPath } from '../auth/auth'

// tests if id, which is always a string from cli, is actually a number or uuid
const isNumeric = (id) => {
  return /^\d+$/.test(parseInt(id))
}

const getDBAuthHeader = (userId) => {
  if (!userId) {
    throw new Error('Require unique id to generate session cookie')
  }

  if (!process.env.SESSION_SECRET) {
    throw new Error(
      'dbAuth requires a SESSION_SECRET environment variable that is used to encrypt session cookies. Use `yarn rw g secret` to create one, then add to your `.env` file. DO NOT check this variable in your version control system!!'
    )
  }
  const id = isNumeric(userId) ? parseInt(userId) : userId
  const cookie = CryptoJS.AES.encrypt(
    JSON.stringify({ id }) + ';' + uuidv4(),
    process.env.SESSION_SECRET
  ).toString()

  return {
    'auth-provider': 'dbAuth',
    cookie: `session=${cookie}`,
    authorization: `Bearer ${id}`,
  }
}

const getSupabasePayload = () => {
  if (!process.env.SUPABASE_JWT_SECRET) {
    throw new Error('SUPABASE_JWT_SECRET env var is not set.')
  }
  // set expiry 1 hour from now
  const exp = Date.now() + 3600 * 1000
  const payload = {
    aud: 'authenticated',
    exp,
    sub: 'test-user-id',
    email: 'user@example.com',
    app_metadata: {
      provider: 'email',
    },
    user_metadata: {},
    role: 'authenticated',
    roles: [],
  }

  const mock = {
    payload,
    'auth-provider': 'supabase',
  }
  return mock
}

const supportedProviders = {
  dbAuth: getDBAuthHeader,
  supabase: getSupabasePayload,
}

const generateHeaderOrMock = (provider, id, token) => {
  if (token) {
    return {
      'auth-provider': provider,
      authorization: `Bearer ${token}`,
    }
  }

  return supportedProviders[provider](id)
}

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

export const command = 'header <provider>'
export const description = 'Generate GraphiQL headers'
export const builder = (yargs) => {
  yargs
    .positional('provider', {
      choices: Object.keys(supportedProviders),
      description: 'Auth provider used',
      type: 'string',
    })
    .option('id', {
      alias: 'i',
      default: false,
      description: 'Unique id to identify current user',
      type: 'string',
    })
    .option('token', {
      alias: 't',
      default: false,
      description:
        'Generated JWT token. If not provided, mock JWT payload is provided that can be modified and tured into a token',
      type: 'string',
    })
    .epilogue(
      `Also see the ${terminalLink(
        'Redwood CLI Reference',
        'https://redwoodjs.com/docs/cli-commands#setup-header'
      )}`
    )
}

export const handler = async ({ provider, id, token }) => {
  let header
  const tasks = new Listr(
    [
      {
        title: 'Generating header...',
        task: () => {
          header = generateHeaderOrMock(provider, id, token)
        },
      },
      {
        title: 'Generating file in src/lib/generateGraphiQLHeader.js...',
        task: () => {
          const content = generateTemplate(
            path.join(__dirname, 'templates', 'header.js.template'),
            {
              name: 'header',
              header: JSON.stringify(header),
            }
          )
          const outputPath = path.join(
            getPaths().api.lib,
            getProject().isTypeScriptProject
              ? 'generateGraphiQLHeader.ts'
              : 'generateGraphiQLHeader.js'
          )
          return writeFilesTask(
            { [outputPath]: content },
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
    ].filter(Boolean),
    { collapse: false }
  )

  try {
    await tasks.run()
  } catch (e) {
    errorTelemetry(process.argv, e.message)
    console.error(c.error(e.message))
    process.exit(e?.exitCode || 1)
  }
}
