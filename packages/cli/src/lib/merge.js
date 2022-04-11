import util from 'util'

import { parse, traverse } from '@babel/core'
import generate from '@babel/generator'
import * as t from '@babel/types'
import prettier from 'prettier'

// UTILITIES - Generic

const logdeep = (thing) => console.log(util.inspect(thing, { depth: 100 }))
const logshallow = (thing) => console.log(util.inspect(thing, { depth: 5 }))

function pushUnique(eq, arr, ...items) {
  itemloop: for (const i of items) {
    for (const j of arr) {
      if (eq(i, j)) {
        continue itemloop
      }
    }
    arr.push(i)
  }
}

function fillUnique(eq, ...items) {
  const result = []
  pushUnique(eq, result, ...items)
  return result
}

function forEachFunctionOn(object, callback) {
  for (const [key, value] of Object.entries(object)) {
    if (typeof value === 'function') {
      callback(key, value)
    }
  }
}

// sieve (noun) a device with meshes or perforations through which finer particles of a mixture
// (as of ashes, flour, or sand) of various sizes may be passed to separate them from coarser ones.
// In this algorithm, we take N list-rule-pairs, of the form [[...elements], rule], where `rule` is
// a unary function accepting a result subarray and returning a position (possibly -1) indicating
// where an element of its list may be placed in the given subarray. Each list-rule-pair can be
// thought of as a category of elements that have particular ordering concerns.
// The algorithm returns a minimally-sized array of arrays, where each element occurs exactly once
// in one of the subarrays, and none of the ordering rules are violated.
// It is assumed that no rule prevents an element from being placed alone in its own subarray.
function sieve(...listRulePairs) {
  const result = [[]]
  for (const [list, rule] of listRulePairs) {
    elementLoop: for (const element of list) {
      for (const arr of result) {
        const position = rule(arr)
        if (position !== -1) {
          arr.splice(position, 0, element)
          continue elementLoop
        }
      }
      // We haven't found an array appropriate to hold element. Assume that any element can
      // appear alone in a list, and create a new array holding that element:
      result.push([element])
    }
  }
  return result
}

// UTILITIES - Babel & ASTs

const nodeIs = (type) => (node) => node.type === type

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
    default:
      console.log(
        `WARNING: No semantic identification for ${path.node.type}. Default: node.id`
      )
      return path.node.id
    case 'VariableDeclarator':
      return path.node.id
    case 'ImportDeclaration':
      return path.node.source.value
  }
}

function semanticIdentity(path) {
  return [...semanticAncestry(path), semanticName(path)].join('.')
}

// IMPLEMENTATION

export const mergeStrategy = {
  ignore: 'MERGE_STRATEGY_IGNORE',
  keepBoth: (base, ext) => {
    base.insertAfter(ext.node)
  },
  keepBase: (_base, _ext) => {},
  keepExtension: (base, ext) => {
    base.node = ext.node
  },
  default: {
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
        return mergeStrategy.keepBoth
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
          rest.map((s) =>
            t.importDeclaration(
              s,
              t.stringLiteral(baseImport.node.source.value)
            )
          )
        )
      }
    },
    ObjectExpression(baseObj, extObj) {
      // Generate the code for these AST subtrees, then eval() the code into objects.
      // Merge the objects using standard javascript spread-operator rules.
      // Parse the merged object into an AST, and replace baseObj.node with it.
    },
  },
}

function mergeAST(baseAST, extAST, callerMergeStrategy = {}) {
  const strategy = { ...mergeStrategy.default, ...callerMergeStrategy }
  const locations = {}

  const baseVisitor = {}
  const extVisitor = {}

  forEachFunctionOn(strategy, (name, _func) => {
    // TODO: If ext has two+ imports from the same source, we'll handle it poorly.
    // This is another special-casing for the degenerate problem of uniquely identifying imports.
    // I think our best bet is to make the merge functions take f(base, [...ext], {loc}) in the
    // special case of imports... but it would be gross to have a different signature for imports.
    extVisitor[name] = (path) => {
      locations[semanticIdentity(path)] = path
    }
    baseVisitor[name] = (path) => {
      const loc = semanticIdentity(path)
      if (loc in locations) {
        let strat = strategy[name]
        // Merge strategies can return a function object, which is recursively called.
        while (typeof strat === 'function') {
          strat = strat(path, locations[loc], { semanticLocation: loc })
        }

        if (strat !== mergeStrategy.ignore) {
          delete locations[loc]
        }
      }
    }
  })

  traverse(extAST, extVisitor)
  traverse(baseAST, baseVisitor)

  // TODO: for all remaining things in locations, paste them into baseAST at a reasonable location in baseAST.
  // Object.values(locations).forEach((path) => {
  //   console.log(path)
  // })
}

export function merge(base, extension) {
  const baseAST = parse(base)
  const extAST = parse(extension)

  mergeAST(baseAST, extAST, {
    VariableDeclarator(baseDeclarator, extDeclarator, { semanticLocation }) {
      return semanticLocation.contains('ExportNamedDeclaration')
        ? mergeStrategy.default.VariableDeclarator
        : mergeStrategy.ignore
    },
  })

  const { code } = generate({
    type: 'Program',
    body: baseAST.program.body,
  })

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
