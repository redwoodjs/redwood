/**
 * The following is a naive implementation:
 * The keys won't be named 'one' and 'two'.
 * But the logic in forEach may be enough.
 */
import type { FileInfo, API } from 'jscodeshift'

module.exports = function (file: FileInfo, api: API) {
  const j = api.jscodeshift

  return j(file.source)
    .find(j.Property, (p) => p.key.name === 'one' || p.key.name === 'two')
    .forEach((path) => {
      path.node.value = j.objectExpression([
        j.property('init', j.identifier('data'), path.node.value),
      ])
    })
    .toSource({ trailingComma: true })
}
