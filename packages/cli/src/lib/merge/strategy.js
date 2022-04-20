import * as t from '@babel/types'

import { fillUnique, nodeIs, overlap, pushUnique, sieve } from './algorithms'

const OPAQUE_UID = 'RW_MERGE_OPAQUE_UID'

export const mergeUtility = {
  opaquely: (strategy) => {
    strategy[OPAQUE_UID] = true
    return strategy
  },
  isOpaque: (strategy) => {
    return strategy[OPAQUE_UID] === true
  },
  keepBoth: (base, ext) => {
    base.insertAfter(ext.node)
    base.skip()
  },
  keepBothStatementParents: (base, ext) => {
    base.getStatementParent().insertAfter(ext.getStatementParent().node)
    base.skip()
  },
  keepBase: (_base, _ext) => {},
  keepExtension: (base, ext) => {
    base.replaceWith(ext)
    base.skip()
  },
}

export const defaultMergeStrategy = {
  ArrowFunctionExpression: mergeUtility.opaquely(
    mergeUtility.keepBothStatementParents
  ),
  FunctionDeclaration: mergeUtility.opaquely(mergeUtility.keepBoth),
  ImportDeclaration(baseImport, extImport) {
    const baseSpecs = baseImport.node.specifiers
    const extSpecs = extImport.node.specifiers

    const importSpecifierEquality = (lhs, rhs) =>
      lhs.type === rhs.type &&
      lhs.imported?.name === rhs.imported?.name &&
      lhs.local?.name == rhs.local?.name

    const uniqueSpecifiersOfType = (type) =>
      fillUnique(
        importSpecifierEquality,
        ...baseSpecs.filter(nodeIs(type)),
        ...extSpecs.filter(nodeIs(type))
      )

    // Rule 1: If there's exactly 1 import with 0 specifiers, it's a side-effect import and should
    // not be merged, because adding specifiers would change its meaning.
    if (!baseSpecs.length !== !extSpecs.length) {
      return this.keepBothStatementParents(baseImport, extImport)
    }

    // Rule 2: Default specifiers must appear first, and be unique in a statement.
    const defaultPosition = (specs) =>
      specs.some(nodeIs('ImportDefaultSpecifier')) ? -1 : 0

    // Rule 3: There can only be one wildcard import per statement, and wildcard imports cannot
    // mix with import specifiers.
    const namespacePosition = (specs) =>
      specs.some(nodeIs('ImportNamespaceSpecifier')) ||
      specs.some(nodeIs('ImportSpecifier'))
        ? -1
        : specs.length
    const importPosition = (specs) =>
      specs.some(nodeIs('ImportNamespaceIdentifier')) ? -1 : specs.length

    const [firstSpecifierList, ...rest] = sieve(
      [uniqueSpecifiersOfType('ImportDefaultSpecifier'), defaultPosition],
      [uniqueSpecifiersOfType('ImportNamespaceSpecifier'), namespacePosition],
      [uniqueSpecifiersOfType('ImportSpecifier'), importPosition]
    )

    baseImport.node.specifiers = firstSpecifierList
    if (rest.length) {
      baseImport.insertAfter(
        rest.map((specs) => t.importDeclaration(specs, baseImport.node.source))
      )
    }
  },
  ArrayExpression(baseArray, extArray) {
    pushUnique(
      (lhs, rhs) => lhs.type === rhs.type && lhs.value === rhs.value,
      baseArray.node.elements,
      ...extArray.node.elements
    )
  },
  ObjectExpression(baseObject, extObject) {
    pushUnique(
      (lhs, rhs) => lhs.key.name === rhs.key.name,
      baseObject.node.properties,
      ...extObject.node.properties
    )
  },
}
