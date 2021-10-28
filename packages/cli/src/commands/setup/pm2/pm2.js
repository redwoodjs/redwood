import fs from 'fs'
import path from 'path'

import execa from 'execa'
import Listr from 'listr'

import { getPaths, writeFile } from '../../../lib'
import style from '../../../lib/colors'
import c from '../../../lib/colors'

export const command = 'pm2'
export const description = 'Setup pm2'
export const builder = (yargs) => {
  yargs.option('force', {
    alias: 'f',
    default: false,
    description: 'Overwrite existing configuration',
    type: 'boolean',
  })
}

export const handler = async ({ force }) => {
  const tasks = new Listr([
    {
      title: 'Installing packages...',
      task: () => {
        return new Listr([
          {
            title: 'Installing pm2...',
            task: async () => {
              await execa('yarn', ['add', '-D', '-W', 'pm2'])
            },
          },
        ])
      },
    },
    {
      title: 'Configuring pm2...',
      task: () => {
        /**
         * Check if pm2 config already exists.
         * If it exists, throw an error.
         */
        const pm2EcosystemConfigPath = path.join(
          getPaths().base,
          'ecosystem.config.js'
        )

        if (!force && fs.existsSync(pm2EcosystemConfigPath)) {
          throw new Error(
            'pm2 config already exists.\nUse --force to override existing config.'
          )
        } else {
          return writeFile(
            pm2EcosystemConfigPath,
            fs
              .readFileSync(
                path.resolve(
                  __dirname,
                  'templates',
                  'ecosystem.config.js.template'
                )
              )
              .toString(),
            { overwriteExisting: force }
          )
        }
      },
    },
    {
      title: 'All set',
      task: (_ctx) => {
        ;[
          '',
          style.success('pm2 setup completed'),
          '',
          'Configuration file ecosystem.config.js has been created in the root folder',
          '',
          `${style.header(`Build, start and watch logs`)}`,
          '',
          `${style.redwood(` > ${style.green(`yarn rw build`)}`)}`,
          `${style.redwood(` > ${style.green(`yarn pm2 start`)}`)}`,
          `${style.redwood(` > ${style.green(`yarn pm2 logs`)}`)}`,

          '',
        ].map((item) => console.log(item))
      },
    },
  ])

  try {
    await tasks.run()
  } catch (e) {
    console.error(c.error(e.message))
    process.exit(e?.exitCode || 1)
  }
}
