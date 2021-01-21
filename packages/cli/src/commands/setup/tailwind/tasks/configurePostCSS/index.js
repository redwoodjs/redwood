import fs from 'fs'
import path from 'path'
import { getPaths, writeFile } from 'src/lib'

const postCSSConfigExists = () => {
  return fs.existsSync(getPaths().web.postcss)
}

export default ({ force }) => () => {
  /**
   * Make web/config if it doesn't exist
   * and write postcss.config.js there
   */

  /**
   * Check if PostCSS config already exists.
   * If it exists, throw an error.
   */
  if (!force && postCSSConfigExists()) {
    throw new Error(
      'PostCSS config already exists.\nUse --force to override existing config.'
    )
  } else {
    return writeFile(
      getPaths().web.postcss,
      fs
        .readFileSync(
          path.resolve(
            __dirname,
            'templates',
            'postcss.config.js.template'
          )
        )
        .toString(),
      { overwriteExisting: force }
    )
  }
}
