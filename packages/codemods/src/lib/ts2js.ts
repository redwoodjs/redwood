import { transform } from '@babel/core'

import getRWPaths from './getRWPaths'
import prettify from './prettify'

const ts2js = (file: string) => {
  const result = transform(file, {
    cwd: getRWPaths().base,
    configFile: false,
    plugins: [
      [
        '@babel/plugin-transform-typescript',
        {
          isTSX: true,
          allExtensions: true,
        },
      ],
    ],
    retainLines: true,
  })

  if (result?.code) {
    return prettify(result.code)
  }

  return null
}

export default ts2js
