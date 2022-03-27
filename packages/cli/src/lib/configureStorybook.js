import fs from 'fs-extra'

import { getPaths } from '.'

/**
 * @param options {{ force?: boolean }}
 * @returns {"todo" | "done"}
 */
export function checkStorybookStatus({ force }) {
  const { storybookPreviewConfig } = getPaths().web // 'web/config/storybook.config.js'

  if (fs.existsSync(storybookPreviewConfig)) {
    if (force) {
      fs.unlinkSync(storybookPreviewConfig)
    } else {
      console.log(
        `Storybook preview config already exists at ${storybookPreviewConfig}\nUse --force to override existing config.`
      )
      return 'done'
    }
  }

  return 'todo'
}

/**
 * Configure Storybook for the given template by creating a custom preview config
 */
export function configureStorybook(storybookPreview) {
  const { storybookPreviewConfig } = getPaths().web

  fs.outputFileSync(storybookPreviewConfig, storybookPreview)
}
