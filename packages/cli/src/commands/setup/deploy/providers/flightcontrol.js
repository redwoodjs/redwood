// import terminalLink from 'terminal-link'
import fs from 'fs'
import { EOL } from 'os'
import path from 'path'

import { getSchema, getConfig } from '@prisma/sdk'
import Listr from 'listr'

import { errorTelemetry } from '@redwoodjs/telemetry'

import { getPaths, writeFilesTask } from '../../../../lib'
import c from '../../../../lib/colors'
import { printSetupNotes, updateApiURLTask } from '../helpers'
import {
  flightcontrolConfig,
  databaseEnvVariables,
  postgresDatabaseService,
  mysqlDatabaseService,
} from '../templates/flightcontrol'

export const command = 'flightcontrol'
export const alias = 'fc'
export const description = 'Setup Flightcontrol deploy'

export const getFlightcontrolJson = async (database) => {
  if (database === 'none') {
    return {
      path: path.join(getPaths().base, 'flightcontrol.json'),
      content: flightcontrolConfig,
    }
  }
  if (!fs.existsSync(path.join(getPaths().base, 'api/db/schema.prisma'))) {
    throw new Error("Could not find prisma schema at 'api/db/schema.prisma'")
  }

  const schema = await getSchema(
    path.join(getPaths().base, 'api/db/schema.prisma')
  )
  const config = await getConfig({ datamodel: schema })
  const detectedDatabase = config.datasources[0].activeProvider

  if (detectedDatabase === database) {
    let dbService
    switch (database) {
      case 'postgresql':
        dbService = postgresDatabaseService
        break
      case 'mysql':
        dbService = mysqlDatabaseService
        break
      default:
        throw new Error(`
       Unexpected datasource provider found: ${database}`)
    }
    return {
      path: path.join(getPaths().base, 'flightcontrol.json'),
      content: {
        ...flightcontrolConfig,
        environments: [
          {
            ...flightcontrolConfig.environments[0],
            services: [
              ...flightcontrolConfig.environments[0].services.map((service) => {
                if (service.id === 'redwood-api') {
                  return {
                    ...service,
                    envVariables: databaseEnvVariables,
                  }
                }
                return service
              }),
              dbService,
            ],
          },
        ],
      },
    }
  } else {
    throw new Error(`
    Prisma datasource provider is detected to be ${detectedDatabase}.

    Update your schema.prisma provider to be postgresql or mysql, then run
    yarn rw prisma migrate dev
    yarn rw setup deploy flightcontrol
    `)
  }
}

const updateGraphQLFunction = () => {
  return {
    title: 'Adding CORS config to createGraphQLHandler...',
    task: (_ctx) => {
      const graphqlTsPath = path.join(
        getPaths().base,
        'api/src/functions/graphql.ts'
      )
      const graphqlJsPath = path.join(
        getPaths().base,
        'api/src/functions/graphql.js'
      )

      let graphqlFunctionsPath
      if (fs.existsSync(graphqlTsPath)) {
        graphqlFunctionsPath = graphqlTsPath
      } else if (fs.existsSync(graphqlJsPath)) {
        graphqlFunctionsPath = graphqlJsPath
      } else {
        console.log(`
    Couldn't find graphql handler in api/src/functions/graphql.js.
    You'll have to add the following cors config manually:

      cors: { origin: process.env.REDWOOD_API_URL, credentials: true}
    `)
        return
      }

      const graphqlContent = fs
        .readFileSync(graphqlFunctionsPath, 'utf8')
        .split(EOL)
      const graphqlHanderIndex = graphqlContent.findIndex((line) =>
        line.includes('createGraphQLHandler({')
      )

      if (graphqlHanderIndex === -1) {
        console.log(`
    Couldn't find graphql handler in api/src/functions/graphql.js.
    You'll have to add the following cors config manually:

      cors: { origin: process.env.REDWOOD_API_URL,, credentials: true}
    `)
        return
      }

      graphqlContent.splice(
        graphqlHanderIndex + 1,
        0,
        '  cors: { origin: process.env.REDWOOD_API_URL,, credentials: true },'
      )

      fs.writeFileSync(graphqlFunctionsPath, graphqlContent.join(EOL))
    },
  }
}

const updateDbAuth = () => {
  return {
    title: 'Updating dbAuth cookie config (if used)...',
    task: (_ctx) => {
      const authTsPath = path.join(getPaths().base, 'api/src/functions/auth.ts')
      const authJsPath = path.join(getPaths().base, 'api/src/functions/auth.js')

      let authFnPath
      if (fs.existsSync(authTsPath)) {
        authFnPath = authTsPath
      } else if (fs.existsSync(authJsPath)) {
        authFnPath = authJsPath
      } else {
        console.log(`Skipping, did not detect api/src/functions/auth.js`)
        return
      }

      const authContent = fs.readFileSync(authFnPath, 'utf8').split(EOL)
      const sameSiteLineIndex = authContent.findIndex((line) =>
        line.match(/SameSite:.*,/)
      )
      if (sameSiteLineIndex === -1) {
        console.log(`
    Couldn't find cookie SameSite config in api/src/functions/auth.js.

    You need to ensure SameSite is set to "None"
    `)
        return
      }
      authContent[sameSiteLineIndex] = `    SameSite: "None",`

      const dbHandlerIndex = authContent.findIndex((line) =>
        line.includes('new DbAuthHandler(')
      )
      if (dbHandlerIndex === -1) {
        console.log(`
    Couldn't find DbAuthHandler in api/src/functions/auth.js.
    You'll have to add the following cors config manually:

      cors: { origin: process.env.REDWOOD_API_URL,, credentials: true}
    `)
        return
      }
      authContent.splice(
        dbHandlerIndex + 1,
        0,
        '  cors: { origin: process.env.REDWOOD_API_URL,, credentials: true },'
      )

      fs.writeFileSync(authFnPath, authContent.join(EOL))
    },
  }
}

const updateApp = () => {
  return {
    title: 'Updating App.js fetch config...',
    task: (_ctx) => {
      const appTsPath = path.join(getPaths().base, 'web/src/App.tsx')
      const appJsPath = path.join(getPaths().base, 'web/src/App.js')

      let appPath
      if (fs.existsSync(appTsPath)) {
        appPath = appTsPath
      } else if (fs.existsSync(appJsPath)) {
        appPath = appJsPath
      } else {
        console.log(`Skipping, did not detect api/src/functions/auth.js`)
        return
      }

      const appContent = fs.readFileSync(appPath, 'utf8').split(EOL)
      const authLineIndex = appContent.findIndex((line) =>
        line.includes('<AuthProvider')
      )
      if (authLineIndex === -1) {
        console.log(`
    Couldn't find <AuthProvider in web/src/App.js
    You'll have to add the following fetch config manually:

    config={{ fetchConfig: { credentials: 'include' } }}
    `)
      } else {
        appContent[
          authLineIndex
        ] = `      <AuthProvider type="dbAuth" config={{ fetchConfig: { credentials: 'include' } }}>
`
      }

      const gqlLineIndex = appContent.findIndex((line) =>
        line.includes('<RedwoodApolloProvider')
      )
      if (gqlLineIndex === -1) {
        console.log(`
    Couldn't find <RedwoodApolloProvider in web/src/App.js
    You'll have to add the following fetch config manually:

    graphQLClientConfig={{ httpLinkConfig: { credentials: 'include' }}}
    `)
      } else {
        appContent[
          gqlLineIndex
        ] = `        <RedwoodApolloProvider graphQLClientConfig={{ httpLinkConfig: { credentials: 'include' }}} >
`
      }

      fs.writeFileSync(appPath, appContent.join(EOL))
    },
  }
}

// We need to set the apiUrl evn var for local dev
const addToDotEnvDefaultTask = () => {
  return {
    title: 'Updating .env.defaults...',
    skip: () => {
      if (!fs.existsSync(path.resolve(getPaths().base, '.env.defaults'))) {
        return `
        WARNING: could not update .env.defaults

        You'll have to add the following env var manually:

        REDWOOD_API_URL=/.redwood/functions
        `
      }
    },
    task: async (_ctx) => {
      const env = path.resolve(getPaths().base, '.env.defaults')
      const line = 'REDWOOD_API_URL=/.redwood/functions'

      fs.appendFileSync(env, line)
    },
  }
}

export const builder = (yargs) =>
  yargs.option('database', {
    alias: 'd',
    choices: ['none', 'postgresql', 'mysql'],
    description: 'Database deployment for Flightcontrol only',
    default: 'postgresql',
    type: 'string',
  })

// any notes to print out when the job is done
const notes = [
  'You are ready to deploy to Flightcontrol!\n',
  '1. Create your project at https://app.flightcontrol.dev/signup?ref=redwood',
  '2. After your project is provisioned,',
  `go to the Flightcontrol dashboard and set the REDWOOD_API_URL env var to the full URL of your API service, including 'https://'\n`,
  'Check out the deployment docs at https://morning-citrine-14f.notion.site/Flightcontrol-Docs-8d9ca4edb5564165a9557df32818af0c for detailed instructions\n',
  "NOTE: If you are using yarn v1, remove the installCommand's from flightcontrol.json",
]

export const handler = async ({ force, database }) => {
  const tasks = new Listr([
    {
      title: 'Adding flightcontrol.json',
      task: async () => {
        const fileData = await getFlightcontrolJson(database)
        let files = {}
        files[fileData.path] = JSON.stringify(fileData.content, null, 2)
        return writeFilesTask(files, { overwriteExisting: force })
      },
    },
    updateGraphQLFunction(),
    updateDbAuth(),
    updateApp(),
    updateApiURLTask('${REDWOOD_API_URL}'),
    addToDotEnvDefaultTask(),
    printSetupNotes(notes),
  ])

  try {
    await tasks.run()
  } catch (e) {
    errorTelemetry(process.argv, e.message)
    console.error(c.error(e.message))
    process.exit(e?.exitCode || 1)
  }
}
