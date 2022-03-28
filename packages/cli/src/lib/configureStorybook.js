import fs from 'fs-extra'

import { getPaths } from '.'

/**
 * Configure Storybook for the given template by creating a custom preview config
 */
export default function configureStorybook({ force }, newStorybookPreviewConfig) {
  const storybookPreviewConfigPath = getPaths().web.storybookPreviewConfig

  let storybookPreviewConfig
  /**
   *  Check if storybookPreviewConfig already exists.
   *  Merge both files if it does.
   *  By removing import react and export decorator from new config
   *  And put new config inside current config after last import
   */
  if (fs.existsSync(storybookPreviewConfig)) {
    if (force) {
      fs.unlinkSync(storybookPreviewConfig)
      finalNewStorybookPreview = newStorybookPreview
    } else {
      const currentConfig = fs
        .readFileSync(storybookPreviewConfig)
        .toString()

      const newDecoratorsName = newStorybookPreview.match(
        /export const decorators = \[(.*?)\]/
      )[1]

      const currentDecoratorsName = currentConfig.match(
        /export const decorators = \[(.*?)\]/
      )[1]

      const decoratorsExport = `export const decorators = [${currentDecoratorsName}, ${newDecoratorsName}]`

      const insideNewStorybookConfigWithoutReactAndDecoration =
        newStorybookPreview
          .replace(/import *. as React from 'react'/, '')
          .replace(/export const decorators = .*/, '')

      const currentConfigWithoutDecoration =
        currentConfig.replace(/export const decorators = .*/, '')

      const reverseCurrentConfig =
        currentConfigWithoutDecoration.split('\n').reverse()

      const indexOfLastImport = reverseCurrentStorybookConfig.findIndex(
        (value) => /^import /.test(value)
      )
      reverseCurrentConfig.splice(
        indexOfLastImport,
        0,
        insideNewStorybookConfigWithoutReactAndDecoration
      )
      const finalCurrentStorybookConfig =
        reverseCurrentConfig.reverse().join(`\n`) +
        `\n` +
        finalDecoratorsExport

      finalNewStorybookPreview = finalCurrentStorybookConfig
    }
  } else {
    finalNewStorybookPreview = newStorybookPreview
  }

  fs.outputFileSync(storybookPreviewConfig, finalNewStorybookPreview)
}
