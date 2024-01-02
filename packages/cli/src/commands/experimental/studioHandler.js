import fs from 'fs-extra'

import { getConfigPath } from '@redwoodjs/project-config'

import { writeFile } from '../../lib'
import { isModuleInstalled, installRedwoodModule } from '../../lib/packages'

import { command, description, EXPERIMENTAL_TOPIC_ID } from './studio'
import { printTaskEpilogue } from './util'

export const handler = async (options) => {
  printTaskEpilogue(command, description, EXPERIMENTAL_TOPIC_ID)
  try {
    // Check the module is installed
    if (!isModuleInstalled('@redwoodjs/studio')) {
      console.log(
        'The studio package is not installed, installing it for you, this may take a moment...'
      )
      await installRedwoodModule('@redwoodjs/studio')
      console.log('Studio package installed successfully.')

      console.log('Adding config to redwood.toml...')
      const redwoodTomlPath = getConfigPath()
      const configContent = fs.readFileSync(redwoodTomlPath, 'utf-8')

      if (!configContent.includes('[experimental.studio]')) {
        // Use string replace to preserve comments and formatting
        writeFile(
          redwoodTomlPath,
          configContent.concat(`\n[experimental.studio]\n  enabled = true\n`),
          {
            overwriteExisting: true, // redwood.toml always exists
          }
        )
      } else {
        console.log(
          `The [experimental.studio] config block already exists in your 'redwood.toml' file.`
        )
      }
    }

    // Import studio and start it
    const { start } = await import('@redwoodjs/studio')
    await start({ open: options.open })
  } catch (e) {
    console.log('Cannot start the development studio')
    console.log(e)
    process.exit(1)
  }
}
