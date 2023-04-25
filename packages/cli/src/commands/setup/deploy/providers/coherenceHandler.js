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

const redwoodProjectPaths = getPaths()

export async function handler({ force }) {
  const tasks = new Listr(
    [
      {
        title: 'Adding coherence.yml...',
        task: async () => {
          const coherenceConfigFilePath = path.join(
            redwoodProjectPaths.base,
            'coherence.yml'
          )
          const coherenceConfigFileContent =
            await getCoherenceConfigFileContent()

          return writeFilesTask(
            { [coherenceConfigFilePath]: coherenceConfigFileContent },
            { existingFiles: force ? 'OVERWRITE' : 'FAIL' }
          )
        },
      },

      addFilesTask({
        title: 'Adding health check function',
        files: [
          {
            path: path.join(
              redwoodProjectPaths.api.functions,
              `health.${isTypeScriptProject ? 'ts' : 'js'}`
            ),
            content: coherenceFiles.healthCheck,
          },
        ],
        force,
      }),

      updateRedwoodTOMLPortsTask(),
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

// ------------------------
// Tasks and helpers
// ------------------------

const notes = [
  "You're ready to deploy to Coherence!\n",
  'Go to https://app.withcoherence.com to create your account and setup your cloud or GitHub connections.',
  'Check out the deployment docs at https://docs.withcoherence.com for detailed instructions and more information.\n',
  "Reach out to redwood@withcoherence.com with any questions! We're here to support you.",
]

/**
 * Check the value of `provider` in the datasource block in `schema.prisma`:
 *
 * ```prisma title="schema.prisma"
 * datasource db {
 *   provider = "sqlite"
 *   url      = env("DATABASE_URL")
 * }
 * ```
 */
async function getCoherenceConfigFileContent() {
  const prismaSchema = await getSchema(redwoodProjectPaths.api.dbSchema)
  const prismaConfig = await getConfig({ datamodel: prismaSchema })

  let db = prismaConfig.datasources[0].activeProvider

  if (!['mysql', 'postgresql'].includes(db)) {
    notes.unshift(
      '⚠️  Warning: only mysql and postgresql prisma databases are supported on Coherence at this time.\n'
    )
  }

  if (db === 'postgresql') {
    db = 'postgres'
  }

  return coherenceFiles.yamlTemplate(db)
}

/**
 * Updates the ports in redwood.toml to use an environment variable.
 */
function updateRedwoodTOMLPortsTask() {
  return {
    title: 'Updating ports in redwood.toml...',
    task: () => {
      const redwoodTOMLPath = path.join(
        redwoodProjectPaths.base,
        'redwood.toml'
      )

      let redwoodTOMLContent = fs.readFileSync(redwoodTOMLPath, 'utf-8')

      redwoodTOMLContent = redwoodTOMLContent.replace(
        /port.*?\n/m,
        'port = "${PORT}"\n'
      )

      fs.writeFileSync(redwoodTOMLPath, redwoodTOMLContent)
    },
  }
}

// ------------------------
// Files
// ------------------------

const coherenceFiles = {
  yamlTemplate(db) {
    return `\
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

  resources:
    - name: ${path.basename(redwoodProjectPaths.base)}-db
      engine: ${db}
      version: 13
      type: database

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
  },
  healthCheck: `\
// Coherence health check
export const handler = async () => {
  return {
    statusCode: 200,
  }
}
`,
}
