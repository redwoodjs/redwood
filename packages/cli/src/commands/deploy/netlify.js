import { recordTelemetryAttributes } from '@redwoodjs/cli-helpers'

import { deployBuilder, deployHandler } from './helpers/helpers'

export const command = 'netlify [...commands]'
export const description = 'Build command for Netlify deploy'

export const builder = (yargs) => deployBuilder(yargs)

export const handler = (yargs) => {
  recordTelemetryAttributes({
    command: ['deploy', 'netlify'].join(' '),
  })
  deployHandler(yargs)
}
