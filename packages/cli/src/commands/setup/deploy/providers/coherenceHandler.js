import fs from 'fs'
import path from 'path'

import { getSchema, getConfig } from '@prisma/internals'
import { Listr } from 'listr2'

import {
  colors as c,
  getPaths,
  writeFilesTask,
  isTypeScriptProject,
} from '@redwoodjs/cli-helpers'
import { errorTelemetry } from '@redwoodjs/telemetry'

import { printSetupNotes, addFilesTask } from '../helpers'

export const handler = async ({ force, database }) => {
  const tasks = new Listr(
    [
      {
        title: 'Adding coherence.yml',
        task: async () => {
          const { path, content } = await getCoherenceYamlContent(database)

          return writeFilesTask(
            { [path]: content },
            { existingFiles: force ? 'OVERWRITE' : 'FAIL' }
          )
        },
      },

      addFilesTask({
        title: 'Adding health check function...',
        files: additionalFiles,
        force,
      }),

      updateRedwoodTomlTask(),
      printSetupNotes(notes),
    ],
    { rendererOptions: { collapse: false } }
  )

  try {
    await tasks.run()
  } catch (e) {
    errorTelemetry(process.argv, e.message)
    console.error(c.error(e.message))
    process.exit(e?.exitCode || 1)
  }
}

const getCoherenceYamlContent = async () => {
  // If the schema.prisma file doesn't exist (99% of the time it will), return some defaults.

  if (!fs.existsSync(getPaths().api.dbSchema)) {
    return {
      path: path.join(getPaths().base, 'coherence.yml'),
      content: COHERENCE_YAML(''),
    }
  }

  // If it does, we have to check the provider in datasource:
  //
  // ```prisma
  // datasource db {
  //   provider = "sqlite"
  //   url      = env("DATABASE_URL")
  // }
  // ```

  const schema = await getSchema(getPaths().api.dbSchema)
  const config = await getConfig({ datamodel: schema })

  let detectedDatabase = config.datasources[0].activeProvider

  if (detectedDatabase === 'mysql' || detectedDatabase === 'postgresql') {
    if (detectedDatabase === 'postgresql') {
      detectedDatabase = 'postgres'
    }

    return {
      path: path.join(getPaths().base, 'coherence.yml'),
      content: COHERENCE_YAML(DATABASE_YAML(detectedDatabase)),
    }
  } else {
    console.warn(
      'Only mysql & postgresql prisma DBs are supported on Coherence at this time.'
    )

    return {
      path: path.join(getPaths().base, 'coherence.yml'),
      content: COHERENCE_YAML(''),
    }
  }
}

const COHERENCE_YAML = (database) => {
  return `
api:
  type: backend
  url_path: "/api"
  prod:
    command: ["yarn", "rw", "build", "api", "&&", "yarn", "rw", "serve", "api"]
  dev:
    command: ["yarn", "rw", "build", "api", "&&", "yarn", "rw", "dev", "api"]
  local_packages: ["node_modules"]

  system:
    cpu: 2
    memory: 2G
    health_check: "/health"

  ${database}

web:
  type: frontend
  assets_path: "web/dist"
  prod:
    command: ["yarn", "rw", "serve", "web"]
  dev:
    command: ["yarn", "rw", "dev", "web", "--fwd=\\"--allowed-hosts all\\""]
  build: ["yarn", "rw", "build", "web"]
  local_packages: ["node_modules"]

  system:
    cpu: 2
    memory: 2G
`
}

const PROJECT_NAME = path.basename(getPaths().base)

const DATABASE_YAML = (detectedDatabase) => `
  resources:
  - name: ${PROJECT_NAME}-db
    engine: ${detectedDatabase}
    version: 13
    type: database
`

const COHERENCE_HEALTH_CHECK = `// coherence-health-check
export const handler = async () => {
  return {
    statusCode: 200,
  }
}`

const additionalFiles = [
  {
    path: path.join(
      getPaths().api.functions,
      `health.${isTypeScriptProject ? 'ts' : 'js'}`
    ),
    content: COHERENCE_HEALTH_CHECK,
  },
]

// Updates the PORTs to use an environment variable.
const updateRedwoodTomlTask = () => {
  return {
    title: 'Updating redwood.toml PORTs...',
    task: () => {
      const configPath = path.join(getPaths().base, 'redwood.toml')
      const content = fs.readFileSync(configPath, 'utf-8')

      const newContent = content.replace(/port.*?\n/m, 'port = "${PORT}"\n')

      fs.writeFileSync(configPath, newContent)
    },
  }
}

const notes = [
  "You're ready to deploy to Coherence!\n",
  'Go to https://app.withcoherence.com to create your account and setup your cloud or GitHub connections.',
  'Check out the deployment docs at https://docs.withcoherence.com for detailed instructions and more information.\n',
  "Reach out to redwood@withcoherence.com with any questions! We're here to support you.",
]
