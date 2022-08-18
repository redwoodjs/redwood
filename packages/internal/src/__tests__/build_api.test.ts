import fs from 'fs'
import path from 'path'

import * as babel from '@babel/core'
import compat from 'core-js-compat'

import { cleanApiBuild, prebuildApiFiles } from '../build/api'
import {
  getApiSideBabelConfigPath,
  getApiSideBabelPlugins,
  getApiSideDefaultBabelConfig,
  NODE_TARGET,
} from '../build/babel/api'
import { CORE_JS_VERSION } from '../build/babel/common'
import { findApiFiles } from '../files'
import { ensurePosixPath, getPaths } from '../paths'

const FIXTURE_PATH = path.resolve(
  __dirname,
  '../../../../__fixtures__/example-todo-main'
)

const cleanPaths = (p) => {
  return ensurePosixPath(path.relative(FIXTURE_PATH, p))
}

// Fixtures, filled in beforeAll
let prebuiltFiles
let relativePaths

beforeAll(() => {
  process.env.RWJS_CWD = FIXTURE_PATH
  cleanApiBuild()

  const apiFiles = findApiFiles()
  prebuiltFiles = prebuildApiFiles(apiFiles)

  relativePaths = prebuiltFiles
    .filter((x) => typeof x !== 'undefined')
    .map(cleanPaths)
})
afterAll(() => {
  delete process.env.RWJS_CWD
})

test('api files are prebuilt', () => {
  // Builds non-nested functions
  expect(relativePaths).toContain(
    '.redwood/prebuild/api/src/functions/graphql.js'
  )

  // Builds graphql folder
  expect(relativePaths).toContain(
    '.redwood/prebuild/api/src/graphql/todos.sdl.js'
  )

  // Builds nested function
  expect(relativePaths).toContain(
    '.redwood/prebuild/api/src/functions/nested/nested.js'
  )
})

test('api prebuild finds babel.config.js', () => {
  let p = getApiSideBabelConfigPath()
  p = cleanPaths(p)
  expect(p).toEqual('api/babel.config.js')
})

test('api prebuild uses babel config only from the api side root', () => {
  const p = prebuiltFiles.filter((p) => p.endsWith('dog.js')).pop()
  const code = fs.readFileSync(p, 'utf-8')
  expect(code).toContain(`import dog from "dog-bless";`)

  // Should ignore root babel config
  expect(code).not.toContain(`import kitty from "kitty-purr"`)
})

// Still a bit of a mystery why this plugin isn't transforming gql tags
test.skip('api prebuild transforms gql with `babel-plugin-graphql-tag`', () => {
  // babel-plugin-graphql-tag should transpile the "gql" parts of our files,
  // achieving the following:
  // 1. removing the `graphql-tag` import
  // 2. convert the gql syntax into graphql's ast.
  //
  // https://www.npmjs.com/package/babel-plugin-graphql-tag
  const builtFiles = prebuildApiFiles(findApiFiles())
  const p = builtFiles
    .filter((x) => typeof x !== 'undefined')
    .filter((p) => p.endsWith('todos.sdl.js'))
    .pop()

  const code = fs.readFileSync(p, 'utf-8')
  expect(code.includes('import gql from "graphql-tag";')).toEqual(false)
  expect(code.includes('gql`')).toEqual(false)
})

describe('api prebuild polyfills unsupported functionality', () => {
  let code

  beforeAll(() => {
    const p = prebuiltFiles.filter((p) => p.endsWith('polyfill.js')).pop()
    code = fs.readFileSync(p, 'utf-8')
  })

  describe('ES features', () => {
    describe('Node.js 15', () => {
      it('polyfills AggregateError', () => {
        expect(code).toContain(
          `import _AggregateError from "core-js-pure/stable/aggregate-error.js"`
        )
      })

      // The reason we're testing it this way is that core-js polyfills the entire Promise built in.
      //
      // So this...
      //
      // ```js
      // Promise.any([
      //   Promise.resolve(1),
      //   Promise.reject(2),
      //   Promise.resolve(3),
      // ]).then(console.log)
      // ```js
      //
      // becomes this...
      //
      // ```js
      // import _Promise from "@babel/runtime-corejs3/core-js/promise";
      //
      // _Promise.any([
      //   _Promise.resolve(1),
      //   _Promise.reject(2),
      //   _Promise.resolve(3)])
      // .then(console.log);
      // ```
      it('polyfills Promise.any', () => {
        expect(code).toContain(
          `import _Promise from "core-js-pure/stable/promise/index.js"`
        )
        const _Promise = require('core-js-pure/stable/promise/index.js')
        expect(_Promise).toHaveProperty('any')
      })

      it('polyfills String.replaceAll', () => {
        expect(code).toContain(
          `import _replaceAllInstanceProperty from "core-js-pure/stable/instance/replace-all.js"`
        )
      })
    })

    describe('Node.js 16', () => {
      it('polyfills Object.hasOwn', () => {
        expect(code).toContain(
          `import _Object$hasOwn from "core-js-pure/stable/object/has-own.js"`
        )
      })
    })

    describe('Node.js 17', () => {
      // core-js-pure overrides this. See https://github.com/zloirock/core-js/blob/master/packages/core-js-pure/override/modules/es.typed-array.set.js.
      it('polyfills Base64 utility methods (btoa)', () => {
        expect(code).toContain(
          `import _btoa from "core-js-pure/stable/btoa.js"`
        )
      })

      it('polyfills DOMException', () => {
        expect(code).toContain(
          `import _DOMException from "core-js-pure/stable/dom-exception.js"`
        )
      })

      it('polyfills structuredClone', () => {
        expect(code).toContain(
          `import _structuredClone from "core-js-pure/stable/structured-clone.js"`
        )
      })
    })

    describe('Node.js 18', () => {
      it('polyfills Array.prototype.findLast, Array.prototype.findLastIndex', () => {
        expect(code).toContain(
          `import _findLastInstanceProperty from "core-js-pure/stable/instance/find-last.js"`
        )
        expect(code).toContain(
          `import _findLastIndexInstanceProperty from "core-js-pure/stable/instance/find-last-index.js"`
        )
      })

      it('polyfills Base64 utility methods (atob)', () => {
        expect(code).toContain(
          `import _atob from "core-js-pure/stable/atob.js"`
        )
      })
    })
  })
})

test('jest mock statements also handle', () => {
  const pathToTest = path.join(getPaths().api.services, 'todos/todos.test.js')

  const code = fs.readFileSync(pathToTest, 'utf-8')

  const defaultOptions = getApiSideDefaultBabelConfig()

  // Step 1: prebuild service/todos.test.js
  const outputForJest = babel.transform(code, {
    ...defaultOptions,
    filename: pathToTest,
    cwd: getPaths().api.base,
    // We override the plugins, to match packages/testing/config/jest/api/index.js
    plugins: getApiSideBabelPlugins({ forJest: true }),
  }).code

  // Step 2: check that output has correct import statement path
  expect(outputForJest).toContain('import dog from "../../lib/dog"')
  // Step 3: check that output has correct jest.mock path
  expect(outputForJest).toContain('jest.mock("../../lib/dog"')
})

test('core-js polyfill list', () => {
  const { list } = compat({
    targets: { node: NODE_TARGET },
    version: CORE_JS_VERSION,
  })

  expect(list).toMatchInlineSnapshot(`
    Array [
      "es.error.cause",
      "es.aggregate-error",
      "es.aggregate-error.cause",
      "es.array.at",
      "es.array.find-last",
      "es.array.find-last-index",
      "es.array.push",
      "es.object.has-own",
      "es.promise.any",
      "es.reflect.to-string-tag",
      "es.regexp.flags",
      "es.string.at-alternative",
      "es.string.replace-all",
      "es.typed-array.at",
      "es.typed-array.find-last",
      "es.typed-array.find-last-index",
      "es.typed-array.set",
      "esnext.array.from-async",
      "esnext.array.filter-out",
      "esnext.array.filter-reject",
      "esnext.array.group",
      "esnext.array.group-by",
      "esnext.array.group-by-to-map",
      "esnext.array.group-to-map",
      "esnext.array.is-template-object",
      "esnext.array.last-index",
      "esnext.array.last-item",
      "esnext.array.to-reversed",
      "esnext.array.to-sorted",
      "esnext.array.to-spliced",
      "esnext.array.unique-by",
      "esnext.array.with",
      "esnext.async-iterator.constructor",
      "esnext.async-iterator.as-indexed-pairs",
      "esnext.async-iterator.drop",
      "esnext.async-iterator.every",
      "esnext.async-iterator.filter",
      "esnext.async-iterator.find",
      "esnext.async-iterator.flat-map",
      "esnext.async-iterator.for-each",
      "esnext.async-iterator.from",
      "esnext.async-iterator.indexed",
      "esnext.async-iterator.map",
      "esnext.async-iterator.reduce",
      "esnext.async-iterator.some",
      "esnext.async-iterator.take",
      "esnext.async-iterator.to-array",
      "esnext.bigint.range",
      "esnext.composite-key",
      "esnext.composite-symbol",
      "esnext.function.is-callable",
      "esnext.function.is-constructor",
      "esnext.function.un-this",
      "esnext.iterator.constructor",
      "esnext.iterator.as-indexed-pairs",
      "esnext.iterator.drop",
      "esnext.iterator.every",
      "esnext.iterator.filter",
      "esnext.iterator.find",
      "esnext.iterator.flat-map",
      "esnext.iterator.for-each",
      "esnext.iterator.from",
      "esnext.iterator.indexed",
      "esnext.iterator.map",
      "esnext.iterator.reduce",
      "esnext.iterator.some",
      "esnext.iterator.take",
      "esnext.iterator.to-array",
      "esnext.iterator.to-async",
      "esnext.map.delete-all",
      "esnext.map.emplace",
      "esnext.map.every",
      "esnext.map.filter",
      "esnext.map.find",
      "esnext.map.find-key",
      "esnext.map.from",
      "esnext.map.group-by",
      "esnext.map.includes",
      "esnext.map.key-by",
      "esnext.map.key-of",
      "esnext.map.map-keys",
      "esnext.map.map-values",
      "esnext.map.merge",
      "esnext.map.of",
      "esnext.map.reduce",
      "esnext.map.some",
      "esnext.map.update",
      "esnext.map.update-or-insert",
      "esnext.map.upsert",
      "esnext.math.clamp",
      "esnext.math.deg-per-rad",
      "esnext.math.degrees",
      "esnext.math.fscale",
      "esnext.math.iaddh",
      "esnext.math.imulh",
      "esnext.math.isubh",
      "esnext.math.rad-per-deg",
      "esnext.math.radians",
      "esnext.math.scale",
      "esnext.math.seeded-prng",
      "esnext.math.signbit",
      "esnext.math.umulh",
      "esnext.number.from-string",
      "esnext.number.range",
      "esnext.object.iterate-entries",
      "esnext.object.iterate-keys",
      "esnext.object.iterate-values",
      "esnext.observable",
      "esnext.promise.try",
      "esnext.reflect.define-metadata",
      "esnext.reflect.delete-metadata",
      "esnext.reflect.get-metadata",
      "esnext.reflect.get-metadata-keys",
      "esnext.reflect.get-own-metadata",
      "esnext.reflect.get-own-metadata-keys",
      "esnext.reflect.has-metadata",
      "esnext.reflect.has-own-metadata",
      "esnext.reflect.metadata",
      "esnext.set.add-all",
      "esnext.set.delete-all",
      "esnext.set.difference",
      "esnext.set.every",
      "esnext.set.filter",
      "esnext.set.find",
      "esnext.set.from",
      "esnext.set.intersection",
      "esnext.set.is-disjoint-from",
      "esnext.set.is-subset-of",
      "esnext.set.is-superset-of",
      "esnext.set.join",
      "esnext.set.map",
      "esnext.set.of",
      "esnext.set.reduce",
      "esnext.set.some",
      "esnext.set.symmetric-difference",
      "esnext.set.union",
      "esnext.string.at",
      "esnext.string.cooked",
      "esnext.string.code-points",
      "esnext.symbol.async-dispose",
      "esnext.symbol.dispose",
      "esnext.symbol.matcher",
      "esnext.symbol.metadata",
      "esnext.symbol.metadata-key",
      "esnext.symbol.observable",
      "esnext.symbol.pattern-match",
      "esnext.symbol.replace-all",
      "esnext.typed-array.from-async",
      "esnext.typed-array.filter-out",
      "esnext.typed-array.filter-reject",
      "esnext.typed-array.group-by",
      "esnext.typed-array.to-reversed",
      "esnext.typed-array.to-sorted",
      "esnext.typed-array.to-spliced",
      "esnext.typed-array.unique-by",
      "esnext.typed-array.with",
      "esnext.weak-map.delete-all",
      "esnext.weak-map.from",
      "esnext.weak-map.of",
      "esnext.weak-map.emplace",
      "esnext.weak-map.upsert",
      "esnext.weak-set.add-all",
      "esnext.weak-set.delete-all",
      "esnext.weak-set.from",
      "esnext.weak-set.of",
      "web.atob",
      "web.btoa",
      "web.dom-exception.constructor",
      "web.dom-exception.stack",
      "web.dom-exception.to-string-tag",
      "web.structured-clone",
    ]
  `)
})
