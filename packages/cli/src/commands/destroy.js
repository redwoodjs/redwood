export const command = 'destroy <type>'
export const aliases = ['d']
export const description = 'Rollback changes made by the generate command'
import terminalLink from 'terminal-link'

export async function builder(yargs) {
  const destroyCellCommand = await import('./destroy/cell/cell')
  const destroyComponentCommand = await import('./destroy/component/component')
  const destroyDirectiveCommand = await import('./destroy/directive/directive')
  const destroyFunctionCommand = await import('./destroy/function/function')
  const destroyGraphiqlCommand = await import('./destroy/graphiql/graphiql')
  const destroyLayoutCommand = await import('./destroy/layout/layout')
  const destroyPageCommand = await import('./destroy/page/page')
  const destroyScaffoldCommand = await import('./destroy/scaffold/scaffold')
  const destroySDLCommand = await import('./destroy/sdl/sdl')
  const destroyServiceCommand = await import('./destroy/service/service')

  yargs
    .demandCommand()
    .epilogue(
      `Also see the ${terminalLink(
        'Redwood CLI Reference',
        'https://redwoodjs.com/docs/cli-commands#destroy-alias-d'
      )}`
    )
    .command(destroyCellCommand)
    .command(destroyComponentCommand)
    .command(destroyDirectiveCommand)
    .command(destroyFunctionCommand)
    .command(destroyGraphiqlCommand)
    .command(destroyLayoutCommand)
    .command(destroyPageCommand)
    .command(destroyScaffoldCommand)
    .command(destroySDLCommand)
    .command(destroyServiceCommand)
}
