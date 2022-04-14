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
  const locations = {}

  const baseVisitor = {}
  const extVisitor = {}

  forEachFunctionOn(strategy, (name, _func) => {
    // TODO: If ext has two+ imports from the same source, we'll handle it poorly.
    // This is another special-casing for the degenerate problem of uniquely identifying imports.
    // I think our best bet is to make the merge functions take f(base, [...ext], {loc}) in the
    // special case of imports... but it would be gross to have a different signature for imports.
    extVisitor[name] = (path) => {
      const semanticId = semanticIdentity(path)
      semanticId && (locations[semanticId] = path)
    }
    baseVisitor[name] = (path) => {
      const loc = semanticIdentity(path)
      if (loc && loc in locations) {
        strategyWithUtility[name](path, locations[loc], {
          semanticLocation: loc,
        })
        delete locations[loc]
      }
    }
  })

  traverse(extAST, extVisitor)
  traverse(baseAST, baseVisitor)

  const extras = Object.values(locations).map(
    (path) => path.getStatementParent().node
  )

  baseAST.program.body.push(...extras)
}

export function merge(base, extension) {
  const baseAST = parse(base)
  const extAST = parse(extension)

  mergeAST(baseAST, extAST)
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
