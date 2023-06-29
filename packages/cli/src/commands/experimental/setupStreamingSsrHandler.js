import fs from 'fs'

import { getConfigPath } from '@redwoodjs/project-config'

import { writeFile } from '../../lib'

import {
  command,
  description,
  EXPERIMENTAL_TOPIC_ID,
} from './setupStreamingSsr'
import { printTaskEpilogue } from './util'

export const handler = async ({ force }) => {
  const redwoodTomlPath = getConfigPath()
  const configContent = fs.readFileSync(redwoodTomlPath, 'utf-8')

  if (!configContent.includes('[experimental.streamingSsr]')) {
    console.log('Adding config to redwood.toml...')

    // Use string replace to preserve comments and formatting
    writeFile(
      redwoodTomlPath,
      configContent.concat(`\n[experimental.streamingSsr]\n  enabled = true\n`),
      {
        overwriteExisting: true, // redwood.toml always exists
      }
    )
  } else {
    if (force) {
      console.log('Updating config in redwood.toml...')
      writeFile(
        redwoodTomlPath,
        configContent.replace(
          // Enable if it's currently disabled
          `\n[experimental.streamingSsr]\n  enabled = false\n`,
          `\n[experimental.streamingSsr]\n  enabled = true\n`
        ),
        {
          overwriteExisting: true, // redwood.toml always exists
        }
      )
    } else {
      console.log('Adding config to redwood.toml...')
      console.log(
        "  The [experimental.studio] config block already exists in your 'redwood.toml' file."
      )
    }
  }

  console.log()

  printTaskEpilogue(command, description, EXPERIMENTAL_TOPIC_ID)
}
