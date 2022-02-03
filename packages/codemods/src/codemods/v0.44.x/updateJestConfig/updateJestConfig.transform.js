import fetchFileFromTemplate from '../../../lib/fetchFileFromTemplate'
/**
 * @param {import('jscodeshift').FileInfo} file
 * @param {import('jscodeshift').API} _api
 */
export default async function transform(file, _api) {
  // This is the easy case.
  const match = file.source
    .trim()
    .match(
      /module.exports = require\('@redwoodjs\/testing\/config\/jest\/(?<side>api|web)'\)/
    )

  if (match?.length) {
    file.source = await fetchFileFromTemplate(
      'main',
      `${match.groups?.side}/jest.config.js`
    )

    return file.source
  }

  // const j = api.jscodeshift
  // const ast = j(file.source)

  // const paths = ast.find(j.CallExpression, { callee: { name: 'require' } })
  // const testingRequire = paths.filter((path) => {
  //   return path.node.arguments.some((argument) => {
  //     return (
  //       argument.type === j.ExpressionKind &&
  //       argument.value === '@redwoodjs/testing/config/jest/api'
  //     )
  //   })
  // })

  // console.log({ testingRequire: testingRequire.nodes() })

  // return ast.toSource()
}
