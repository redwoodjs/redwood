import fs from 'fs'
import path from 'path'

import { fetch } from '@whatwg-node/fetch'

import { getPaths } from '@redwoodjs/project-config'

export const updateDevFatalErrorPage = async () => {
  const rwPaths = getPaths()

  /**
   * An object where the keys are resolved filenames and the values are (for the most part) URLs to fetch.
   *
   * @remarks
   *
   */
  const webFatalErrorPagesDir = path.join(rwPaths.web.pages, 'FatalErrorPage')

  const dirs = {
    [webFatalErrorPagesDir]: {
      [path.join(webFatalErrorPagesDir, 'FatalErrorPage')]:
        'https://raw.githubusercontent.com/redwoodjs/redwood/29138f59dc5abe7b3d3c2a11c6e6f5fee32580c5/packages/create-redwood-app/templates/ts/web/src/pages/FatalErrorPage/FatalErrorPage.tsx',
    },
  }

  /**
   * Now we just fetch and replace files
   */
  for (const [_dir, filenamesToUrls] of Object.entries(dirs)) {
    const isTsxPage = fs.existsSync(
      path.join(webFatalErrorPagesDir, 'FatalErrorPage.tsx')
    )
    const isJsxPage = fs.existsSync(
      path.join(webFatalErrorPagesDir, 'FatalErrorPage.jsx')
    )

    for (const [filename, url] of Object.entries(filenamesToUrls)) {
      const res = await fetch(url)

      const text = await res.text()

      const newFatalErrorPage = `${filename}.${
        isTsxPage ? 'tsx' : isJsxPage ? 'jsx' : 'js'
      }`

      fs.writeFileSync(newFatalErrorPage, text)
    }
  }
}
