import type { FileInfo, API } from 'jscodeshift'

module.exports = function (file: FileInfo, api: API) {
  const j = api.jscodeshift

  return j(file.source)
    .findVariableDeclarators('foo')
    .renameTo('bar')
    .toSource()
}
