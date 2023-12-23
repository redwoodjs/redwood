import terminalLink from 'terminal-link'

import c from '../lib/colors'
import { checkNodeVersion } from '../middleware/checkNodeVersion'

export const command = 'dev [side..]'
export const description = 'Start development servers for api, and web'

export const builder = (yargs) => {
  yargs
    .positional('side', {
      choices: ['api', 'web'],
      default: ['api', 'web'],
      description: 'Which dev server(s) to start',
      type: 'array',
    })
    .option('forward', {
      alias: 'fwd',
      description:
        'String of one or more Webpack DevServer config options, for example: `--fwd="--port=1234 --no-open"`',
      type: 'string',
    })
    .option('generate', {
      type: 'boolean',
      default: true,
      description: 'Generate artifacts',
    })
    .option('watchNodeModules', {
      type: 'boolean',
      description: 'Reload on changes to node_modules',
    })
    .option('apiDebugPort', {
      type: 'number',
      description:
        'Port on which to expose API server debugger. If you supply the flag with no value it defaults to 18911.',
    })
    .middleware(() => {
      const check = checkNodeVersion()

      if (check.ok) {
        return
      }

      console.warn(`${c.warning('Warning')}: ${check.message}\n`)
    })
    .epilogue(
      `Also see the ${terminalLink(
        'Redwood CLI Reference',
        'https://redwoodjs.com/docs/cli-commands#dev'
      )}`
    )
}

export const handler = async (options) => {
  const { handler } = await import('./devHandler.js')
  return handler(options)
}
