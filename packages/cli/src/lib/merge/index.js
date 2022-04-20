import path from 'path'

import { parse, traverse } from '@babel/core'
import generate from '@babel/generator'
import prettier from 'prettier'

import { getPaths as getRedwoodPaths } from '@redwoodjs/internal'

import { forEachFunctionOn, deletePropertyIf } from './algorithms'
import { isSemanticAncestor, semanticIdentity } from './semantics'
import { defaultMergeStrategy, mergeUtility } from './strategy'

// This feels like a weird way to achieve something so simple in Babel,
// but I can't find a better alternative.
function getProgramPath(ast) {
  let programPath = undefined
  traverse(ast, {
    Program(path) {
      programPath = path
    },
  })
  if (programPath === undefined) {
    throw new Error('Unable to find Program node in AST')
  }
  return programPath
}

// When merging, trailing comments are a bit nasty. A comment can be parsed as a leading comment
// of one expression, and a trailing comment of a subsequent expression. This is an open issue for
// Babel: https://github.com/babel/babel/issues/7002, but we can work around it pretty easily with
// the following.
function stripTrailingComments(...asts) {
  for (const ast of asts) {
    traverse(ast, {
      enter(path) {
        path.node.trailingComments = []
      },
    })
  }
}

function mergeAST(baseAST, extAST, callerMergeStrategy = {}) {
  const strategy = { ...defaultMergeStrategy, ...callerMergeStrategy }
  const strategyWithUtility = { ...mergeUtility, ...strategy }

  const baseProgramPath = getProgramPath(baseAST)
  const nextInsertPositionForType = {}
  const saveNextInsertPosition = (path) => {
    const pos = path.getStatementParent()
    nextInsertPositionForType[pos.type] = pos
  }
  const insertAtNextPosition = (path) => {
    const { node, type } = path.getStatementParent()
    nextInsertPositionForType[type] =
      type in nextInsertPositionForType
        ? nextInsertPositionForType[type].insertAfter(node).pop()
        : baseProgramPath.pushContainer('body', node).pop()
  }

  const identities = {}
  const baseVisitor = {}
  const extVisitor = {}

  forEachFunctionOn(strategy, (typename, _func) => {
    extVisitor[typename] = {
      enter(path) {
        const semanticId = semanticIdentity(path)
        semanticId && (identities[semanticId] ||= []).push(path)
      },
    }
    baseVisitor[typename] = {
      enter(path) {
        if (mergeUtility.isOpaque(strategy[path.type])) {
          path.skip()
          // https://github.com/babel/babel/issues/14480
          // Yuck. Remove this when Babel provides an alternative.
          baseVisitor[typename]['exit'][0](path)
        }
      },
      exit(path) {
        saveNextInsertPosition(path)
        const id = semanticIdentity(path)
        if (id && id in identities) {
          identities[id].forEach((extPath) =>
            strategyWithUtility[typename](path, extPath, {
              semanticLocation: id,
            })
          )
          deletePropertyIf(identities, ([k, _]) => isSemanticAncestor(id, k))
        }
      },
    }
  })

  stripTrailingComments(baseAST, extAST)
  traverse(extAST, extVisitor)
  traverse(baseAST, baseVisitor)

  const handled = []
  for (const [k, v] of Object.entries(identities)) {
    if (handled.some((h) => isSemanticAncestor(h, k))) {
      continue
    }
    v.forEach(insertAtNextPosition)
    handled.push(k)
  }
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

  if (process.env.JEST_WORKER_ID) {
    return prettier.format(code, {
      parser: 'babel',
      bracketSpacing: true,
      tabWidth: 2,
      semi: false,
      singleQuote: true,
    })
  } else {
    return prettier.format(code, {
      filepath: path.join(getRedwoodPaths().base, 'prettier.config.js'),
    })
  }
}
