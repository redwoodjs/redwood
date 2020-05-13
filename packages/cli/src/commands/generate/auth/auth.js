import fs from 'fs'
import path from 'path'

import execa from 'execa'
import Listr from 'listr'

import { getPaths, writeFilesTask } from 'src/lib'
import c from 'src/lib/colors'

const TEMPLATE_PATH = path.resolve(__dirname, 'templates', 'auth.js.template')
const TEMPLATE = fs.readFileSync(TEMPLATE_PATH).toString()
const OUTPUT_PATH = path.join(getPaths().api.lib, 'auth.js')

// the files to create to support auth
export const files = () => {
  return {
    [OUTPUT_PATH]: TEMPLATE,
  }
}

// actually inserts the required config lines into index.js
export const addConfigToIndex = (config) => {
  // TODO: insert `import`, `init` and `render` into web/src/index.js
  console.info(config)
}

// whether there is a provider
export const isProviderSupported = (provider) => {
  // TODO: check for fileExists in ./providers/[name].js
  return false
}

export const command = 'auth <provider>'
export const desc = 'Generates auth configuration.'
export const builder = {
  force: { type: 'boolean', default: false },
}

export const handler = async ({ provider, force }) => {
  const providerData = await import(`./providers/${provider}`)

  const tasks = new Listr(
    [
      {
        title: 'Adding required packages...',
        task: async () => {
          if (!isProviderSupported(provider)) {
            throw new Error(`Unknown auth provider '${provider}'`)
          }

          await execa('yarn', [
            'workspace',
            'web',
            'add',
            ...providerData.packages,
          ])
        },
      },
      {
        title: 'Installing packages...',
        task: async () => {
          await execa('yarn', ['install'])
        },
      },
      {
        title: 'Generating auth lib...',
        task: () => {
          return writeFilesTask(files(), { overwriteExisting: force })
        },
      },
      {
        title: 'Adding auth config...',
        task: () => {
          addConfigToIndex(providerData.config)
        },
      },
      {
        title: 'One more thing...',
        task: (_ctx, task) => {
          task.title = `One more thing...\n\n   ${providerData.notes.join(
            '\n   '
          )}\n`
        },
      },
    ].filter(Boolean),
    { collapse: false }
  )

  try {
    await tasks.run()
  } catch (e) {
    console.log(c.error(e.message))
  }
}
