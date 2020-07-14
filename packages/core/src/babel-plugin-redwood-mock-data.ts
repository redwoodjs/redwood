import path from 'path'

import type { PluginObj, types } from '@babel/core'

const cleanFileName = (f) => path.dirname(f).split('/').slice(-3).join('/')

/**
 * When developing with Storybook or Jest you'll need a way to mock data, and
 * network requests.
 *
 * We provides two functions `mockData` and `getMockData` to store and
 * retrieve mock data.
 *
 * @example: Static usage in Cells
 * ```js
 * // MyCell/MyCell.mock.js
 * export const standard = mockData({ answer: 42 })
 *
 * // MyCell/MyCell.stories.js
 * export const success = () => {
 *    const d = getMockData('standard') // returns: { answer: 42 }
 *    return <Success {...d} />
 * }
 * ```
 *
 * The example above is fine for static prop/ view stories and tests,
 * but what if you had a deeply nested Cell component that was not easy to mock?
 * @example: Deeply nested network requests
 * ```js
 * // MyCell/MyCell.js
 * export const QUERY = gql`
 * query GetUniversalConstant {
 *   answer
 * }
 * `
 *
 * // MyCell/MyCell.mock.js
 * export const standard = mockData({ answer: 42 }, 'GetUniversalConstant')
 * ```
 * Any GraphQL queries named "GetUniversalConstant" will now use the mocked
 * response `{ answer: 42 }` in Storybook and Jest.
 */
export default function ({ types: t }: { types: typeof types }): PluginObj {
  return {
    name: 'babel-plugin-redwood-mock-data',
    visitor: {
      ExportNamedDeclaration(p, state: { file?: any }) {
        const declaration = p.node.declaration
        if (declaration?.type !== 'VariableDeclaration') {
          return
        }

        const init = declaration.declarations[0]?.init as types.CallExpression
        const calleeName = (init?.callee as types.Identifier)?.name
        // Is this export calling `mockData`?
        if (calleeName !== 'mockData') {
          return
        }

        const exportName = (declaration.declarations[0].id as types.Identifier)
          ?.name
        const dirName = cleanFileName(state.file.opts.filename)
        // + __RW__AUTO_mockData(<originalData>, `${dirName}:${exportName}`)
        p.insertAfter(
          t.expressionStatement(
            t.callExpression(t.identifier('__RW__mockData'), [
              t.stringLiteral(dirName + ':' + exportName),
              init.arguments[0],
            ])
          )
        )
      },
      CallExpression(p, state: { file?: any }) {
        if ((p.node.callee as types.Identifier)?.name !== 'getMockData') {
          return
        }
        const dirName = cleanFileName(state.file.opts.filename)
        const key = (p.node.arguments[0] as types.StringLiteral)?.value
        // - getMockData(<key>)
        // + __RW__AUTO_getMockData(`${dirName}:${exportName}`)
        p.replaceWith(
          t.callExpression(t.identifier('__RW__getMockData'), [
            t.stringLiteral(dirName + ':' + key),
          ])
        )
      },
    },
  }
}
