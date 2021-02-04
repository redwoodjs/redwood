import execa from 'execa'

import { getPaths } from '@redwoodjs/internal'

export const command = 'prisma [...commands]'
export const description = 'alias of the Prisma CLI'

export const builder = () => {
  const argv = process.argv.slice(3)
  const paths = getPaths()

  let autoFlags = []
  if (['migrate', 'seed'].includes(argv[2])) {
    autoFlags = ['--preview-feature', `--schema`, paths.api.dbSchema]
  }

  execa('yarn prisma', [...argv, ...autoFlags], {
    shell: true,
    stdio: 'inherit',
    cwd: paths.api.base,
    extendEnv: true,
    cleanup: true,
  })
}
