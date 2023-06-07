import fs from 'fs'

import type { FileInfo, API } from 'jscodeshift'

export default function transform(file: FileInfo, api: API) {
  const j = api.jscodeshift
  const ast = j(file.source)

  // Check if this file contains any JSX and rename it to .jsx if it does

  if (ast.find(j.JSXElement).length !== 0) {
    fs.renameSync(
      file.path,
      file.path.substring(0, file.path.lastIndexOf('.')) + '.jsx'
    )
    return ast.toSource()
  }

  if (ast.find(j.JSXFragment).length !== 0) {
    fs.renameSync(
      file.path,
      file.path.substring(0, file.path.lastIndexOf('.')) + '.jsx'
    )
    return ast.toSource()
  }

  if (ast.find(j.JSXText).length !== 0) {
    fs.renameSync(
      file.path,
      file.path.substring(0, file.path.lastIndexOf('.')) + '.jsx'
    )
    return ast.toSource()
  }

  return ast.toSource()
}
