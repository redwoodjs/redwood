import terminalLink from 'terminal-link'

import detectRwVersion from '../middleware/detectProjectRwVersion'

import * as authCommand from './setup/auth/auth'
import * as cacheCommand from './setup/cache/cache'
import * as customWebIndexCommand from './setup/custom-web-index/custom-web-index'
import * as deployCommand from './setup/deploy/deploy'
import * as generatorCommand from './setup/generator/generator'
import * as graphiqlCommand from './setup/graphiql/graphiql'
import * as i18nCommand from './setup/i18n/i18n'
import * as mailerCommand from './setup/mailer/mailer'
import * as packageCommand from './setup/package/package'
import * as tsconfigCommand from './setup/tsconfig/tsconfig'
import * as uiCommand from './setup/ui/ui'
import * as viteCommand from './setup/vite/vite'
import * as webpackCommand from './setup/webpack/webpack'

export const command = 'setup <command>'
export const description = 'Initialize project config and install packages'

export function builder(yargs) {
  yargs
    .command(authCommand)
    .command(cacheCommand)
    .command(customWebIndexCommand)
    .command(deployCommand)
    .command(generatorCommand)
    .command(graphiqlCommand)
    .command(i18nCommand)
    .command(mailerCommand)
    .command(packageCommand)
    .command(tsconfigCommand)
    .command(uiCommand)
    .command(viteCommand)
    .command(webpackCommand)
    .middleware(detectRwVersion)
    .epilogue(
      `Also see the ${terminalLink(
        'Redwood CLI Reference',
        'https://redwoodjs.com/docs/cli-commands#setup'
      )}`
    )
}
