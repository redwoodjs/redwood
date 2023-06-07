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
        'https://raw.githubusercontent.com/redwoodjs/redwood/main/packages/create-redwood-app/templates/ts/web/src/pages/FatalErrorPage/FatalErrorPage.tsx',
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

      if (isTSPage) {
        fs.writeFileSync(`${filename}.tsx`, text)
      } else {
        // Keep only the '.jsx' version if we upgraded from an existing '.js'
        fs.writeFileSync(`${filename}.jsx`, text)
        if (fs.existsSync(`${filename}.js`)) {
          fs.rmSync(`${filename}.js`)
        }
      }
    }
  }
}
