import path from 'path'
import util from 'util'

import { parse, traverse } from '@babel/core'
import generate from '@babel/generator'
import * as t from '@babel/types'
import fs from 'fs-extra'

import { getPaths } from '.'

const logdeep = (thing) => console.log(util.inspect(thing), { depth: 100 })

const pushUnique = (eq, arr, ...items) => {
  itemloop: for (const i of items) {
    for (const j of arr) {
      if (eq(i, j)) {
        continue itemloop
      }
    }
    arr.push(i)
  }
}

// TODO: do we want typescript in here? This is a hacky enum.
const MERGE_STRATEGY = {
  MERGE: 1,
  SKIP: 2,
  KEEP_BOTH: 3,
}

const stringifySpecifier = (specifier, source) => {
  if (t.isImportNamespaceSpecifier(specifier)) {
    return `* as ${specifier.local.name} from '${source}'`
  } else if (t.isImportSpecifier(specifier)) {
    return `{${specifier} from '${source}'}`
  } else if (t.isImportDefaultSpecifier(specifier)) {
    return `${specifier} from ${source}`
  }
}

const stringifyStrategyPastTense = (strategy) => {
  switch (strategy) {
    case MERGE_STRATEGY.MERGE:
      return 'Merged'
    case MERGE_STRATEGY.SKIP:
      return 'Skipped'
    case MERGE_STRATEGY.KEEP_BOTH:
      return 'Kept both'
  }
}

const ruleViolationMessage = (lhs, rhs, source, problem, strategy) => {
  const lhsStr = stringifySpecifier(lhs, source)
  const rhsStr = stringifySpecifier(rhs, source)
  const strategyStr = stringifyStrategyPastTense(strategy)
  return `WARNING: Storybook configuration merge would produce ${problem}: "${lhsStr}" and "${rhsStr}". ${strategyStr}.`
}

const importSpecifierRules = [
  {
    // It is illegal in Javascript to have "import {A}, * as B from 'source'"
    problem: 'a name collision',
    strategy: MERGE_STRATEGY.SKIP,
    predicate: (lhs, rhs) =>
      (t.isImportNamespaceSpecifier(lhs) && t.isImportSpecifier(rhs)) ||
      (t.isImportSpecifier(lhs) && t.isImportNamespaceSpecifier(rhs)),
  },
  {
    // It is illegal in Javascript to have "import {A}, * as B from 'source'"
    problem: 'an illegal import',
    strategy: MERGE_STRATEGY.SKIP,
    predicate: (lhs, rhs) =>
      (t.isImportNamespaceSpecifier(lhs) && t.isImportSpecifier(rhs)) ||
      (t.isImportSpecifier(lhs) && t.isImportNamespaceSpecifier(rhs)),
  },
  {
    // It is illegal in Javascript to have "import * as Foo, * as Bar from 'source'"
    problem: 'a redundant namespace import',
    strategy: MERGE_STRATEGY.KEEP_BOTH,
    predicate: (lhs, rhs) =>
      t.isImportNamespaceSpecifier(lhs) &&
      t.isImportNamespaceSpecifier(rhs) &&
      lhs.local.name !== rhs.local.name,
  },
]

const validateSpecifierMerge = (baseSpecifiers, extSpecifiers, source) => {
  for (const base of baseSpecifiers) {
    for (const ext of extSpecifiers) {
      for (const { predicate, strategy, problem } of importSpecifierRules) {
        if (predicate(base, ext)) {
          return {
            strategy,
            error: ruleViolationMessage(base, ext, source, problem, strategy),
          }
        }
      }
    }
  }
  return {
    strategy: MERGE_STRATEGY.MERGE,
    error: undefined,
  }
}

function mergeImports(baseAST, extAST) {
  const importSpecifierEquality = (lhs, rhs) =>
    lhs.type === rhs.type &&
    lhs.imported?.name === rhs.imported?.name &&
    lhs.local?.name == rhs.local?.name

  // Cache all of the imports in the extension AST. If we see an import with the same source
  // in the base AST, attempt to merge the specifiers into a single import, iff it would produce
  // a legal javascript expression. If we don't see an import with the same source in the base AST,
  // then we essentially copy-paste the extension import when exiting the Program node.
  const extImports = {}
  let lastBaseImport = undefined

  traverse(extAST, {
    ImportDeclaration(path) {
      extImports[path.node.source.value] = path.node
    },
  })

  traverse(baseAST, {
    ImportDeclaration(path) {
      lastBaseImport = path
      const key = path.node.source.value
      if (key in extImports) {
        const { strategy, error } = validateSpecifierMerge(
          path.node.specifiers,
          extImports[key].specifiers,
          key
        )

        switch (strategy) {
          case MERGE_STRATEGY.MERGE:
            pushUnique(
              importSpecifierEquality,
              path.node.specifiers,
              ...extImports[key].specifiers
            ) // intentional fallthrough
          case MERGE_STRATEGY.SKIP:
            delete extImports[key] // intentional fallthrough
          case MERGE_STRATEGY.KEEP_BOTH:
            error && console.log(error)
        }
      }
    },
    Program: {
      exit(path) {
        Object.values(extImports).forEach((node) => {
          if (lastBaseImport) {
            lastBaseImport.insertAfter(node)
          } else {
            path.unshiftContainer('body', node)
          }
        })
        path.stop()
      },
    },
  })
}

export default async function createOrExtendStorybookConfiguration(
  newSBConfigPath = undefined
) {
  const storybookPreviewConfigPath = getPaths().web.storybookPreviewConfig
  if (!fs.existsSync(storybookPreviewConfigPath)) {
    await util.promisify(fs.cp)(
      path.join(__dirname, 'templates', 'storybook.preview.js.template'),
      storybookPreviewConfigPath
    )
  }

  if (newSBConfigPath) {
    const getAST = (filePath) => {
      const file = fs.readFileSync(filePath, { encoding: 'utf-8' })
      return { file, ast: parse(file, { presets: ['@babel/preset-react'] }) }
    }

    const { file: baseFile, ast: baseAST } = getAST(storybookPreviewConfigPath)
    const { file: extFile, ast: extAST } = getAST(newSBConfigPath)
    console.log('BaseFile', storybookPreviewConfigPath)
    console.log('ExtFile', newSBConfigPath)

    mergeImports(baseAST, extAST)

    const { code } = generate({
      type: 'Program',
      body: baseAST.program.body,
    })

    console.log(code)
  }
}
