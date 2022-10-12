import fs from 'fs'
import path from 'path'

import CryptoJS from 'crypto-js'
import execa from 'execa'
import { Listr } from 'listr2'
import terminalLink from 'terminal-link'
import { v4 as uuidv4 } from 'uuid'

import { registerApiSideBabelHook } from '@redwoodjs/internal/dist/build/babel/api'
import { errorTelemetry } from '@redwoodjs/telemetry'

import {
  generateTemplate,
  writeFilesTask,
  readFile,
  getPaths,
  transformTSToJS,
  existsAnyExtensionSync,
  getGraphqlPath,
  graphFunctionDoesExist,
} from '../../../lib'
import c from '../../../lib/colors'
import { isTypeScriptProject } from '../../../lib/project'

// tests if id, which is always a string from cli, is actually a number or uuid
const isNumeric = (id) => {
  return /^\d+$/.test(parseInt(id))
}

const getExpiryTime = (expiry) => {
  return expiry ? Date.now() + expiry * 60 * 1000 : Date.now() + 3600 * 1000
}

const getDBAuthHeader = (userId) => {
  if (!userId) {
    throw new Error('Require an unique id to generate session cookie')
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

const getSupabasePayload = (id, expiry) => {
  if (!process.env.SUPABASE_JWT_SECRET) {
    throw new Error('SUPABASE_JWT_SECRET env var is not set.')
  }

  const payload = {
    aud: 'authenticated',
    exp: getExpiryTime(expiry),
    sub: id ?? 'test-user-id',
    email: 'user@example.com',
    app_metadata: {
      provider: 'email',
    },
    user_metadata: {},
    role: 'authenticated',
    roles: [],
  }

  return payload
}

const getNetlifyPayload = (id, expiry) => {
  const payload = {
    exp: getExpiryTime(expiry),
    sub: id ?? 'test-user-id',
    email: 'user@example.com',
    app_metadata: {
      provider: 'email',
      authorization: {
        roles: [],
      },
    },
    user_metadata: {},
  }

  return payload
}

const supportedProviders = {
  dbAuth: { getPayload: getDBAuthHeader, env: '' },
  supabase: {
    getPayload: getSupabasePayload,
    env: 'process.env.SUPABASE_JWT_SECRET',
  },
  // no access to netlify JWT private key in dev.
  netlify: { getPayload: getNetlifyPayload, env: '"secret-123"' },
}

export const generatePayload = (provider, id, token, expiry) => {
  if (token) {
    return {
      'auth-provider': provider,
      authorization: `Bearer ${token}`,
    }
  }

  return supportedProviders[provider].getPayload(id, expiry)
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

export const getOutputPath = () => {
  return path.join(
    getPaths().api.lib,
    isTypeScriptProject()
      ? 'generateGraphiQLHeader.ts'
      : 'generateGraphiQLHeader.js'
  )
}

export const printHeaders = async () => {
  // Import babel settings so we can write es6 scripts
  registerApiSideBabelHook()

  const srcPath = getOutputPath()
  if (!existsAnyExtensionSync(srcPath) && `File doesn't exist`) {
    throw new Error(
      'Must run yarn rw setup graphiql <provider> to generate headers before viewing'
    )
  }

  const script = await import(srcPath)
  await script.default()
}

export const command = 'graphiql <provider>'
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
      description: 'Unique id to identify current user',
      type: 'string',
    })
    .option('token', {
      alias: 't',
      description:
        'Generated JWT token. If not provided, mock JWT payload is provided that can be modified and turned into a token',
      type: 'string',
    })
    .option('expiry', {
      alias: 'e',
      default: 60,
      description: 'Token expiry in minutes. Default is 60',
      type: 'number',
    })
    .option('view', {
      alias: 'v',
      default: false,
      description: 'Print out generated headers',
      type: 'boolean',
    })
    .epilogue(
      `Also see the ${terminalLink(
        'Redwood CLI Reference',
        'https://redwoodjs.com/docs/cli-commands#setup-header'
      )}`
    )
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
    { rendererOptions: { collapse: false } }
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
