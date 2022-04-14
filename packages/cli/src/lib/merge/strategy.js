import * as t from '@babel/types'

import { fillUnique, nodeIs, pushUnique, sieve } from './algorithms'

export const mergeUtility = {
  keepBoth: (base, ext) => {
    base.getStatementParent().insertAfter(ext.getStatementParent().node)
  },
  keepBase: (_base, _ext) => {},
  keepExtension: (base, ext) => {
    base.replaceWith(ext)
  },
  recurse: function (on, base, ext) {
    const baseOn = base.get(on)
    this[baseOn.node.type](baseOn, ext.get(on))
  },
}

export const defaultMergeStrategy = {
  ArrowFunctionExpression: mergeUtility.keepBoth,
  FunctionDeclaration: mergeUtility.keepBoth,
  VariableDeclarator(base, ext) {
    return base.node.init.type === ext.node.init.type
      ? this.recurse('init', base, ext)
      : this.keepBoth(base, ext)
  },
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
      return this.keepBoth(baseImport, extImport)
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
    baseImport.insertAfter(
      rest.map((s) => t.importDeclaration(s, baseImport.node.source))
    )
  },
  ArrayExpression(baseArray, extArray) {
    pushUnique(
      (lhs, rhs) => lhs.type === rhs.type && lhs.value === rhs.value,
      baseArray.node.elements,
      ...extArray.node.elements
    )
  },
  ObjectProperty(baseProperty, extProperty) {
    return baseProperty.node.value.type === extProperty.node.value.type
      ? this.recurse('value', baseProperty, extProperty)
      : this.keepBoth(baseProperty, extProperty)
  },
  ObjectExpression(baseObject, extObject) {
    const uniqueEProps = []
    for (const eprop of extObject.get('properties')) {
      let unique = true
      for (const bprop of baseObject.get('properties')) {
        if (eprop.node.key.name === bprop.node.key.name) {
          this.recurse('value', bprop, eprop)
          unique = false
        }
      }
      if (unique) {
        uniqueEProps.push(eprop)
      }
    }

    baseObject.pushContainer('properties', ...uniqueEProps.map((u) => u.node))
  },
  StringLiteral(baseString, extString) {
    return baseString.node.value === extString.node.value
      ? this.keepBase(baseString, extString)
      : this.keepBoth(baseString, extString)
  },
}
