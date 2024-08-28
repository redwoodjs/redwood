// @Note: babel is cjs modules, so we need to do these strange imports
import babelGenerate from '@babel/generator'
const generate = babelGenerate.default
import * as babelParser from '@babel/parser'
import babelTraverse from '@babel/traverse'
const traverse = babelTraverse.default
import * as babelTypes from '@babel/types'

/**
 * This function will take contents of vite.config.js/ts and add optimizeDeps.force property to the viteConfig object
 *
 * @param {string} code
 * @param {string[]} excludeValue
 * @returns {string}
 * **/
function modifyViteConfigToForceOptimize(code) {
  const ast = babelParser.parse(code, {
    sourceType: 'module',
    plugins: ['typescript'],
  })

  traverse(ast, {
    VariableDeclaration(path) {
      const { node } = path

      if (
        // @NOTE: this can be improved by finding what object to modify
        // based on what gets passed to defineConfig
        babelTypes.isIdentifier(node.declarations[0].id) &&
        node.declarations[0].id.name === 'viteConfig'
      ) {
        const properties = node.declarations[0].init.properties || []
        let optimizeDepsProp = null

        for (const prop of properties) {
          if (
            babelTypes.isObjectProperty(prop) &&
            babelTypes.isIdentifier(prop.key) &&
            prop.key.name === 'optimizeDeps'
          ) {
            optimizeDepsProp = prop
            break
          }
        }

        if (optimizeDepsProp) {
          if (
            babelTypes.isObjectExpression(optimizeDepsProp.value) &&
            Array.isArray(optimizeDepsProp.value.properties)
          ) {
            const forceProp = optimizeDepsProp.value.properties.find(
              (prop) =>
                babelTypes.isObjectProperty(prop) &&
                babelTypes.isIdentifier(prop.key) &&
                prop.key.name === 'force',
            )

            if (forceProp) {
              forceProp.value = babelTypes.booleanLiteral(true)
            } else {
              optimizeDepsProp.value.properties.push(
                babelTypes.objectProperty(
                  babelTypes.identifier('force'),
                  babelTypes.booleanLiteral(true),
                ),
              )
            }
          }
        } else {
          const forceProp = babelTypes.objectProperty(
            babelTypes.identifier('force'),
            babelTypes.booleanLiteral(true),
          )

          optimizeDepsProp = babelTypes.objectProperty(
            babelTypes.identifier('optimizeDeps'),
            babelTypes.objectExpression([forceProp]),
          )

          properties.push(optimizeDepsProp)
        }
      }
    },
  })

  const modifiedCode = generate(ast).code
  return modifiedCode
}

export default modifyViteConfigToForceOptimize
