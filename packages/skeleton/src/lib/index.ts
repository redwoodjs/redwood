import fs from 'fs'

import { parse } from '@babel/parser'

export function getFileAST(filePath: string) {
  const code = fs.readFileSync(filePath, { encoding: 'utf8', flag: 'r' })
  return parse(code, {
    sourceType: 'unambiguous',
    plugins: ['jsx', 'typescript'],
  })
}
