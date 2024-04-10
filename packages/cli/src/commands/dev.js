import terminalLink from 'terminal-link'

import { getConfig } from '../lib'
import c from '../lib/colors'
import { checkNodeVersion } from '../middleware/checkNodeVersion'

export const command = 'dev [side..]'
export const description = 'Start development servers for api, and web'

export const builder = (yargs) => {
  // We hide some options based on the bundler being used.
  // Note that `watchNodeModules` is webpack specific, but `forward` isn't.
  // The reason it's also hidden is that it's been broken with Vite
  // and it's not clear how to fix it.
  const isUsingWebpack = getConfig().web.bundler === 'webpack'

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
      hidden: !isUsingWebpack,
    })
    .option('generate', {
      type: 'boolean',
      default: true,
      description: 'Generate artifacts',
    })
    .option('watchNodeModules', {
      type: 'boolean',
      description: 'Reload on changes to node_modules',
      hidden: !isUsingWebpack,
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
        'https://redwoodjs.com/docs/cli-commands#dev',
      )}`,
    )
}

export const handler = async (options) => {
  const { handler } = await import('./devHandler.js')
  return handler(options)
}
