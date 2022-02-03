// import { FileInfo, API } from 'jscodeshift'
import fetchFileFromTemplate from '../../../lib/fetchFileFromTemplate'

/**
 * @param {import('jscodeshift').FileInfo} file
 * @param {import('jscodeshift').API} api
 */
export default async function transform(file, api) {
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

  const j = api.jscodeshift
  const ast = j(file.source)

  const paths = ast.find(j.SpreadElement, {
    argument: { callee: { name: 'require' } },
  })

  const oldConfig = paths.filter((path) => {
    return (
      path.node.argument.arguments[0].value ===
      '@redwoodjs/testing/config/jest/web'
    )
  })

  oldConfig.replaceWith(
    ["rootDir: '../'", "preset: '@redwoodjs/testing/config/jest/web'"].join(
      ',\n'
    )
  )

  return ast.toSource({ trailingComma: true })
}
