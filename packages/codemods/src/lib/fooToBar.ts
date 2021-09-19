// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore

module.exports = function (fileInfo, api) {
  return api
    .jscodeshift(fileInfo.source)
    .findVariableDeclarators('foo')
    .renameTo('bar')
    .toSource()
}
