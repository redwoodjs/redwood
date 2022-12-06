import fs from 'fs'

import { parse } from '@babel/parser'
import { JSXElement, assertIdentifier } from '@babel/types'
import {
  assertJSXOpeningElement,
  assertJSXIdentifier,
  isJSXAttribute,
  isJSXSpreadAttribute,
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
              `Uknown value type found while trying to process the ${key} property when extracting all attributes`
            )
            break
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

export function getASTFromFile(filePath: string) {
  const code = fs.readFileSync(filePath, { encoding: 'utf8', flag: 'r' })
  return getASTFromCode(code)
}
