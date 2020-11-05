import execa from 'execa'
import fs from 'fs'
import path from 'path'
import { getPaths } from 'src/lib'

export default ({ force, ui }) => async () => {
  /**
   * If it doesn't already exist,
   * initialize tailwind and move tailwind.config.js to web/
   */
  const configExists = fs.existsSync(
    path.join(getPaths().web.base, 'tailwind.config.js')
  )

  if (!force && configExists) {
    throw new Error(
      'Tailwindcss config already exists.\nUse --force to override existing config.'
    )
  } else {
    await execa('yarn', ['tailwindcss', 'init'])

    const config = fs.readFileSync('tailwind.config.js', 'utf-8')

    // opt-in to upcoming changes
    const uncommentFlags = (str) => str.replace(/\/{2} ([\w-]+: true)/g, '$1')

    let newConfig = config.replace(/future.*purge/s, uncommentFlags)

    // add TailwindUI plugin if requested
    if (ui) {
      newConfig = newConfig.replace(
        /plugins:\W*\[\W*]/s,
        "plugins: [require('@tailwindcss/ui')]"
      )
    }

    fs.writeFileSync('tailwind.config.js', newConfig)

    /**
     * Later, when we can tell the vscode extension where to look for the config,
     * we can put it in web/config/
     */
    await execa('mv', ['tailwind.config.js', 'web/'])
  }
}
