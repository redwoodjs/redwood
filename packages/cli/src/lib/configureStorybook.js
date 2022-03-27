import fs from 'fs-extra'

import { getPaths } from '.'

/**
 * Configure Storybook for the given template by creating a custom preview config
 */
export default function configureStorybook({ force }, newStorybookPreview) {
  const { storybookPreviewConfig } = getPaths().web
  let finalNewStorybookPreview
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
      const insideCurrentStorybookConfig = fs
        .readFileSync(storybookPreviewConfig)
        .toString()

      const insideNewStorybookConfig = fs
        .readFileSync(newStorybookPreview)
        .toString()

      const newDecoratorsName = insideNewStorybookConfig.match(
        /export const decorators = \[(.*?)\]/
      )[1]

      const currentDecoratorsName = insideCurrentStorybookConfig.match(
        /export const decorators = \[(.*?)\]/
      )[1]

      const finalDecoratorsExport = `export const decorators = [${currentDecoratorsName}, ${newDecoratorsName}]`

      const insideNewStorybookConfigWithoutReactAndDecoration =
        insideNewStorybookConfig
          .replace(/import *. as React from 'react'/, '')
          .replace(/export const decorators = .*/, '')

      let ReverseInsideCurrentStorybookConfig = insideCurrentStorybookConfig
        .split('\n')
        .reverse()

      const indexOfLastImport = ReverseInsideCurrentStorybookConfig.findIndex(
        (value) => /import/.test(value)
      )
      ReverseInsideCurrentStorybookConfig.splice(
        indexOfLastImport,
        0,
        insideNewStorybookConfigWithoutReactAndDecoration
      )
      const finalInsideCurrentStorybookConfig =
        ReverseInsideCurrentStorybookConfig.reverse().join(`\n`) +
        `\n` +
        finalDecoratorsExport

      finalNewStorybookPreview = finalInsideCurrentStorybookConfig
    }
  } else {
    finalNewStorybookPreview = newStorybookPreview
  }

  fs.outputFileSync(storybookPreviewConfig, finalNewStorybookPreview)
}
