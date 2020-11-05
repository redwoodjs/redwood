import fs from 'fs'
import path from 'path'
import { getPaths } from 'src/lib'

const tailwindImportsAndNotes = [
  '/**',
  ' * START --- TAILWIND GENERATOR EDIT',
  ' *',
  ' * `yarn rw setup tailwind` placed these imports here',
  " * to inject Tailwind's styles into your CSS.",
  ' * For more information, see: https://tailwindcss.com/docs/installation#add-tailwind-to-your-css',
  ' */',
  '@import "tailwindcss/base";',
  '@import "tailwindcss/components";',
  '@import "tailwindcss/utilities";',
  '/**',
  ' * END --- TAILWIND GENERATOR EDIT',
  ' */\n',
]

const INDEX_CSS_PATH = path.join(getPaths().web.src, 'index.css')

const tailwindImportsExist = (indexCSS) => {
  let content = indexCSS.toString()

  const hasBaseImport = () => /@import "tailwindcss\/base"/.test(content)

  const hasComponentsImport = () =>
    /@import "tailwindcss\/components"/.test(content)

  const hasUtilitiesImport = () =>
    /@import "tailwindcss\/utilities"/.test(content)

  return hasBaseImport() && hasComponentsImport() && hasUtilitiesImport()
}

export default () => (_ctx, task) => {
  /**
   * Add tailwind imports and notes to the top of index.css
   */
  let indexCSS = fs.readFileSync(INDEX_CSS_PATH)

  if (tailwindImportsExist(indexCSS)) {
    task.skip('Imports already exist in index.css')
  } else {
    indexCSS = tailwindImportsAndNotes.join('\n') + indexCSS
    fs.writeFileSync(INDEX_CSS_PATH, indexCSS)
  }
}
