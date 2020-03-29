import path from 'path'
import fs from 'fs'

export type PagesDependency = {
  const: string
  path: string
  importStatement: string
}

/**
 * Recursively process the pages directory and return information useful for
 * automated imports.
 */
export const processPagesDir = (
  webPagesDir: string,
  prefix: Array<string> = []
): Array<PagesDependency> => {
  const deps: Array<PagesDependency> = []
  const entries = fs.readdirSync(webPagesDir, { withFileTypes: true })

  // Iterate over a dir's entries, recursing as necessary into
  // subdirectories.
  entries.forEach((entry) => {
    if (entry.isDirectory()) {
      // Actual JS files reside in a directory of the same name, so let's
      // construct the filename of the actual Page file.
      const testFile = path.join(webPagesDir, entry.name, entry.name + '.js')

      if (fs.existsSync(testFile)) {
        // If the Page exists, then construct the dependency object and push it
        // onto the deps array.
        const basename = path.posix.basename(entry.name, '.js')
        const importName = prefix.join() + basename
        // `src/pages/<PageName>`
        const importFile = ['src', 'pages', ...prefix, basename].join('/')
        deps.push({
          const: importName,
          path: path.join(webPagesDir, entry.name),
          importStatement: `const ${importName} = { name: '${importName}', loader: () => import('${importFile}') }`,
        })
      } else {
        // If the Page doesn't exist then we are in a directory of Page
        // directories, so let's recurse into it and do the whole thing over
        // again.
        const newPrefix = [...prefix, entry.name]
        deps.push(
          ...processPagesDir(path.join(webPagesDir, entry.name), newPrefix)
        )
      }
    }
  })
  return deps
}
