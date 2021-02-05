import terminalLink from 'terminal-link'

import c from 'src/lib/colors'

export const command = 'db [...commands]'

// TO DO: Description

export const builder = () => {
  // yargs.help(false)
  const argv = process.argv.slice(2)

  const deprecationMessage = (newCommand, fullLine = false) => {
    try {
      console.log(c.warning('\n' + 'WARNING: deprecated command'))
      if (fullLine) {
        console.log(newCommand)
      } else {
        console.log(
          'Please use the new command: ' +
            c.green(`yarn rw prisma ${newCommand} \n`)
        )
      }

      console.log(
        `See the ${terminalLink(
          'Redwood CLI Reference',
          'https://redwoodjs.com/docs/cli-commands#prisma'
        )} \n`
      )
    } catch (e) {
      console.log(c.error(e.message))
    }
  }

  switch (argv[1]) {
    case 'help':
      deprecationMessage(
        "'yarn rw db' commands are deprecated \n" +
          "See 'yarn rw prisma --help' for new commands  \n",
        true
      )
      break
    case 'up':
      deprecationMessage('migrate dev')
      break
    case 'down':
      deprecationMessage(
        `Prisma Migrate no longer supports down migrations \n \n` +
          `See possible alternative ${terminalLink(
            'Migration Flows',
            'https://www.prisma.io/docs/concepts/components/prisma-migrate/prisma-migrate-flows'
          )} \n`,
        true
      )
      break
    case 'generate':
      deprecationMessage('generate')
      break
    case 'introspect':
      deprecationMessage('introspect')
      break
    case 'seed':
      deprecationMessage('db seed')
      break
    case 'studio':
      deprecationMessage('studio')
      break
    case 'save':
      deprecationMessage('migrate dev')
      break
  }
}
