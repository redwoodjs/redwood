import * as t from '@babel/types'

import { fillUnique, pushUnique, sieve } from './algorithms'

const nodeIs = (type) => (node) => node.type === type

const OPAQUE_UID_TAG =
  'RW_MERGE_OPAQUE_UID_Q2xldmVyIHlvdSEgSGF2ZSBhIGNvb2tpZS4='

function requireSameType(base, ext) {
  if (base.path.type !== ext.path.type) {
    throw new Error(
      'Attempting to merge nodes with different types. This is not yet supported.'
    )
  }
}

function requireStrategyExists(base, _ext, strategy, strategyName) {
  if (!(base.path.type in strategy)) {
    throw new Error(
      `Attempting to ${strategyName} nodes that do not have an ${strategyName} strategy.`
    )
  }
}

export function opaquely(strategy) {
  strategy[OPAQUE_UID_TAG] = true
  return strategy
}

export function isOpaque(strategy) {
  return strategy[OPAQUE_UID_TAG] === true
}

export const keepBase = opaquely(() => {})

export const keepBoth = opaquely((base, ext) => {
  base.path.insertAfter(ext.path.node)
})

export const keepExtension = opaquely((base, ext) => {
  base.path.replaceWith(ext.path)
})

export const keepBothStatementParents = opaquely((base, ext) => {
  // This creates an ambiguity. How do we treat nodes "between" base and its statement parent? Do we
  // recursively merge those, or not? In other words, are we opaque starting from base, or starting
  // from base.getStatementParent()? If it's the former, this currently works - the node reducer of
  // keepBothStatementParents marks the node as opaque. If it's the latter, this is wrong - again,
  // the node marked is opaque, but nodes which are children of base.getStatementParent(), but
  // parents of base will still be recursively merged by other strategies. I'm not sure what to do.
  base.path.getStatementParent().insertAfter(ext.path.getStatementParent().node)
})

const interleaveStrategy = {
  ImportDeclaration(baseImport, extImport) {
    const baseSpecs = baseImport.specifiers
    const extSpecs = extImport.specifiers

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
      return keepBothStatementParents(baseImport, extImport)
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

    baseImport.specifiers = firstSpecifierList
    if (rest.length) {
      baseImport.path.insertAfter(
        rest.map((specs) => t.importDeclaration(specs, baseImport.source))
      )
    }
  },
}
export function interleave(base, ext) {
  requireSameType(base, ext)
  requireStrategyExists(base, ext, interleaveStrategy, 'interleave')
  return interleaveStrategy[base.path.type](base, ext)
}

const concatStrategy = {
  ArrayExpression(base, ext) {
    base.elements = [...base.elements, ...ext.elements]
  },
  ObjectExpression(base, ext) {
    base.properties = [...base.properties, ...ext.properties]
  },
  StringLiteral(base, ext) {
    base.value = base.value.concat(ext.value)
  },
}
export function concat(base, ext) {
  requireSameType(base, ext)
  requireStrategyExists(base, ext, concatStrategy, 'concat')
  return concatStrategy[base.path.type](base, ext)
}

const concatUniqueStrategy = {
  ArrayExpression(base, ext, eq) {
    pushUnique(eq, base.elements, ...ext.elements)
  },
  ObjectExpression(base, ext, eq) {
    pushUnique(eq, base.properties, ...ext.properties)
  },
}
export function concatUnique(equality) {
  return (base, ext) => {
    requireSameType(base, ext)
    requireStrategyExists(base, ext, concatUniqueStrategy, 'concatUnique')
    return concatUniqueStrategy[base.path.type](base, ext, equality)
  }
}
