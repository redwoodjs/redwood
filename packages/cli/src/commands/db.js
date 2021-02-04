import terminalLink from 'terminal-link'

import c from 'src/lib/colors'

export const command = 'db [...commands]'

export const builder = () => {
  const argv = process.argv.slice(2)

  console.log(c.warning('Deprecation notice:'))
  console.log(
    `The ${c.bold(
      'rw ' + argv.join(' ')
    )} command is now deprecated, please use ${c.bold(
      `rw prisma ` + (argv[1] || '\b')
    )} instead.`
  )

  switch (argv[1]) {
    case 'up':
    case 'down':
    case 'save':
      console.log()
      console.log(
        `Migrations are now available via the ${c.bold(
          'rw prisma migrate'
        )} command.`
      )
      console.log()
      console.log(
        `View the ${terminalLink(
          'migration docs',
          'https://www.prisma.io/docs/reference/api-reference/command-reference#prisma-migrate-preview'
        )}`
      )
      break
  }
}
