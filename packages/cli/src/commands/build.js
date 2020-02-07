import ora from 'ora'

import { asyncExec, getPaths } from 'src/lib'
import c from 'src/lib/colors'

export const command = 'build [app..]'
export const desc = 'Build the [app] for deployment.'
export const builder = { app: { default: ['api', 'web'] } }
export const handler = ({ app }) => {

  const { base: BASE_DIR } = getPaths()

  const execCommandsForApps = {
    api: `cd ${BASE_DIR}/api && NODE_ENV=production yarn babel src --out-dir dist`,
    web: `cd ${BASE_DIR}/web && yarn webpack --config ../node_modules/@redwoodjs/scripts/config/webpack.production.js`,
  }

  app.forEach(async (appName) => {
    const spinner = ora(`Building "${appName}..."`).start()
    try {
      // Could we stream the output here?
      await asyncExec(execCommandsForApps[appName])

      spinner.succeed()
    } catch (e) {
      spinner.fail()
      console.log(c.error(e.message))
    }
  })
}
