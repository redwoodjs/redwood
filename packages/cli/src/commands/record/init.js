import { recordTelemetryAttributes } from '@redwoodjs/cli-helpers'

import { exitWithError } from '../../lib/exit'

export const command = 'init'
export const description =
  'Caches a JSON version of your data model and adds `api/src/models/index.js` with some config'

export async function handler() {
  recordTelemetryAttributes({
    command: 'record',
  })

  try {
    const { parseDatamodel } = await import('@redwoodjs/record')
    await parseDatamodel()
  } catch (e) {
    if (e.code !== 'ERR_MODULE_NOT_FOUND') {
      throw e
    }

    exitWithError(undefined, {
      message: [
        "Error: Can't find module `@redwoojds/record`. Have you installed `@redwoodjs/record` in the api side?",
        '',
        '  yarn workspace api add @redwoodjs/record',
        '',
      ].join('\n'),
    })
  }
}
