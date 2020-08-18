import fs from 'fs'
import path from 'path'

import execa from 'execa'
import Listr from 'listr'
import terminalLink from 'terminal-link'
import { resolveFile } from '@redwoodjs/internal'

import { getPaths, writeFilesTask } from 'src/lib'
import c from 'src/lib/colors'

const REDWOOD_TOML_PATH = path.join(getPaths().base, 'redwood.toml')
const SUPPORTED_PROVIDERS = fs
  .readdirSync(path.resolve(__dirname, 'providers'))
  .map((file) => path.basename(file, '.js'))
  .filter((file) => file !== 'README.md')

const updateProxyPath = (newProxyPath) => {
  const redwoodToml = fs.readFileSync(REDWOOD_TOML_PATH).toString()
  let newRedwoodToml = redwoodToml

  if (redwoodToml.match(/apiProxyPath/)) {
    newRedwoodToml = newRedwoodToml.replace(
      /apiProxyPath.*/,
      `apiProxyPath = "${newProxyPath}"`
    )
  } else if (redwoodToml.match(/\[web\]/)) {
    newRedwoodToml = newRedwoodToml.replace(
      /\[web\]/,
      `[web]\n  apiProxyPath = "${newProxyPath}"`
    )
  } else {
    newRedwoodToml += `[web]\n  apiProxyPath = "${newProxyPath}"`
  }

  fs.writeFileSync(REDWOOD_TOML_PATH, newRedwoodToml)
}

export const command = 'deploy <provider>'
export const description = 'Generate a deployment configuration'
export const builder = (yargs) => {
  yargs
    .positional('provider', {
      choices: SUPPORTED_PROVIDERS,
      description: 'Deploy provider to configure',
      type: 'string',
    })
    .option('force', {
      alias: 'f',
      default: false,
      description: 'Overwrite existing configuration',
      type: 'boolean',
    })
    .epilogue(
      `Also see the ${terminalLink(
        'Redwood CLI Reference',
        'https://redwoodjs.com/reference/command-line-interface#generate-deploy'
      )}`
    )
}

export const handler = async ({ provider, force }) => {
  const providerData = await import(`./providers/${provider}`)

  const tasks = new Listr(
    [
      providerData.files &&
        providerData.files.length > 0 && {
          title: 'Adding config...',
          task: async () => {
            let files = {}
            providerData.files.forEach((fileData) => {
              files[fileData.path] = fileData.content
            })
            return writeFilesTask(files, { overwriteExisting: force })
          },
        },
      {
        title: 'Updating apiProxyPath...',
        task: async () => {
          updateProxyPath(providerData.apiProxyPath)
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
