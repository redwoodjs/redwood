//@ts-check
import fs from 'fs'
import path from 'path'

import boxen from 'boxen'
import Listr from 'listr'

import { getPaths, writeFile } from '../../../lib'
import c from '../../../lib/colors'

const defaultProvider = 'shadowenv'
const defaultProviderNote =
  ' Note: Currently the only provider is Shadowenv. This can also be used to create project-local env var shadowing. For more info: https://shopify.github.io/shadowenv/'

export const command = 'cli-alias [provider]'
export const aliases = [defaultProvider]
export const description = `Set up CLI command aliasing, e.g. 'yarn rw' --> 'rw'.${defaultProviderNote}`

const supportedProviders = fs
  .readdirSync(path.resolve(__dirname, 'providers'))
  .map((file) => path.basename(file, '.js'))
  .filter((file) => file !== 'README.md')

export const builder = (/** @type import('yargs').Argv */ yargs) => {
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

export const handler = async (
  /** @type {{provider: string; force: boolean}} */ { provider, force }
) => {
  const providerData = await import(`./providers/${provider}`)
  const providerName = providerData?.name ?? provider
  const tasks = new Listr(
    [
      {
        title: `Configuring ${providerName}...`,
        task: (
          /** @type any */ _ctx,
          /** @type import('listr').ListrTaskWrapper */ task
        ) => {
          const configOutputPath = providerData?.configOutputPath

          const resolvedConfigTemplatePath = path.resolve(
            __dirname,
            'templates',
            providerData?.configTemplatePath
          )
          if (!fs.existsSync(resolvedConfigTemplatePath)) {
            task.skip(
              `${providerName} does not contain any configuration file.`
            )
          } else if (!force && fs.existsSync(configOutputPath)) {
            throw new Error(
              `${providerName} config already exists.\nUse --force to override existing config.`
            )
          } else {
            return writeFile(
              configOutputPath,
              fs.readFileSync(resolvedConfigTemplatePath).toString(),
              {
                overwriteExisting: force,
              }
            )
          }
        },
      },
      providerData?.gitIgnoreAdditions?.length &&
        fs.existsSync(path.resolve(getPaths().base, '.gitignore')) && {
          title: '',
          task: (
            /** @type any */ _ctx,
            /** @type import('listr').ListrTaskWrapper */ task
          ) => {
            task.title = 'Updating .gitignore...'
            const gitIgnore = path.resolve(getPaths().base, '.gitignore')
            const content = fs.readFileSync(gitIgnore).toString()
            const contentWithoutNewlineCharacters = content.replace(
              /\r?\n|\r/g,
              ' '
            )

            if (
              providerData.gitIgnoreAdditions.every(
                (/** @type {string} */ item) =>
                  contentWithoutNewlineCharacters.includes(item)
              )
            ) {
              task.skip('.gitignore already includes the additions.')
            } else {
              fs.appendFileSync(
                gitIgnore,
                ['\n', '# cli-alias', ...providerData.gitIgnoreAdditions].join(
                  '\n'
                )
              )
            }
          },
        },
      providerData?.notes?.length && {
        title: '',
        task: (
          /** @type any */ _ctx,
          /** @type import('listr').ListrTaskWrapper */ task
        ) => {
          task.title = `One more thing...\n ${boxen(
            providerData.notes.join('\n   '),
            {
              padding: { top: 0, bottom: 0, right: 1, left: 1 },
              margin: 1,
              borderColor: 'gray',
            }
          )}`
        },
      },
    ].filter(Boolean)
  )

  try {
    await tasks.run()
  } catch (/** @type any */ e) {
    console.error(c.error(e?.message))
    process.exit(e?.exitCode || 1)
  }
}
