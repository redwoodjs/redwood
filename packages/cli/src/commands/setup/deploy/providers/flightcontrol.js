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
              ...flightcontrolConfig.environments[0].services.map(
                (service) => {
                  if (service.id === 'redwood-api') {
                    return {
                      ...service,
                      envVariables: databaseEnvVariables,
                    }
                  }
                  return service
                }
              ),
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
    title: 'Adding cors config to createGraphQLHandler...',
    task: (_ctx, task) => {
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

      cors: { origin: '*', credentials: true}
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

      cors: { origin: '*', credentials: true}
    `)
        return
      }

      graphqlContent.splice(
        graphqlHanderIndex + 1,
        0,
        "  cors: { origin: '*', credentials: true },"
      )

      fs.writeFileSync(graphqlFunctionsPath, graphqlContent.join(EOL))
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
  'go to the Flightcontrol dashboard and set the REDWOOD_API_URL env var to the URL of your API service\n',
  'Check out the deployment docs at https://morning-citrine-14f.notion.site/Flightcontrol-Docs-8d9ca4edb5564165a9557df32818af0c for detailed instructions',
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
    updateApiURLTask('${REDWOOD_API_URL}'),
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
