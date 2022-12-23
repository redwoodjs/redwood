import fs from 'fs'

import { parse } from '@babel/parser'
import traverse from '@babel/traverse'
import {
  assertJSXOpeningElement,
  assertJSXIdentifier,
  assertIdentifier,
  isJSXAttribute,
  isJSXSpreadAttribute,
  JSXElement,
  ExportNamedDeclaration,
  isVariableDeclaration,
  isVariableDeclarator,
  isIdentifier,
  File,
  VariableDeclarator,
  ExportDefaultDeclaration,
} from '@babel/types'

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

export function getSpecificNamedExportDeclarations(ast: File, names: string[]) {
  const desiredNamedExports: Map<string, VariableDeclarator> = new Map()
  const allNamedExports: ExportNamedDeclaration[] = []
  traverse(ast, {
    ExportNamedDeclaration: (path) => {
      allNamedExports.push(path.node)
    },
  })
  allNamedExports.forEach((namedExport) => {
    if (
      namedExport.declaration != null &&
      isVariableDeclaration(namedExport.declaration) &&
      isVariableDeclarator(namedExport.declaration.declarations[0]) &&
      isIdentifier(namedExport.declaration.declarations[0].id) &&
      names.includes(namedExport.declaration.declarations[0].id.name)
    ) {
      desiredNamedExports.set(
        namedExport.declaration.declarations[0].id.name,
        namedExport.declaration.declarations[0]
      )
    }
  })
  return desiredNamedExports
}

export function getExportDefaultDeclaration(ast: File) {
  let defaultExport: ExportDefaultDeclaration | undefined
  traverse(ast, {
    ExportDefaultDeclaration: (path) => {
      defaultExport = path.node
    },
  })
  return defaultExport
}

export function getVariableDeclarator(ast: File, name: string) {
  let variableDeclarator: VariableDeclarator | undefined
  traverse(ast, {
    VariableDeclarator: (path) => {
      if (isIdentifier(path.node.id) && path.node.id.name === name) {
        variableDeclarator = path.node
      }
    },
  })
  return variableDeclarator
}

export function getJSXElementAttributes(
  element: JSXElement
): Map<string, string> {
  const attributes: Map<string, string> = new Map()
  assertJSXOpeningElement(element.openingElement)
  if (element.openingElement.attributes.length > 0) {
    element.openingElement.attributes.forEach((attribute) => {
      if (isJSXAttribute(attribute)) {
        assertJSXIdentifier(attribute.name)
        const key = attribute.name.name
        let value: string
        switch (attribute.value?.type) {
          case 'StringLiteral':
            value = attribute.value.value
            break
          case 'JSXExpressionContainer':
            assertIdentifier(attribute.value.expression)
            value = attribute.value.expression.name
            break
          case undefined: // Accept this because it could be a attribute with no value, i.e. notfound
            value = 'true'
            break
          default:
            throw new Error(
              `Unknown value type found while trying to process the ${key} property when extracting all attributes`
            )
        }
        attributes.set(key, value)
      } else if (isJSXSpreadAttribute(attribute)) {
        throw new Error(
          'JSXSpreadAttribute type is not yet supported when extracting all attributes'
        )
      } else {
        throw new Error(
          'Uknown attribute type found while trying to extract all attributes'
        )
      }
    })
  }
  return attributes
}
