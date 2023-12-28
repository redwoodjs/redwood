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
        'https://raw.githubusercontent.com/redwoodjs/redwood/v5.3.1/packages/create-redwood-app/templates/ts/web/src/pages/FatalErrorPage/FatalErrorPage.tsx',
    },
  }

  /**
   * Now we just fetch and replace files
   */
  for (const [_dir, filenamesToUrls] of Object.entries(dirs)) {
    const isTSPage = fs.existsSync(
      path.join(webFatalErrorPagesDir, 'FatalErrorPage.tsx')
    )

    for (const [filename, url] of Object.entries(filenamesToUrls)) {
      const res = await fetch(url)

      const text = await res.text()

      const newFatalErrorPage = `${filename}.${isTSPage ? 'tsx' : 'js'}`

      fs.writeFileSync(newFatalErrorPage, text)
    }
  }
}
