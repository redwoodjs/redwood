import * as React from 'react'

import { useTabGroupChoice } from '@docusaurus/theme-common/internal'

interface Props {
  path: string
}

/**
 * Takes a path on the form web/src/layouts/BlogLayout/BlogLayout.{js,tsx} and
 * replaces the end part, {js,tsx}, with the correct file extension depending
 * on what language the user has selected for the code blocks
 */
export default function FileExtSwitcher({ path }: Props) {
  const { tabGroupChoices } = useTabGroupChoice()

  const extensionStart = path.lastIndexOf('{')
  const extensions = path.slice(extensionStart + 1, path.length - 1)
  const ts = extensions.split(',')[1]
  const pathWithoutExt = path.slice(0, extensionStart)

  return (
    <code>
      {pathWithoutExt + (tabGroupChoices['js-ts'] === 'js' ? 'js' : ts)}
    </code>
  )
}
