// import terminalLink from 'terminal-link'
import fs from 'fs'
import path from 'path'

import { getSchema, getConfig } from '@prisma/internals'
import { Listr } from 'listr2'

import { errorTelemetry } from '@redwoodjs/telemetry'

import { getPaths, writeFilesTask } from '../../../../lib'
import c from '../../../../lib/colors'
import { printSetupNotes, addFilesTask } from '../helpers'
import {
  COHERENCE_HEALTH_CHECK,
  DATABASE_YAML,
  COHERENCE_YAML,
} from '../templates/coherence'

export const command = 'coherence'
export const description = 'Setup Coherence deploy'

export const getCoherenceYamlContent = async () => {
  if (!fs.existsSync('api/db/schema.prisma')) {
    return {
      path: path.join(getPaths().base, 'coherence.yml'),
      content: COHERENCE_YAML(''),
    }
  } else {
    const schema = await getSchema('api/db/schema.prisma');
    const config = await getConfig({ datamodel: schema });
    var detectedDatabase:string = config.datasources[0].activeProvider;

    if ((detectedDatabase === 'mysql') ||  (detectedDatabase === 'postgresql')) {
      if (detectedDatabase === 'postgresql') {detectedDatabase = 'postgres'}
      return {
        path: path.join(getPaths().base, 'coherence.yml'),
        content: COHERENCE_YAML(DATABASE_YAML(detectedDatabase)),
      }
    } else {
      printSetupNotes('Only mysql & postgresql prisma DBs are supported on Coherence at this time...')
      return {
        path: path.join(getPaths().base, 'coherence.yml'),
        content: COHERENCE_YAML(''),
      }
    }
  }
}

// any notes to print out when the job is done
const notes = [
  'You are ready to deploy to Coherence!\n',
  'Go to https://app.withcoherence.com to create your account and setup your cloud/github connections.',
  'Check out the deployment docs at https://docs.withcoherence.com for detailed instructions and more information.\n',
  'Reach out to redwood@withcoherence.com with any questions! We are here to support you...'
]


const additionalFiles = [
  {
    path: path.join(getPaths().base, 'api/src/functions/health.js'),
    content: COHERENCE_HEALTH_CHECK,
  },
]

// updates the PORTs to use an environment variable.
const updateRedwoodTomlTask = () => {
  return {
    title: 'Updating redwood.toml PORTs...',
    task: () => {
      const configPath = path.join(getPaths().base, 'redwood.toml')
      const content = fs.readFileSync(configPath).toString()

      const newContent = content.replace(
        /port.*?\n/m,
        'port = "${PORT}"'
      )
      fs.writeFileSync(configPath, newContent)
    },
  }
}

export const handler = async ({ force, database }) => {
  const tasks = new Listr(
    [
      {
        title: 'Adding coherence.yml',
        task: async () => {
          const fileData = await getCoherenceYamlContent(database)
          let files = {}
          files[fileData.path] = fileData.content
          return writeFilesTask(files, { overwriteExisting: force })
        },
      },
      addFilesTask({
        title: "Adding helath check function...",
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
