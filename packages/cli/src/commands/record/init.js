import { recordTelemetryAttributes } from '@redwoodjs/cli-helpers'
import { parseDatamodel } from '@redwoodjs/record'

import { command } from '../record'

export const handler = async () => {
  recordTelemetryAttributes({
    command,
  })
  await parseDatamodel()
}
