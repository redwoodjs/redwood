import fs from 'fs'

import { parse } from '@babel/parser'

export function getASTFromCode(code: string) {
  return parse(code, {
    sourceType: 'unambiguous',
    // TODO: Check these plugin options are optimal, I doubt they are
    plugins: [
      'jsx',
      'typescript',
      'nullishCoalescingOperator',
      'objectRestSpread',
    ],
  })
}

export function getASTFromFile(filePath: string) {
  const code = fs.readFileSync(filePath, { encoding: 'utf8', flag: 'r' })
  return getASTFromCode(code)
}
