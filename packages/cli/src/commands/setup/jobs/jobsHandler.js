import * as fs from 'node:fs'
import * as path from 'node:path'

import chalk from 'chalk'
import { Listr } from 'listr2'

import { getPaths, transformTSToJS, writeFile } from '../../../lib'
import c from '../../../lib/colors'
import { isTypeScriptProject } from '../../../lib/project'

const tasks = ({ force }) => {
  return new Listr(
    [
      {
        title: 'Creating config file in api/src/lib...',
        task: async () => {
          const isTs = isTypeScriptProject()
          const outputExtension = isTs ? 'ts' : 'js'
          const outputPath = path.join(
            getPaths().api.lib,
            `jobs.${outputExtension}`,
          )
          let template = fs
            .readFileSync(
              path.resolve(__dirname, 'templates', 'jobs.ts.template'),
            )
            .toString()

          if (!isTs) {
            template = await transformTSToJS(outputPath, template)
          }

          writeFile(outputPath, template, {
            overwriteExisting: force,
          })
        },
      },
      {
        title: 'Creating jobs dir at api/src/jobs...',
        task: () => {
          try {
            fs.mkdirSync(getPaths().api.jobs)
          } catch (e) {
            // ignore directory already existing
            if (!e.message.match('file already exists')) {
              throw new Error(e)
            }
          }
          writeFile(path.join(getPaths().api.jobs, '.keep'), '', {
            overwriteExisting: force,
          })
        },
      },
      {
        title: 'One more thing...',
        task: (_ctx, task) => {
          task.title = `One more thing...
          ${c.green('Background jobs configured!\n')}
          ${'Generate jobs with:'} ${c.warning('yarn rw g job <name>')}
          ${'Execute jobs with:'}  ${c.warning('yarn rw jobs work\n')}
          ${'Check out the docs for more info:'}
          ${chalk.hex('#e8e8e8')('https://docs.redwoodjs.com/docs/background-jobs')}
        `
        },
      },
    ],
    { rendererOptions: { collapseSubtasks: false }, errorOnExist: true },
  )
}

export const handler = async ({ force }) => {
  const t = tasks({ force })

  try {
    await t.run()
  } catch (e) {
    console.log(c.error(e.message))
  }
}
