import { getConfig } from '@redwoodjs/core'

export interface AutoImportPagesInterface {
  path: string
  regExp?: RegExp
}

/**
 * Automatically import pages from the web pages path (default: `./web/src/pages/`)
 * that end with `Page.js|ts`.
 *
 * @example
 * ```js
 * // Given: `./src/pages/HelloWorldPage/HelloWorldPage.js`
 * const { HelloWorld } = autoImportPages()
 * <HelloWorld />
 * ```
 */
export const autoImportPages = ({
  path,
  regExp = /Page\.js|ts|tsx$/,
}: AutoImportPagesInterface): { [PageName: string]: React.ElementType } => {
  if (!path) {
    path = getConfig().web.paths.pages
  }

  const pages = require.context(path, true, regExp)
  return pages
    .keys()
    .map((importPath) => [
      importPath
        .split('/')[1]
        .replace('Page', '')
        .replace('.js', '')
        .replace('.ts', '')
        .replace('.tsx', ''),
      importPath,
    ])
    .reduce((accumulator, currentValue) => {
      const [newPath, oldPath] = currentValue
      return {
        ...accumulator,
        [newPath]: pages(oldPath).default,
      }
    }, {})
}
