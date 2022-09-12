import path from 'path'
import util from 'util'

import fse from 'fs-extra'
import prettier from 'prettier'

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
  if (!fse.existsSync(sbPreviewConfigPath)) {
    await util.promisify(fse.cp)(
      path.join(__dirname, 'templates', 'storybook.preview.js.template'),
      sbPreviewConfigPath
    )
  }

  if (newConfigPath) {
    const read = (path) => fse.readFileSync(path, { encoding: 'utf-8' })
    const write = (path, data) => fse.writeFileSync(path, data)
    const merged = merge(read(sbPreviewConfigPath), read(newConfigPath), {
      ImportDeclaration: interleave,
      ArrayExpression: concatUnique,
      ObjectExpression: concatUnique,
      ArrowFunctionExpression: keepBothStatementParents,
      FunctionDeclaration: keepBoth,
    })

    const formatted = prettier.format(merged, {
      parser: 'babel',
      ...(await prettier.resolveConfig(sbPreviewConfigPath)),
    })

    write(sbPreviewConfigPath, formatted)
  }
}
