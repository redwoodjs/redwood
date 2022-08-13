import fs from 'fs'
import path from 'path'

import * as babel from '@babel/core'
import compat from 'core-js-compat'

import { cleanApiBuild, prebuildApiFiles } from '../build/api'
import {
  getApiSideBabelConfigPath,
  getApiSideBabelPlugins,
  getApiSideDefaultBabelConfig,
  TARGETS_NODE,
} from '../build/babel/api'
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

test('Pretranspile polyfills unsupported functionality', () => {
  const p = prebuiltFiles.filter((p) => p.endsWith('polyfill.js')).pop()

  const code = fs.readFileSync(p, 'utf-8')

  expect(code).toContain(
    `import _Math$hypot from "@babel/runtime-corejs3/core-js/math/hypot";`
  )

  expect(code).toContain(
    `import _AggregateError from "@babel/runtime-corejs3/core-js/aggregate-error";`
  )

  expect(code).toContain(
    `import _compositeKey from "@babel/runtime-corejs3/core-js/composite-key";`
  )
  expect(code).toContain(
    `import _compositeSymbol from "@babel/runtime-corejs3/core-js/composite-symbol";`
  )

  expect(code).toContain(
    `import _Map from "@babel/runtime-corejs3/core-js/map";`
  )
  const _Map = require('@babel/runtime-corejs3/core-js/map')
  expect(_Map).toHaveProperty('deleteAll')
  expect(_Map).toHaveProperty('every')
  expect(_Map).toHaveProperty('filter')
  expect(_Map).toHaveProperty('find')
  expect(_Map).toHaveProperty('findKey')
  expect(_Map).toHaveProperty('from')
  expect(_Map).toHaveProperty('groupBy')
  expect(_Map).toHaveProperty('includes')
  expect(_Map).toHaveProperty('keyBy')
  expect(_Map).toHaveProperty('keyOf')
  expect(_Map).toHaveProperty('mapKeys')
  expect(_Map).toHaveProperty('mapValues')
  expect(_Map).toHaveProperty('merge')
  expect(_Map).toHaveProperty('of')
  expect(_Map).toHaveProperty('reduce')
  expect(_Map).toHaveProperty('some')
  expect(_Map).toHaveProperty('update')

  expect(code).toContain(
    `import _Math$clamp from "@babel/runtime-corejs3/core-js/math/clamp";`
  )
  expect(code).toContain(
    `import _Math$DEG_PER_RAD from "@babel/runtime-corejs3/core-js/math/deg-per-rad";`
  )
  expect(code).toContain(
    `import _Math$degrees from "@babel/runtime-corejs3/core-js/math/degrees";`
  )
  expect(code).toContain(
    `import _Math$fscale from "@babel/runtime-corejs3/core-js/math/fscale";`
  )
  expect(code).toContain(
    `import _Math$RAD_PER_DEG from "@babel/runtime-corejs3/core-js/math/rad-per-deg";`
  )
  expect(code).toContain(
    `import _Math$radians from "@babel/runtime-corejs3/core-js/math/radians";`
  )
  expect(code).toContain(
    `import _Math$scale from "@babel/runtime-corejs3/core-js/math/scale";`
  )
  expect(code).toContain(
    `import _Math$seededPRNG from "@babel/runtime-corejs3/core-js/math/seeded-prng";`
  )
  expect(code).toContain(
    `import _Math$signbit from "@babel/runtime-corejs3/core-js/math/signbit";`
  )
  expect(code).toContain(
    `import _Math$iaddh from "@babel/runtime-corejs3/core-js/math/iaddh";`
  )
  expect(code).toContain(
    `import _Math$imulh from "@babel/runtime-corejs3/core-js/math/imulh";`
  )
  expect(code).toContain(
    `import _Math$isubh from "@babel/runtime-corejs3/core-js/math/isubh";`
  )
  expect(code).toContain(
    `import _Math$umulh from "@babel/runtime-corejs3/core-js/math/umulh";`
  )

  expect(code).toContain(
    `import _Number$fromString from "@babel/runtime-corejs3/core-js/number/from-string";`
  )

  expect(code).toContain(
    `import _Observable from "@babel/runtime-corejs3/core-js/observable";`
  )
  expect(code).toContain(
    `import _Symbol$observable from "@babel/runtime-corejs3/core-js/symbol/observable";`
  )

  expect(code).toContain(
    `import _Promise from "@babel/runtime-corejs3/core-js/promise";`
  )
  const _Promise = require('@babel/runtime-corejs3/core-js/promise')
  expect(_Promise).toHaveProperty('any')
  expect(_Promise).toHaveProperty('try')

  expect(code).toContain(
    `import _Reflect$defineMetadata from "@babel/runtime-corejs3/core-js/reflect/define-metadata";`
  )
  expect(code).toContain(
    `import _Reflect$ownKeys from "@babel/runtime-corejs3/core-js/reflect/own-keys";`
  )
  expect(code).toContain(
    `import _Reflect$getOwnMetadataKeys from "@babel/runtime-corejs3/core-js/reflect/get-own-metadata-keys";`
  )
  expect(code).toContain(
    `import _Reflect$getOwnMetadata from "@babel/runtime-corejs3/core-js/reflect/get-own-metadata";`
  )

  expect(code).toContain(
    `import _Set from "@babel/runtime-corejs3/core-js/set";`
  )
  const _Set = require('@babel/runtime-corejs3/core-js/set')
  expect(_Set).toHaveProperty('addAll')
  expect(_Set).toHaveProperty('deleteAll')
  expect(_Set).toHaveProperty('difference')
  expect(_Set).toHaveProperty('every')
  expect(_Set).toHaveProperty('filter')
  expect(_Set).toHaveProperty('find')
  expect(_Set).toHaveProperty('from')
  expect(_Set).toHaveProperty('intersection')
  expect(_Set).toHaveProperty('isDisjointFrom')
  expect(_Set).toHaveProperty('isSubsetOf')
  expect(_Set).toHaveProperty('isSupersetOf')
  expect(_Set).toHaveProperty('join')
  expect(_Set).toHaveProperty('map')
  expect(_Set).toHaveProperty('of')
  expect(_Set).toHaveProperty('reduce')
  expect(_Set).toHaveProperty('some')
  expect(_Set).toHaveProperty('symmetricDifference')
  expect(_Set).toHaveProperty('union')

  expect(code).toContain(
    `import _codePointsInstanceProperty from "@babel/runtime-corejs3/core-js/instance/code-points";`
  )
  expect(code).toContain(
    `import _matchAllInstanceProperty from "@babel/runtime-corejs3/core-js/instance/match-all";`
  )
  expect(code).toContain(
    `import _replaceAllInstanceProperty from "@babel/runtime-corejs3/core-js/instance/replace-all";`
  )
  expect(code).toContain(
    `import _atInstanceProperty from "@babel/runtime-corejs3/core-js/instance/at";`
  )
  expect(code).toContain(
    `import _Symbol$patternMatch from "@babel/runtime-corejs3/core-js/symbol/pattern-match";`
  )
  expect(code).toContain(
    `import _Symbol$dispose from "@babel/runtime-corejs3/core-js/symbol/dispose";`
  )

  expect(code).toContain(
    `import _WeakMap from "@babel/runtime-corejs3/core-js/weak-map";`
  )
  const _WeakMap = require('@babel/runtime-corejs3/core-js/weak-map')
  expect(_WeakMap).toHaveProperty('deleteAll')
  expect(_WeakMap).toHaveProperty('from')
  expect(_WeakMap).toHaveProperty('of')

  expect(code).toContain(
    `import _WeakSet from "@babel/runtime-corejs3/core-js/weak-set";`
  )
  const _WeakSet = require('@babel/runtime-corejs3/core-js/weak-set')
  expect(_WeakSet).toHaveProperty('addAll')
  expect(_WeakSet).toHaveProperty('deleteAll')
  expect(_WeakSet).toHaveProperty('from')
  expect(_WeakSet).toHaveProperty('of')

  // Expect these to remain unchanged.
  expect(code).toContain(
    [
      `const buffer = new ArrayBuffer(8);`,
      `const uint8 = new Uint8Array(buffer);`,
      `uint8.set([1, 2, 3], 3);`,
    ].join('\n')
  )

  expect(code).toContain(
    [
      `[1, 2, 3].lastItem // => 3`,
      `[(1, 2, 3)].lastIndex; // => 2`,
      '',
      `const array = [1, 2, 3];`,
      `array.lastItem = 4;`,
      `new Array(1, 2, 3).lastItem;`,
      `new Array(1, 2, 3).lastIndex;`,
    ].join('\n')
  )
})

test('Pretranspile uses corejs3 aliasing', () => {
  // See https://babeljs.io/docs/en/babel-plugin-transform-runtime#core-js-aliasing
  // This is because we configure the transform runtime plugin corejs

  const p = prebuiltFiles.filter((p) => p.endsWith('transform.js')).pop()
  const code = fs.readFileSync(p, 'utf-8')

  // Polyfill for Symbol
  expect(code).toContain(
    `import _Symbol from "@babel/runtime-corejs3/core-js/symbol"`
  )

  // Polyfill for Promise
  expect(code).toContain(
    `import _Promise from "@babel/runtime-corejs3/core-js/promise"`
  )

  // Polyfill for .includes
  expect(code).toContain(
    'import _includesInstanceProperty from "@babel/runtime-corejs3/core-js/instance/includes"'
  )

  // Polyfill for .iterator
  expect(code).toContain(
    `import _getIterator from "@babel/runtime-corejs3/core-js/get-iterator"`
  )
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
    targets: { node: TARGETS_NODE },
    version: 3,
  })

  expect(list).toMatchInlineSnapshot(`
    Array [
      "es.math.hypot",
      "es.typed-array.set",
      "esnext.aggregate-error",
      "esnext.array.last-index",
      "esnext.array.last-item",
      "esnext.composite-key",
      "esnext.composite-symbol",
      "esnext.map.delete-all",
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
      "esnext.observable",
      "esnext.promise.any",
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
      "esnext.string.code-points",
      "esnext.string.match-all",
      "esnext.string.replace-all",
      "esnext.symbol.dispose",
      "esnext.symbol.observable",
      "esnext.symbol.pattern-match",
      "esnext.weak-map.delete-all",
      "esnext.weak-map.from",
      "esnext.weak-map.of",
      "esnext.weak-set.add-all",
      "esnext.weak-set.delete-all",
      "esnext.weak-set.from",
      "esnext.weak-set.of",
    ]
  `)
})
