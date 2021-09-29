import execa from 'execa'

import { getPaths } from '@redwoodjs/internal'

type AvailableSides = 'web' | 'api' | 'root'

export const addDependency = (side: AvailableSides, name: string) => {
  const workspaceString = side === 'root' ? '' : `workspace ${side}`
  execa.sync(`yarn ${workspaceString} add ${name}`, {
    cwd: getPaths().base,
  })
}
