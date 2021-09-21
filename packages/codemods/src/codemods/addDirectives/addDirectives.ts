/**
 * Adds the `directives` directory and its subdirectories to a Redwood project.
 *
 * ```
 * api
 * ├── src
 * │   ├── directives                  # we need add this and its subirs
 * │   │   ├── requireAuth
 * │   │   ├── requireAuth.test.ts # -> get from github
 * │   │   │   └── requireAuth.ts      # -> get from github
 * │   │   ├── skipAuth
 * │   │   │   ├── skipAuth.test.ts    # -> get from github
 * │   │   │   └── skipAuth.ts         # -> get from github
 * ```
 */
import fs from 'fs'
import path from 'path'

import fetch from 'node-fetch'

import { getPaths as getRWPaths } from '@redwoodjs/internal'

export const addDirectives = async () => {
  const rwPaths = getRWPaths()

  /**
   * An object where the keys are resolved filenames and the values are (for the most part) URLs to fetch.
   * Weaving the complexity into the data structure makes the logic simpler.
   *
   * @remark
   *
   * Without the brackets areound requireAuthDir and skipAuthDir, the key would just be 'requireAuthDir' and 'skipAuthDir' instead of their values.
   */
  const requireAuthDir = path.join(rwPaths.api.directives, 'requireAuth')
  const skipAuthDir = path.join(rwPaths.api.directives, 'skipAuth')

  const dirs = {
    [requireAuthDir]: {
      [path.join(requireAuthDir, 'requireAuth.ts')]:
        'https://raw.githubusercontent.com/redwoodjs/redwood/main/packages/create-redwood-app/template/api/src/directives/requireAuth/requireAuth.ts',
      [path.join(requireAuthDir, 'requireAuth.test.ts')]:
        'https://raw.githubusercontent.com/redwoodjs/redwood/main/packages/create-redwood-app/template/api/src/directives/requireAuth/requireAuth.test.ts',
    },
    [skipAuthDir]: {
      [path.join(skipAuthDir, 'skipAuth.ts')]:
        'https://raw.githubusercontent.com/redwoodjs/redwood/main/packages/create-redwood-app/template/api/src/directives/skipAuth/skipAuth.test.ts',
      [path.join(skipAuthDir, 'skipAuth.test.ts')]:
        'https://raw.githubusercontent.com/redwoodjs/redwood/main/packages/create-redwood-app/template/api/src/directives/skipAuth/skipAuth.ts',
    },
  }

  /**
   * Now we just mkdirs and fetch files.
   */
  fs.mkdirSync(rwPaths.api.directives)

  for (const [dir, filenamesToUrls] of Object.entries(dirs)) {
    fs.mkdirSync(dir)

    for (const [filename, url] of Object.entries(filenamesToUrls)) {
      const res = await fetch(url)
      const text = await res.text()
      fs.writeFileSync(filename, text)
    }
  }
}

/**
 * For yargs.
 */
export const command = 'add-directives'
export const description = 'Add directives to a Redwood project'
export const handler = addDirectives
