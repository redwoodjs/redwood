import fs from 'fs'
import path from 'path'

import boxen from 'boxen'
import Listr from 'listr'

import { getPaths, writeFile } from '../../../lib'
import c from '../../../lib/colors'

export const command = 'cli-alias [provider]'
const defaultProvider = 'shadowenv'
export const aliases = [defaultProvider]
export const description =
  "Set up CLI command aliasing, e.g. 'yarn rw' --> 'rw'. Note: Currently the only provider is Shadowenv. This can also be used to create project-local env var shadowing. For more info: https://shopify.github.io/shadowenv/"

const supportedProviders = fs
  .readdirSync(path.resolve(__dirname, 'providers'))
  .map((file) => path.basename(file, '.js'))
  .filter((file) => file !== 'README.md')

export const builder = (yargs) => {
  yargs.positional('provider', {
    choices: supportedProviders,
    description: 'CLI command alias provider to configure',
    type: 'string',
    default: defaultProvider,
  })
  yargs.option('force', {
    alias: 'f',
    default: false,
    description: 'Overwrite existing configuration',
    type: 'boolean',
  })
}

export const handler = async ({ provider, force }) => {
  const providerData = await import(`./providers/${provider}`)
  const tasks = new Listr(
    [
      {
        title: `Configuring ${providerData?.name ?? provider}...`,
        task: (_, task) => {
          /**
           * Check if provider's config already exists.
           * If it exists, throw an error.
           */
          const configPath = providerData?.configPath
          if (!force && fs.existsSync(configPath)) {
            throw new Error(
              'Shadowenv config already exists.\nUse --force to override existing config.'
            )
          } else {
            return writeFile(
              configPath,
              fs
                .readFileSync(
                  path.resolve(__dirname, 'templates', 'rw.lisp.template')
                )
                .toString(),
              {
                overwriteExisting: force,
              },
              task
            )
          }
        },
      },
      providerData?.gitIgnoreAdditions?.length &&
        fs.existsSync(path.resolve(getPaths().base, '.gitignore')) && {
          title: 'Updating .gitignore...',
          task: async (_ctx, task) => {
            const gitIgnore = path.resolve(getPaths().base, '.gitignore')
            const content = fs.readFileSync(gitIgnore).toString()

            if (
              providerData.gitIgnoreAdditions.every((item) =>
                content.includes(item)
              )
            ) {
              task.skip('.gitignore already includes the additions.')
            }

            fs.appendFileSync(
              gitIgnore,
              ['\n', '# Deployment', ...providerData.gitIgnoreAdditions].join(
                '\n'
              )
            )
          },
        },
      {
        title: '',
        task: (_, task) => {
          task.title = `One more thing...\n ${boxen(
            providerData.notes.join('\n   '),
            {
              padding: { top: 0, bottom: 0, right: 1, left: 1 },
              margin: 1,
              borderColour: 'gray',
            }
          )}`
        },
      },
    ],
    { collapse: false, exitOnError: true }
  )

  try {
    await tasks.run()
  } catch (e) {
    console.error(c.error(e.message))
    process.exit(e?.exitCode || 1)
  }
}
