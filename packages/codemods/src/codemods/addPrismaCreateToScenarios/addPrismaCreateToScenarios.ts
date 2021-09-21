/**
 * @todo
 */
import type { FileInfo, API } from 'jscodeshift'

module.exports = function (file: FileInfo, api: API) {
  return api
    .jscodeshift(file.source)
    .findVariableDeclarators('foo')
    .renameTo('bar')
    .toSource()
}
