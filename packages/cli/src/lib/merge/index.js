import { parse, traverse } from '@babel/core'
import generate from '@babel/generator'
import prettier from 'prettier'

import { forEachFunctionOn } from './algorithms'
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

// For a given node type, produce an identifier that would make it semantically unique in javascript.
// Generally, the scoped identifier for the node. For things like imports, we deduplicate with
// the import source.
function semanticName(path) {
  switch (path.type) {
    case 'FunctionDeclaration':
      return [path.node.id.name]
    case 'VariableDeclarator':
      // e.g, ['const', 'x']
      return [path.parent.kind, path.node.id.name]
    case 'ImportDeclaration':
      return [path.node.source.value]
    default:
      return undefined
  }
}

function semanticIdentity(path) {
  const name = semanticName(path)
  return name && [...semanticAncestry(path), ...name].join('.')
}

function mergeAST(baseAST, extAST, callerMergeStrategy = {}) {
  const strategy = { ...defaultMergeStrategy, ...callerMergeStrategy }
  const strategyWithUtility = { ...mergeUtility, ...strategy }
  const identities = {}

  const baseVisitor = {}
  const extVisitor = {}

  forEachFunctionOn(strategy, (name, _func) => {
    extVisitor[name] = (path) => {
      const semanticId = semanticIdentity(path)
      semanticId && (identities[semanticId] ||= []).push(path)
    }
    baseVisitor[name] = (path) => {
      const id = semanticIdentity(path)
      if (id && id in identities) {
        // In rare cases (e.g. multiple imports from the same source), we may have multiple
        // declarations with the same identity. In this case, we perform a left-associative
        // operation, merging each declaration as ((base <=> extPath1) <=> extPath2),
        // where <=> is merge.
        identities[id].forEach((extPath) =>
          strategyWithUtility[name](path, extPath, {
            semanticLocation: id,
          })
        )
        delete identities[id]
      }
    }
  })

  traverse(extAST, extVisitor)
  traverse(baseAST, baseVisitor)

  baseAST.program.body.push(
    ...Object.values(identities)
      .flat()
      .map((path) => path.getStatementParent().node)
  )
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
  // It is no longer possible to configure babel's generator to produce consistent single/double quotes.
  // So, we run `prettier` here to yield predictable and clean code.

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
