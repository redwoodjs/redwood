// import terminalLink from 'terminal-link'
import fs from 'fs'
import path from 'path'

import { getSchema, getConfig } from '@prisma/internals'
import { Listr } from 'listr2'

import { errorTelemetry } from '@redwoodjs/telemetry'

import { getPaths, writeFilesTask } from '../../../../lib'
import c from '../../../../lib/colors'
import { addFilesTask, printSetupNotes, updateApiURLTask } from '../helpers'
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
      content: COHERENCE_YAML(""),
    }
  } else {
    const detectedDatabase = config.datasources[0].activeProvider
    const schema = await getSchema('api/db/schema.prisma')
    const config = await getConfig({ datamodel: schema })
  }
  return {
    path: path.join(getPaths().base, 'coherence.yml'),
    content: COHERENCE_YAML(DATABASE_YAML()),
  }
}

// any notes to print out when the job is done
const notes = [
  'You are ready to deploy to Coherence!\n',
  'Go to https://app.withcoherence.com to create your account and deploy to Render',
  'Check out the deployment docs at https://docs.withcoherence.com for detailed instructions',
]

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
