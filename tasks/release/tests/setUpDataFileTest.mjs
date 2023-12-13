/* eslint-env node */
import { parseArgs } from 'node:util'

import { setUpDataFile } from '../releaseLib.mjs'

function main() {
  const { values } = parseArgs({
    options: {
      file: {
        type: 'string',
        short: 'f',
      },
      scenario: {
        type: 'string',
        short: 's',
      },
    },
  })

  const data = setUpDataFile(new URL(values.file, import.meta.url))

  if (values.scenario === 'empty-map') {
    return
  }

  data.set('ed8a87d98d8c3e5dad23ac3e2143b46a201194dc', {
    message: 'chore(deps): update dependency esbuild to v0.19.2 (#9029)',
    needsCherryPick: false,
  })
}

main()
