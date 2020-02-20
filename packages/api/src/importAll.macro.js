import path from 'path'

import { createMacro } from 'babel-plugin-macros'
import glob from 'glob'
import { getPaths } from '@redwoodjs/internal'

// The majority of this code is copied from `importAll.macro`: https://github.com/kentcdodds/import-all.macro
// And was modified to work with our `getPaths`.

/**
 * This macro runs during build time.
 * @example
 * ```js
 *  import importAll from '@redwoodjs/api/importAll.macro
 *  const typeDefs = importAll('api', 'graphql')
 * ```
 */
function prevalMacros({ references, state, babel }) {
  references.default.forEach((referencePath) => {
    if (referencePath.parentPath.type === 'CallExpression') {
      importAll({ referencePath, state, babel })
    } else {
      throw new Error(
        `This is not supported: \`${referencePath
          .findParent(babel.types.isExpression)
          .getSource()}\`. Please use "importAll('target', 'directory')"`
      )
    }
  })
}

const getGlobPattern = (callExpressionPath, cwd) => {
  const args = callExpressionPath.parentPath.get('arguments')
  const target = args[0].evaluate().value
  const dir = args[1].evaluate().value

  const redwoodPaths = getPaths()
  const relativePaths = path.relative(cwd, redwoodPaths[target][dir])
  return `./${relativePaths}/**/*.{ts,js}`
}

function importAll({ referencePath, state, babel }) {
  const t = babel.types
  const { filename } = state.file.opts
  const cwd = path.dirname(filename)
  const globPattern = getGlobPattern(referencePath, cwd)

  // Grab a list of the files
  const importSources = glob.sync(globPattern, { cwd, ignore: './**/*.test.*' })

  const { importNodes, objectProperties } = importSources.reduce(
    (all, source) => {
      const id = referencePath.scope.generateUidIdentifier(source)
      all.importNodes.push(
        t.importDeclaration(
          [t.importNamespaceSpecifier(id)],
          t.stringLiteral(source)
        )
      )

      // Convert the relative path of the module to a key:
      //  ./services/a.js -> a
      //  ./services/a/a.js -> a
      //  ./services/a/a.sdl.js -> a
      const objectKey = path
        .basename(source, path.extname(source))
        .replace('.sdl', '')
      all.objectProperties.push(
        t.objectProperty(t.stringLiteral(objectKey), id)
      )
      return all
    },
    { importNodes: [], objectProperties: [] }
  )

  const program = state.file.path
  program.node.body.unshift(...importNodes)

  const objectExpression = t.objectExpression(objectProperties)
  referencePath.parentPath.replaceWith(objectExpression)
}

export default createMacro(prevalMacros)
