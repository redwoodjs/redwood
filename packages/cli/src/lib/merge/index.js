import { parse, traverse, NodePath } from '@babel/core'
import generate from '@babel/generator'
import prettier from 'prettier'

import { forEachFunctionOn, deletePropertyIf } from './algorithms'
import { defaultMergeStrategy, mergeUtility } from './strategy'

// INFO: "Semantics"
// For this merge approach, we need to uniquely identify declarations across multiple JS files,
// regardless of physical position. I.e, if two files both contain "export const foo = 1", it doesn't
// matter where in the files they appear. The two exports should be considered identical for merging
// purposes. So, a declaration's "semantic identity", roughly speaking, is an identifier such that
// two declarations with the same semantic identity would produce a name collision. This is handled
// slightly differently for ImportDeclarations, which are uniquely identified by their import source.

// e.g. ['program', 'body', 'ExportNamedDeclaration', 'declaration', 'declarations', 'VariableDeclarator']
function semanticAncestry(nodePath) {
  const semanticLocation = (path) =>
    path.inList ? [path.listKey, path.type] : [path.key]

  return nodePath
    .getAncestry()
    .reduce((acc, i) => [...semanticLocation(i), ...acc], [])
}

function semanticName(path) {
  switch (path.type) {
    case 'ImportDeclaration':
      return ['source', path.node.source.value]
    default:
      return Object.keys(path.getBindingIdentifiers())
  }
}

function semanticIdentity(path) {
  const identifiers = semanticName(path)
  return (
    // If a path has no semantic name, it cannot be merged directly. It must be merged as a child
    // of a parent node which has an identity. I.e, given `const x = {foo:'foo'}`, we can only merge
    // the initialization expression `{foo:'foo'}` as a recursive merge of the parent
    // VariableDeclaration expression, `const x = {foo:'foo'}`
    identifiers.length && [...semanticAncestry(path), ...identifiers].join('.')
  )
}

function mergeAST(baseAST, extAST, callerMergeStrategy = {}) {
  if (callerMergeStrategy['Program'] !== undefined) {
    throw new Error('You may not specify a merge strategy for a Program node.')
    // because we need to visit that node as part of our implementation details.
  }

  const identities = {}
  const lastSeenOfType = {}
  const strategy = { ...defaultMergeStrategy, ...callerMergeStrategy }
  const strategyWithUtility = { ...mergeUtility, ...strategy }

  const baseVisitor = {
    Program: (path) => {
      lastSeenOfType['Program'] = path
    },
  }
  const extVisitor = {}

  forEachFunctionOn(strategy, (typename, _func) => {
    extVisitor[typename] = (path) => {
      const semanticId = semanticIdentity(path)
      semanticId && (identities[semanticId] ||= []).push(path)
    }
    baseVisitor[typename] = {
      enter: (path) => {
        lastSeenOfType[typename] = path
        const id = semanticIdentity(path)
        if (id && id in identities) {
          // In rare cases (e.g. multiple imports from the same source), we may have multiple
          // declarations with the same identity. In this case, we perform a left-associative
          // operation, merging each declaration as ((base <=> extPath1) <=> extPath2),
          // where <=> is merge.
          identities[id].forEach((extPath) =>
            strategyWithUtility[typename](path, extPath, {
              semanticLocation: id,
            })
          )

          if (path.shouldSkip) {
            const ancestry = semanticAncestry(path).join('.')
            deletePropertyIf(identities, ([k, _]) => k.startsWith(ancestry))
          } else {
            delete identities[id]
          }
        }
      },
    }
  })

  traverse(extAST, extVisitor)
  traverse(baseAST, baseVisitor)

  Object.values(identities)
    .flat()
    .forEach((path) => {
      const { node, type } = path.getStatementParent()
      lastSeenOfType[type] =
        type in lastSeenOfType
          ? lastSeenOfType[type].insertAfter(node).pop()
          : lastSeenOfType['Program'].pushContainer('body', node).pop()
    })
}

export function merge(base, extension, strategy) {
  const parseReact = (code) =>
    parse(code, {
      presets: ['@babel/preset-react'],
    })

  const baseAST = parseReact(base)
  const extAST = parseReact(extension)

  mergeAST(baseAST, extAST, strategy)
  const { code } = generate(baseAST)

  // https://github.com/babel/babel/issues/5139
  // https://github.com/babel/babel/discussions/13989
  // It is no longer possible to configure babel's generator to produce consistent single/double
  // quotes. So, we run `prettier` here to yield predictable and clean code.

  // TODO: point this at prettier.config.js at the project root instead of copying the values.
  // Note that you can pass { filename: ... } to the prettier options.
  return prettier.format(code, {
    parser: 'babel',
    bracketSpacing: true,
    tabWidth: 2,
    semi: false,
    singleQuote: true,
  })
}
