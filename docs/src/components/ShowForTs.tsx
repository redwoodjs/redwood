import * as React from 'react'

import { useTabGroupChoice } from '@docusaurus/theme-common/internal'
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
  const { tabGroupChoices } = useTabGroupChoice()

  const isTsSelected = tabGroupChoices['js-ts'] === 'ts'

  return isTsSelected && <MDXContent>{children}</MDXContent>
}
