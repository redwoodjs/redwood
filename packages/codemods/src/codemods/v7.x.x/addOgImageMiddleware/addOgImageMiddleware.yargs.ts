import path from 'path'

import fg from 'fast-glob'
import type { TaskInnerAPI } from 'tasuku'
import task from 'tasuku'

import { getPaths } from '@redwoodjs/project-config'

import runTransform from '../../../lib/runTransform'

export const command = 'add-og-image-middleware'
export const description =
  '(v7.x.x) Adds the OG image middleware to your RedwoodJS app.'

export const handler = () => {
  task('Convert Js To Jsx', async ({ setOutput }: TaskInnerAPI) => {
    const entriesFile = fg.sync('entry.server.{jsx,tsx}', {
      cwd: getPaths().web.src,
      absolute: true,
    })[0]

    await runTransform({
      transformPath: path.join(__dirname, 'addOgImageMiddleware.js'),
      targetPaths: [entriesFile],
    })

    setOutput(
      `Done! The OG image middleware has been added to your middleware in the ${path.basename(entriesFile)} file.`,
    )
  })
}
