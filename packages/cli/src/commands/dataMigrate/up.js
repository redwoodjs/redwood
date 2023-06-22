import terminalLink from 'terminal-link'

import { recordTelemetryAttributes } from '@redwoodjs/cli-helpers'

import { getPaths } from '../../lib'

export const command = 'up'
export const description =
  'Run any outstanding Data Migrations against the database'

/**
 * @param {import('@types/yargs').Argv} yargs
 */
export function builder(yargs) {
  yargs
    .option('import-db-client-from-dist', {
      type: 'boolean',
      alias: ['db-from-dist'],
      description: 'Import the db client from dist',
      default: false,
    })
    .option('dist-path', {
      type: 'string',
      alias: 'd',
      description: 'Path to the api dist directory',
      default: getPaths().api.dist,
    })
    .epilogue(
      `Also see the ${terminalLink(
        'Redwood CLI Reference',
        'https://redwoodjs.com/docs/cli-commands#datamigrate-up'
      )}`
    )
}

export async function handler(options) {
  recordTelemetryAttributes({
    command: ['data-migrate', command].join(' '),
    dbFromDist: options.importDbClientFromDist,
  })
  const { handler } = await import('./upHandler.js')
  return handler(options)
}
