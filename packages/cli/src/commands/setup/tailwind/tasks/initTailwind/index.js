import execa from 'execa'
import fs from 'fs'
import path from 'path'
import { getPaths } from 'src/lib'

export default ({ force, ui }) => async () => {
  /**
   * If it doesn't already exist,
   * initialize tailwind and move tailwind.config.js to web/
   */
  const basePath = getPaths().web.base
  const tailwindConfigPath = path.join(basePath, 'tailwind.config.js')
  const configExists = fs.existsSync(tailwindConfigPath)

  if (configExists) {
    if (force) {
      // yarn tailwindcss init will fail if the file already exists
      fs.unlinkSync(tailwindConfigPath)
    } else {
      throw new Error(
        'Tailwindcss config already exists.\nUse --force to override existing config.'
      )
    }
  }

  await execa('yarn', ['tailwindcss', 'init'], { cwd: basePath })

  // opt-in to upcoming changes
  const config = fs.readFileSync(tailwindConfigPath, 'utf-8')

  const uncommentFlags = (str) =>
    str.replace(/\/{2} ([\w-]+: true)/g, '$1')

  const newConfig = config.replace(/future.*purge/s, uncommentFlags)

  fs.writeFileSync(tailwindConfigPath, newConfig)
}
