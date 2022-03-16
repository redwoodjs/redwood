import fs from 'fs'
import path from 'path'

import { getPaths } from '@redwoodjs/internal'

import {
  deployBuilder,
  deployHandler,
  isWebIndexPrerendered,
} from './helpers/helpers'

export const command = 'netlify [...commands]'
export const description = 'Build command for Netlify deploy'

export const builder = (yargs) => {
  yargs.option('generate-redirects', {
    description:
      'Generate the _redirects file to redirect to 200.html if no prerender html file is found for your path, only has an effect if you are using prerender on the web side',
    type: 'boolean',
    default: true,
  })

  return deployBuilder(yargs)
}

export const handler = async (args) => {
  // Use the standard deploy handler
  await deployHandler(args)

  if (isWebIndexPrerendered() && args.generateRedirects) {
    const pathToRedirects = path.join(getPaths().web.dist, '_redirects')
    console.log(`Generating prerender redirects file at ${pathToRedirects}`)

    fs.writeFileSync(
      pathToRedirects,
      '/*                 /200.html          200'
    )
  }
}
