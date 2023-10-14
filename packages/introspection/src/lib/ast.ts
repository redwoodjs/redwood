import fs from 'node:fs'
import path from 'node:path'

import { parse as babelParse } from '@babel/parser'
import type { ParserPlugin } from '@babel/parser'
import traverse from '@babel/traverse'
import type {
  JSXElement,
  ExportNamedDeclaration,
  File,
  VariableDeclarator,
  ExportDefaultDeclaration,
} from '@babel/types'
import {
  assertJSXOpeningElement,
  assertJSXIdentifier,
  assertIdentifier,
  isJSXAttribute,
  isJSXSpreadAttribute,
  isVariableDeclaration,
  isVariableDeclarator,
  isIdentifier,
} from '@babel/types'

import { getPaths } from '@redwoodjs/project-config'

export function getASTFromFile(filepath: string) {
  const code = fs.readFileSync(filepath, { encoding: 'utf8', flag: 'r' })

  // use jsx plugin for web files, because in JS, the .jsx extension is not used
  const isJsxFile =
    path.extname(filepath).match(/[jt]sx$/) ||
    path.parse(filepath).dir.startsWith(getPaths().web.base)

  const plugins = [
    'typescript',
    'nullishCoalescingOperator',
    'objectRestSpread',
    isJsxFile && 'jsx',
  ].filter(Boolean) as ParserPlugin[]

  return babelParse(code, {
    sourceType: 'module',
    plugins,
  })
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

export function getJSXElementAttributes(element: JSXElement) {
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
