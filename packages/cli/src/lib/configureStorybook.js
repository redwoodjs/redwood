import path from 'path'
import util from 'util'

import fs from 'fs-extra'

import { merge } from './merge'
import {
  interleave,
  concatUnique,
  keepBoth,
  keepBothStatementParents,
} from './merge/strategy'

import { getPaths } from '.'

export default async function extendStorybookConfiguration(
  newConfigPath = undefined
) {
  const sbPreviewConfigPath = getPaths().web.storybookPreviewConfig
  if (!fs.existsSync(sbPreviewConfigPath)) {
    await util.promisify(fs.cp)(
      path.join(__dirname, 'templates', 'storybook.preview.js.template'),
      sbPreviewConfigPath
    )
  }

  if (newConfigPath) {
    const read = (path) => fs.readFileSync(path, { encoding: 'utf-8' })
    const write = (path, data) => fs.writeFileSync(path, data)
    const baseFile = read(sbPreviewConfigPath)
    const extensionFile = read(newConfigPath)

    const merged = merge(baseFile, extensionFile, {
      ImportDeclaration: interleave,
      ArrayExpression: concatUnique,
      ObjectExpression: concatUnique,
      ArrowFunctionExpression: keepBothStatementParents,
      FunctionDeclaration: keepBoth,
    })

    write(sbPreviewConfigPath, merged)
  }
}
