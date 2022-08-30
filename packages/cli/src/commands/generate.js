import terminalLink from 'terminal-link'

import { isTypeScriptProject } from '../lib/project'

export const command = 'generate <type>'
export const aliases = ['g']
export const description = 'Generate boilerplate code and type definitions'

export async function builder(yargs) {
  const execa = await import('execa')

  const generateCellCommand = await import('./generate/cell/cell')
  const generateComponentCommand = await import(
    './generate/component/component'
  )
  const generateDataMigrationCommand = await import(
    './generate/dataMigration/dataMigration'
  )
  const generateDbAuthCommand = await import('./generate/dbAuth/dbAuth')
  const generateDirectiveCommand = await import(
    './generate/directive/directive'
  )
  const generateFunctionCommand = await import('./generate/function/function')
  const generateLayoutCommand = await import('./generate/layout/layout')
  const generateModelCommand = await import('./generate/model/model')
  const generatePageCommand = await import('./generate/page/page')
  const generateScaffoldCommand = await import('./generate/scaffold/scaffold')
  const generateScriptCommand = await import('./generate/script/script')
  const generateSDLCommand = await import('./generate/sdl/sdl')
  const generateSecretCommand = await import('./generate/secret/secret')
  const generateServiceCommand = await import('./generate/service/service')

  yargs
    .command('types', 'Generate supplementary code', {}, () => {
      execa.sync('yarn rw-gen', { shell: true, stdio: 'inherit' })
    })
    .demandCommand()
    .epilogue(
      `Also see the ${terminalLink(
        'Redwood CLI Reference',
        'https://redwoodjs.com/docs/cli-commands#generate-alias-g'
      )}`
    )
    .command(generateCellCommand)
    .command(generateComponentCommand)
    .command(generateDataMigrationCommand)
    .command(generateDbAuthCommand)
    .command(generateDirectiveCommand)
    .command(generateFunctionCommand)
    .command(generateLayoutCommand)
    .command(generateModelCommand)
    .command(generatePageCommand)
    .command(generateScaffoldCommand)
    .command(generateScriptCommand)
    .command(generateSDLCommand)
    .command(generateSecretCommand)
    .command(generateServiceCommand)
}

/** @type {Record<string, import('yargs').Options>} */
export const yargsDefaults = {
  force: {
    alias: 'f',
    default: false,
    description: 'Overwrite existing files',
    type: 'boolean',
  },
  typescript: {
    alias: 'ts',
    default: isTypeScriptProject(),
    description: 'Generate TypeScript files',
    type: 'boolean',
  },
}
