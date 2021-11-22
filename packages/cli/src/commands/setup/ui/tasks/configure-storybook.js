import path from 'path'

import fs from 'fs-extra'

import { getPaths } from '../../../../lib'

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
 * Configure Storybook for Chakra UI by creating a custom preview config
 */
export function configureStorybook() {
  const { storybookPreviewConfig } = getPaths().web

  const storybookPreview = fs.readFileSync(
    path.join(__dirname, '..', 'templates', 'storybook.preview.js.template'),
    'utf-8'
  )

  fs.outputFileSync(storybookPreviewConfig, storybookPreview)
}
