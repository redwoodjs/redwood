export const command = 'deploy <target>'
export const description = 'Deploy your Redwood project'
import terminalLink from 'terminal-link'

export async function builder(yargs) {
  const baremetalCommand = await import('./deploy/baremetal')
  const flightcontrolCommand = await import('./deploy/flightcontrol')
  const layer0Command = await import('./deploy/layer0')
  const netlifyCommand = await import('./deploy/netlify')
  const renderCommand = await import('./deploy/render')
  const serverlessCommand = await import('./deploy/serverless')
  const vercelCommand = await import('./deploy/vercel')

  yargs
    .demandCommand()
    .epilogue(
      `Also see the ${terminalLink(
        'Redwood CLI Reference',
        'https://redwoodjs.com/docs/cli-commands#deploy'
      )}\n`
    )
    .command(baremetalCommand)
    .command(flightcontrolCommand)
    .command(layer0Command)
    .command(netlifyCommand)
    .command(renderCommand)
    .command(serverlessCommand)
    .command(vercelCommand)
}
