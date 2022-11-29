import fs from 'fs'

import { parse } from '@babel/parser'
import { Program, ExportNamedDeclaration } from '@babel/types'

export function getProgramFromCode(code: string): Program {
  return parse(code, {
    sourceType: 'unambiguous',
    plugins: [
      'jsx',
      'typescript',
      'nullishCoalescingOperator',
      'objectRestSpread',
    ],
  }).program
}

export function getProgramFromFile(filePath: string): Program {
  const code = fs.readFileSync(filePath, { encoding: 'utf8', flag: 'r' })
  return getProgramFromCode(code)
}

export function getNamedExports(program: Program): ExportNamedDeclaration[] {
  return program.body.filter((node) => {
    return node.type === 'ExportNamedDeclaration'
  }) as ExportNamedDeclaration[]
}
