import path from 'path'

import { format } from 'prettier'

import getRWPaths from './getRWPaths'

const getPrettierConfig = () => {
  try {
    return require(path.join(getRWPaths().base, 'prettier.config.js'))
  } catch (e) {
    return undefined
  }
}

const prettify = (code: string, options: Record<string, any> = {}) =>
  format(code, {
    singleQuote: true,
    semi: false,
    ...getPrettierConfig(),
    parser: 'babel',
    ...options,
  })

export default prettify
