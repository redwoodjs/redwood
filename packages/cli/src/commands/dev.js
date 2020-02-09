import execa from 'execa'
import Listr from 'listr'

import { getPaths } from 'src/lib'

export const command = 'dev [app..]'
export const desc = 'Run development servers.'
export const builder = {
  app: { choices: ['db', 'api', 'web'], default: ['db', 'api', 'web'] },
}

// TODO: The development server should restart if something breaks.
// TODO: Allow each process to show additional information:
//  - Reloading (File change detected.)
//  - Error
//  - Restart
export const handler = ({ app }) => {
  const { base: BASE_DIR } = getPaths()

  const execCommandsForApps = {
    db: `cd ${BASE_DIR}/api && yarn prisma2 generate --watch`,
    api: `cd ${BASE_DIR}/api && yarn dev-server`,
    web: `cd ${BASE_DIR}/web && yarn webpack-dev-server --config ../node_modules/@redwoodjs/scripts/config/webpack.development.js`,
  }

  const tasks = new Listr(
    app.map((appName) => ({
      title: `Running "${appName}..."`,
      task: () => {
        const cmd = execa(execCommandsForApps[appName], undefined, {
          shell: true,
        })
        return cmd
      },
    })),
    { concurrent: true }
  )
  tasks.run()
}
