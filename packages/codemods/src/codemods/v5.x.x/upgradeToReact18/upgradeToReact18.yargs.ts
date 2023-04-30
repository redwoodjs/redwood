import task from 'tasuku'

import {
  checkAndTransformReactRoot,
  upgradeReactDepsTo18,
} from './upgradeToReact18'

export const command = 'upgrade-to-react-18'

export const description =
  '(v4.x.x->v5.0.0) Upgrades a project to React 18 and checks the react root'

export const handler = () => {
  task('Check and transform react root', async (taskContext) => {
    checkAndTransformReactRoot(taskContext)
  })

  task('Update react deps', async () => {
    await upgradeReactDepsTo18()
  })
}
