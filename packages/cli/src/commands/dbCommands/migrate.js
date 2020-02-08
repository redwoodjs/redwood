import execa from 'execa'

import { getPaths } from 'src/lib'
import c from 'src/lib/colors'

const runPrismaCommand = async (args) => {
  const subprocess = execa('yarn prisma2', args.filter(Boolean), {
    shell: true,
    cwd: `${getPaths().base}/api`,
  })
  process.stdin.pipe(subprocess.stdin)
  subprocess.stdout.pipe(process.stdout)
  subprocess.stderr.on('data', () => {
    // When a migration is already created the prisma CLI asks the user to
    // submit a bug report. This causes our invokation to "freeze."
    subprocess.cancel()
  })
  subprocess.stderr.on('error', (e) => {
    console.log(e.message)
  })

  try {
    await subprocess
  } catch (e) {
    console.log(c.error(e.stderr))
  }
  process.exit()
}

export const command = 'migrate [command]'
export const desc = 'Database migration.'
export const builder = (yargs) => {
  yargs
    .command({
      command: 'save [name..]',
      desc: 'Create a new migration.',
      handler: async ({ name = false }) => {
        runPrismaCommand([
          'migrate save',
          name && `--name ${name}`,
          '--experimental',
        ])
      },
    })
    .command({
      command: 'up',
      desc: 'Migrate your database up.',
      handler: () => {
        runPrismaCommand(['migrate up', '--create-db', '--experimental'])
      },
    })
    .command({
      command: 'down',
      desc: 'Migrate your database down.',
      handler: () => {
        runPrismaCommand(['migrate down', '--experimental'])
      },
    })
    .demandCommand()
    .help()
}
