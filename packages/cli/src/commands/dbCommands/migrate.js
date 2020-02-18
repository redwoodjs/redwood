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
      handler: ({ name = false }) => {
        runPrismaCommand([
          'migrate save',
          name && `--name ${name}`,
          '--experimental',
        ])
      },
    })
    .demandCommand()
    .help()
}
