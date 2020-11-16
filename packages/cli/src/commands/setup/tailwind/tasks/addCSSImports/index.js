import fs from 'fs'
import path from 'path'
import { getPaths, writeFile } from 'src/lib'

function tailwindImportsExist(content) {
  const hasBaseImport = /@import "tailwindcss\/base"/.test(content)
  const hasComponentsImport = /@import "tailwindcss\/components"/.test(content)
  const hasUtilitiesImport = /@import "tailwindcss\/utilities"/.test(content)

  return hasBaseImport && hasComponentsImport && hasUtilitiesImport
}

export default () => (_ctx, task) => {
  /**
   * Add tailwind imports and notes to the top of index.css
   */
  const tailwindImportsAndNotes = fs
    .readFileSync(path.join(__dirname, 'css-imports.template.css'))
    .toString()

  const cssPath = path.join(getPaths().web.src, 'index.css')
  const cssContent = fs.readFileSync(cssPath).toString()

  if (tailwindImportsExist(cssContent)) {
    task.skip(`Imports already exist in ${cssPath}`)
  } else {
    writeFile(
      cssPath,
      tailwindImportsAndNotes + cssContent,
      { overwriteExisting: true },
      task
    )
  }
}
