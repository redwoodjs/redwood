/**
 * @param {import('jscodeshift').FileInfo} file
 * @param {import('jscodeshift').API} _api
 */
export default function transform(file, _api) {
  // This is the easy case.
  const match = file.source
    .trim()
    .match(
      /module.exports = require\('@redwoodjs\/testing\/config\/jest\/(?<side>api|web)'\)/
    )

  if (match?.length) {
    file.source = [
      '// More info at https://redwoodjs.com/docs/project-configuration-dev-test-build',
      '',
      'const config = {',
      "  rootDir: '../',",
      `  preset: '@redwoodjs/testing/config/jest/${match.groups?.side}',`,
      '}',
      '',
      'module.exports = config',
    ].join('\n')

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
