import * as React from 'react'

import { useStorageSlot } from '@docusaurus/theme-common'
import MDXContent from '@theme/MDXContent'

interface Props {
  children: React.ReactNode
}

/**
 * Only renders this block if user has selected TS in the codeblocks
 * @Note leave a blank space after opening the tag e.g.
 *
 * @example
 * <ShowForTs>
 * // {blank space}
 * ### Mdx Formatted content
 * </ShowForTs>
 * **/

export default function ShowForTs({ children }: Props) {
  const [jsTs] = useStorageSlot('docusaurus.tab.js-ts')

  return jsTs === 'ts' && <MDXContent>{children}</MDXContent>
}
