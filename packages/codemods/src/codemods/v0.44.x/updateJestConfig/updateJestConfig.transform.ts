import type { API, FileInfo } from 'jscodeshift'

export default function transform(file: FileInfo, _api: API) {
  console.log('yooo')

  // This is the easy case.
  if (
    file.source ===
    "module.exports = require('@redwoodjs/testing/config/jest/api')"
  ) {
    file.source = [
      'const config = {',
      "  rootDir: '../',",
      "  preset: '@redwoodjs/testing/config/jest/web',",
      '}',

      '',
      'module.exports = config',
    ].join('\n')

    return file.source
  }

  return null

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
