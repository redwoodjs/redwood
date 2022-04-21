import { parse, traverse } from '@babel/core'
import generate from '@babel/generator'
import { VISITOR_KEYS } from '@babel/types'
import prettier from 'prettier'

import { forEachFunctionOn, deletePropertyIf } from './algorithms'
import { semanticIdentifier } from './semanticIdentity'
import { isOpaque } from './strategy'

function extractProperty(property, fromObject) {
  const tmp = fromObject[property]
  delete fromObject[property]
  return tmp
}

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
// of one expression, and a trailing comment of a subsequent expression. This is sort of an open
// issue for Babel: https://github.com/babel/babel/issues/7002, but we can work around it pretty
// easily with the following:
function stripTrailingCommentsStrategy() {
  return {
    enter(path) {
      path.node.trailingComments = []
    },
  }
}

// See https://github.com/babel/babel/issues/14480
function skipChildren(path) {
  for (const key of VISITOR_KEYS[path.type]) {
    path.skipKey(key)
  }
}

// To make merge strategies more terse, we'd like to pass the AST node directly to the reducer, so
// we don't have to constantly write "node", as in:
// (lhs, rhs) => { lhs.node.thing + rhs.node.thing }
// We could just pass NodePath.node directly to the reducer, but there are reasonable (though rare)
// cases where we'd want to give our reducers access to the NodePath. To solve this, we create a
// proxy object that appears like a Babel Node with an additional 'path' property, which points back
// to the path object. This makes uses of the path more verbose, but for our purposes, this is
// preferable; accessing path to determine a merge strategy likely indicates an anti-pattern.
function makeProxy(path) {
  return new Proxy(path, {
    get(target, property) {
      if (property === 'path') {
        return target
      } else {
        return target.node[property]
      }
    },
    set(target, property, value) {
      if (property === 'path') {
        throw new Error("You can't set a path on a proxy!")
      } else {
        target.node[property] = value
        return true
      }
    },
    has(target, property) {
      return property in target.node
    },
  })
}

function mergeAST(baseAST, extAST, strategy = {}) {
  const identifier =
    extractProperty('identifier', strategy) || semanticIdentifier
  const identities = {}

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

  const baseVisitor = { ...stripTrailingCommentsStrategy() }
  const extVisitor = { ...stripTrailingCommentsStrategy() }

  forEachFunctionOn(strategy, (typename, _func) => {
    extVisitor[typename] = {
      enter(path) {
        const id = identifier.getId(path)
        id && (identities[id] ||= []).push(path)
      },
    }
    baseVisitor[typename] = {
      enter(path) {
        if (isOpaque(strategy[path.type])) {
          skipChildren(path)
        }
      },
      exit(path) {
        saveNextInsertPosition(path)
        const id = identifier.getId(path)
        if (id && id in identities) {
          // Like Array.reduce with reference semantics for the accumulator, which is `path` here.
          // Goal is (((path <=> a) <=> b) <=> c), where  <=> is the merge strategy, and we're
          // merging extensions [a, b, c].
          const proxyPath = makeProxy(path)
          identities[id].forEach((ext) =>
            strategy[typename](proxyPath, makeProxy(ext))
          )
          deletePropertyIf(identities, ([k, _]) => identifier.isAncestor(id, k))
        }
      },
    }
  })

  traverse(extAST, extVisitor)
  traverse(baseAST, baseVisitor)

  const handled = []
  for (const [k, v] of Object.entries(identities)) {
    if (handled.some((h) => identifier.isAncestor(h, k))) {
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

  // When testing, use prettier here to produce predictable outputs.
  // Otherwise, leave formatting to the caller.
  return process.env.JEST_WORKER_ID
    ? prettier.format(code, {
        parser: 'babel',
        bracketSpacing: true,
        tabWidth: 2,
        semi: false,
        singleQuote: true,
      })
    : code
}
