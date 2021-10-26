import path from 'path'

import { transform } from '@babel/core'
import { format } from 'prettier'

import getRWPaths from './getRWPaths'

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

  return prettify((result as Record<string, string>).code)
}

const prettierConfig = () => {
  try {
    return require(path.join(getRWPaths().base, 'prettier.config.js'))
  } catch (e) {
    return undefined
  }
}

const prettify = (code: string) =>
  format(code, {
    ...prettierConfig(),
    parser: 'babel',
  })

export default ts2js
