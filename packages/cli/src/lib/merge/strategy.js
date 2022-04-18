import * as t from '@babel/types'

import { fillUnique, nodeIs, overlap, pushUnique, sieve } from './algorithms'

export const mergeUtility = {
  _insertAfter: (base, ...exts) => {
    // When merging, trailing comments are kind of nasty, since a comment can simultaneously be
    // parsed as a trailing comment of one expression, and a leading comment of the subsequent
    // expression. There's apparently no way in babel to say, "assume all comments are leading",
    // so I'm trying this as a workaround.
    base.node.trailingComments = []
    base.insertAfter(...exts)
  },
  keepBoth: (base, ext) => {
    mergeUtility._insertAfter(base, ext.node)
    base.skip()
  },
  keepBothStatementParents: (base, ext) => {
    mergeUtility._insertAfter(
      base.getStatementParent(),
      ext.getStatementParent().node
    )
    base.skip()
  },
  keepBase: (_base, _ext) => {},
  keepExtension: (base, ext) => {
    base.replaceWith(ext)
    base.skip()
  },
  mergeComments: (base, ext) => {
    // Disregard comment type (CommentBlock or CommentLine) and only consider content.
    const commentEquality = (lhs, rhs) => lhs.value === rhs.value

    // A comment can be parsed as both a leading comment for one expression and a trailing comment
    // for another. So, we basically ignore trailing comments and assume comments "belong" to the
    // expression they precede.
    if (base.node.leadingComments?.length && ext.node.leadingComments?.length) {
      pushUnique(
        commentEquality,
        base.node.leadingComments,
        ...ext.node.leadingComments
      )
    }
  },
  recurse: function (on, base, ext) {
    const baseOn = base.get(on)
    this[baseOn.node.type](baseOn, ext.get(on))
    if (baseOn.shouldSkip) {
      base.skip()
    }
  },
}

export const defaultMergeStrategy = {
  ArrowFunctionExpression: mergeUtility.keepBothStatementParents,
  FunctionDeclaration: mergeUtility.keepBoth,
  VariableDeclarator(base, ext) {
    return base.node.init.type === ext.node.init.type
      ? this.recurse('init', base, ext)
      : this.keepBothStatementParents(base, ext)
  },
  ExportNamedDeclaration(baseExport, extExport) {
    mergeUtility.mergeComments(baseExport, extExport)
  },
  ImportDeclaration(baseImport, extImport) {
    mergeUtility.mergeComments(baseImport, extImport)

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
    mergeUtility._insertAfter(
      baseImport,
      rest.map((specs) => t.importDeclaration(specs, baseImport.node.source))
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
    const [overlaps, unique] = overlap(
      baseObject.get('properties'),
      extObject.get('properties'),
      (p) => p.node.key.name
    )

    overlaps.forEach(([b, e]) => this.recurse('value', b, e))
    baseObject.pushContainer(
      'properties',
      unique.map((e) => e.node)
    )
  },
  StringLiteral(baseString, extString) {
    return baseString.node.value === extString.node.value
      ? this.keepBase(baseString, extString)
      : this.keepBoth(baseString, extString)
  },
}
