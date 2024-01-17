import path from 'path'

import { format } from 'prettier'

import { getPaths } from '@redwoodjs/project-config'

const getPrettierConfig = () => {
  try {
    return require(path.join(getPaths().base, 'prettier.config.js'))
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
