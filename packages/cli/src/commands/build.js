import execa from 'execa'
import Listr from 'listr'

import { getPaths } from 'src/lib'
import c from 'src/lib/colors'

export const command = 'build [app..]'
export const desc = 'Build for production.'
export const builder = {
  app: { choices: ['api', 'web'], default: ['api', 'web'] },
}

// TODO: Add verbose flag.
export const handler = ({ app }) => {
  const { base: BASE_DIR } = getPaths()
  const execCommandsForApps = {
    api: `cd ${BASE_DIR}/api && NODE_ENV=production yarn babel src --out-dir dist`,
    web: `cd ${BASE_DIR}/web && yarn webpack --config ../node_modules/@redwoodjs/scripts/config/webpack.production.js`,
  }

  const tasks = new Listr(
    app.map((appName) => ({
      title: `Building "${appName}..."`,
      task: () => {
        const cmd = execa(execCommandsForApps[appName], undefined, {
          shell: true,
        })
        return cmd
      },
    }))
  )
  tasks.run()
}
