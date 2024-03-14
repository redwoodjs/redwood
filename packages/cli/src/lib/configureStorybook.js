import path from 'path'

import fse from 'fs-extra'
import prettier from 'prettier'

import { merge } from './merge'
import {
  interleave,
  concatUnique,
  keepBoth,
  keepBothStatementParents,
} from './merge/strategy'
import { isTypeScriptProject } from './project'

import { getPaths, transformTSToJS, writeFile } from '.'

/**
 * Extends the Storybook configuration file with the new configuration file
 * @param {string} newConfigPath - The path to the new configuration file
 */
export default async function extendStorybookConfiguration(
  newConfigPath = undefined
) {
  const webPaths = getPaths().web
  const ts = isTypeScriptProject()
  const sbPreviewConfigPath =
    webPaths.storybookPreviewConfig ??
    `${webPaths.config}/storybook.preview.${ts ? 'tsx' : 'js'}`
  const read = (path) => fse.readFileSync(path, { encoding: 'utf-8' })

  if (!fse.existsSync(sbPreviewConfigPath)) {
    // If the Storybook preview config file doesn't exist, create it from the template
    const templateContent = read(
      path.resolve(__dirname, 'templates', 'storybook.preview.tsx.template')
    )
    const storybookPreviewContent = ts
      ? templateContent
      : transformTSToJS(sbPreviewConfigPath, templateContent)

    await writeFile(sbPreviewConfigPath, storybookPreviewContent)
  }

  const storybookPreviewContent = read(sbPreviewConfigPath)

  if (newConfigPath) {
    // If the new config file path is provided, merge it with the Storybook preview config file
    const newConfigTemplate = read(newConfigPath)
    const newConfigContent = ts
      ? newConfigTemplate
      : transformTSToJS(newConfigPath, newConfigTemplate)

    const merged = merge(storybookPreviewContent, newConfigContent, {
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

    writeFile(sbPreviewConfigPath, formatted, { overwriteExisting: true })
  }
}
