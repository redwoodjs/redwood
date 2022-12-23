import fs from 'fs'
import path from 'path'

import * as babel from '@babel/core'
import compat from 'core-js-compat'

import { cleanApiBuild, prebuildApiFiles } from '../build/api'
import {
  getApiSideBabelConfigPath,
  getApiSideBabelPlugins,
  getApiSideDefaultBabelConfig,
  BABEL_PLUGIN_TRANSFORM_RUNTIME_OPTIONS,
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

describe('api prebuild polyfills unsupported functionality', () => {
  let code

  beforeAll(() => {
    const p = prebuiltFiles.filter((p) => p.endsWith('polyfill.js')).pop()
    code = fs.readFileSync(p, 'utf-8')
  })

  describe('ES features', () => {
    describe('Node.js 13', () => {
      it('polyfills Math.hypot', () => {
        expect(code).toContain(
          `import _Math$hypot from "@babel/runtime-corejs3/core-js/math/hypot"`
        )
      })
    })

    describe('Node.js 14', () => {
      it('polyfills String.matchAll', () => {
        expect(code).toContain(
          `import _matchAllInstanceProperty from "@babel/runtime-corejs3/core-js/instance/match-all"`
        )
      })
    })

    describe('Node.js 15', () => {
      it('polyfills AggregateError', () => {
        expect(code).toContain(
          `import _AggregateError from "@babel/runtime-corejs3/core-js/aggregate-error"`
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
      //
      // ↓↓↓
      //
      // import _Promise from "@babel/runtime-corejs3/core-js/promise";
      //
      // _Promise.any([
      //   _Promise.resolve(1),
      //   _Promise.reject(2),
      //   _Promise.resolve(3)])
      // .then(console.log);
      // ```
      //
      // Compared to the Reflect polyfills, which only polyfill the method used,
      // just checking that the Promise polyfill is imported isn't enough:
      //
      // ```js
      // Reflect.defineMetadata(metadataKey, metadataValue, target)
      //
      // ↓↓↓
      //
      // import _Reflect$defineMetadata from "@babel/runtime-corejs3/core-js/reflect/define-metadata";

      // _Reflect$defineMetadata(metadataKey, metadataValue, target);
      // ```
      it('polyfills Promise.any', () => {
        expect(code).toContain(
          `import _Promise from "@babel/runtime-corejs3/core-js/promise"`
        )
        const _Promise = require('@babel/runtime-corejs3/core-js/promise')
        expect(_Promise).toHaveProperty('any')
      })

      it('polyfills String.replaceAll', () => {
        expect(code).toContain(
          `import _replaceAllInstanceProperty from "@babel/runtime-corejs3/core-js/instance/replace-all"`
        )
      })
    })

    describe('Node.js 17', () => {
      // core-js-pure overrides this. See https://github.com/zloirock/core-js/blob/master/packages/core-js-pure/override/modules/es.typed-array.set.js.
      it("doesn't polyfill TypedArray.set", () => {
        expect(code).toContain(
          [
            `const buffer = new ArrayBuffer(8);`,
            `const uint8 = new Uint8Array(buffer);`,
            `uint8.set([1, 2, 3], 3);`,
          ].join('\n')
        )
      })
    })
  })

  describe('ES Next features', () => {
    describe('Pre-stage 0 proposals', () => {
      // Reflect metadata
      // See https://github.com/zloirock/core-js#reflect-metadata
      it('polyfills Reflect methods', () => {
        expect(code).toContain(
          `import _Reflect$defineMetadata from "@babel/runtime-corejs3/core-js/reflect/define-metadata"`
        )
        expect(code).toContain(
          `import _Reflect$deleteMetadata from "@babel/runtime-corejs3/core-js/reflect/delete-metadata"`
        )
        expect(code).toContain(
          `import _Reflect$getMetadata from "@babel/runtime-corejs3/core-js/reflect/get-metadata"`
        )
        expect(code).toContain(
          `import _Reflect$getMetadataKeys from "@babel/runtime-corejs3/core-js/reflect/get-metadata-keys"`
        )
        expect(code).toContain(
          `import _Reflect$getOwnMetadata from "@babel/runtime-corejs3/core-js/reflect/get-own-metadata"`
        )
        expect(code).toContain(
          `import _Reflect$getOwnMetadataKeys from "@babel/runtime-corejs3/core-js/reflect/get-own-metadata-keys"`
        )
        expect(code).toContain(
          `import _Reflect$hasMetadata from "@babel/runtime-corejs3/core-js/reflect/has-metadata"`
        )
        expect(code).toContain(
          `import _Reflect$hasOwnMetadata from "@babel/runtime-corejs3/core-js/reflect/has-own-metadata"`
        )
        expect(code).toContain(
          `import _Reflect$metadata from "@babel/runtime-corejs3/core-js/reflect/metadata"`
        )
      })
    })

    describe('Stage 1 proposals', () => {
      // Getting last item from Array
      // See https://github.com/zloirock/core-js#getting-last-item-from-array
      //
      // core-js-pure overrides these. See...
      // - https://github.com/zloirock/core-js/blob/master/packages/core-js-pure/override/modules/esnext.array.last-index.js,
      // - https://github.com/zloirock/core-js/blob/master/packages/core-js-pure/override/modules/esnext.array.last-item.js
      it("doesn't polyfill Getting last item from Array", () => {
        expect(code).toContain(
          [
            `[1, 2, 3].lastIndex;`,
            `[1, 2, 3].lastItem;`,
            `const array = [1, 2, 3];`,
            `array.lastItem = 4;`,
            `new Array(1, 2, 3).lastIndex;`,
            `new Array(1, 2, 3).lastItem;`,
          ].join('\n')
        )
      })

      // compositeKey and compositeSymbol
      // See https://github.com/zloirock/core-js#compositekey-and-compositesymbol
      it('polyfills compositeKey and compositeSymbol', () => {
        expect(code).toContain(
          `import _compositeKey from "@babel/runtime-corejs3/core-js/composite-key"`
        )
        expect(code).toContain(
          `import _compositeSymbol from "@babel/runtime-corejs3/core-js/composite-symbol"`
        )
      })

      // New collections methods
      // See https://github.com/zloirock/core-js#new-collections-methods
      it('polyfills New collections methods', () => {
        expect(code).toContain(
          `import _Map from "@babel/runtime-corejs3/core-js/map"`
        )
        // See the comments on Promise.any above for more of an explanation
        // of why we're testing for properties.
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
          `import _Set from "@babel/runtime-corejs3/core-js/set"`
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
          `import _WeakMap from "@babel/runtime-corejs3/core-js/weak-map"`
        )
        const _WeakMap = require('@babel/runtime-corejs3/core-js/weak-map')
        expect(_WeakMap).toHaveProperty('deleteAll')
        expect(_WeakMap).toHaveProperty('from')
        expect(_WeakMap).toHaveProperty('of')

        expect(code).toContain(
          `import _WeakSet from "@babel/runtime-corejs3/core-js/weak-set"`
        )
        const _WeakSet = require('@babel/runtime-corejs3/core-js/weak-set')
        expect(_WeakSet).toHaveProperty('addAll')
        expect(_WeakSet).toHaveProperty('deleteAll')
        expect(_WeakSet).toHaveProperty('from')
        expect(_WeakSet).toHaveProperty('of')
      })

      // Math extensions
      // See https://github.com/zloirock/core-js#math-extensions
      it('polyfills Math extensions', () => {
        expect(code).toContain(
          `import _Math$clamp from "@babel/runtime-corejs3/core-js/math/clamp"`
        )
        expect(code).toContain(
          `import _Math$DEG_PER_RAD from "@babel/runtime-corejs3/core-js/math/deg-per-rad"`
        )
        expect(code).toContain(
          `import _Math$degrees from "@babel/runtime-corejs3/core-js/math/degrees"`
        )
        expect(code).toContain(
          `import _Math$fscale from "@babel/runtime-corejs3/core-js/math/fscale"`
        )
        expect(code).toContain(
          `import _Math$RAD_PER_DEG from "@babel/runtime-corejs3/core-js/math/rad-per-deg"`
        )
        expect(code).toContain(
          `import _Math$radians from "@babel/runtime-corejs3/core-js/math/radians"`
        )
        expect(code).toContain(
          `import _Math$scale from "@babel/runtime-corejs3/core-js/math/scale"`
        )
      })

      // Math.signbit
      // See https://github.com/zloirock/core-js#mathsignbit
      it('polyfills Math.signbit', () => {
        expect(code).toContain(
          `import _Math$signbit from "@babel/runtime-corejs3/core-js/math/signbit"`
        )
      })

      // Number.fromString
      // See https://github.com/zloirock/core-js#numberfromstring
      it('polyfills Number.fromString', () => {
        expect(code).toContain(
          `import _Number$fromString from "@babel/runtime-corejs3/core-js/number/from-string"`
        )
      })

      // Observable
      // See https://github.com/zloirock/core-js#observable
      it('polyfills Observable', () => {
        expect(code).toContain(
          `import _Observable from "@babel/runtime-corejs3/core-js/observable"`
        )
        expect(code).toContain(
          `import _Symbol$observable from "@babel/runtime-corejs3/core-js/symbol/observable"`
        )
      })

      // String.prototype.codePoints
      // See https://github.com/zloirock/core-js#stringprototypecodepoints
      it('polyfills String.prototype.codePoints', () => {
        expect(code).toContain(
          `import _codePointsInstanceProperty from "@babel/runtime-corejs3/core-js/instance/code-points"`
        )
      })

      // Symbol.matcher for pattern matching
      // See https://github.com/zloirock/core-js#symbolmatcher-for-pattern-matching
      // This one's been renamed to Symbol.matcher since core-js v3.0.0. But Symbol.patternMatch still works
      it('polyfills Symbol.matcher', () => {
        expect(code).toContain(
          `import _Symbol$patternMatch from "@babel/runtime-corejs3/core-js/symbol/pattern-match"`
        )
      })
    })

    describe('Stage 2 proposals', () => {
      // Symbol.{ asyncDispose, dispose } for using statement
      // See https://github.com/zloirock/core-js#symbol-asyncdispose-dispose--for-using-statement
      it('polyfills Symbol.{ asyncDispose, dispose } for using statement', () => {
        expect(code).toContain(
          `import _Symbol$dispose from "@babel/runtime-corejs3/core-js/symbol/dispose"`
        )
      })
    })
  })

  describe('Withdrawn proposals (will be removed in core-js 4)', () => {
    // Efficient 64 bit arithmetic
    // See https://github.com/zloirock/core-js#efficient-64-bit-arithmetic
    it('polyfills efficient 64 bit arithmetic', () => {
      expect(code).toContain(
        `import _Math$iaddh from "@babel/runtime-corejs3/core-js/math/iaddh"`
      )
      expect(code).toContain(
        `import _Math$imulh from "@babel/runtime-corejs3/core-js/math/imulh"`
      )
      expect(code).toContain(
        `import _Math$isubh from "@babel/runtime-corejs3/core-js/math/isubh"`
      )
      expect(code).toContain(
        `import _Math$umulh from "@babel/runtime-corejs3/core-js/math/umulh"`
      )
    })

    // Promise.try
    // See https://github.com/zloirock/core-js#promisetry
    it('polyfills Promise.try', () => {
      const _Promise = require('@babel/runtime-corejs3/core-js/promise')
      expect(_Promise).toHaveProperty('try')
    })

    // String#at
    // See https://github.com/zloirock/core-js#stringat
    it('polyfills String#at', () => {
      expect(code).toContain(
        `import _atInstanceProperty from "@babel/runtime-corejs3/core-js/instance/at"`
      )
    })
  })

  describe('Unstable (will be removed in core-js 4)', () => {
    // Seeded pseudo-random numbers
    // See https://github.com/zloirock/core-js#seeded-pseudo-random-numbers
    it('polyfills Seeded pseudo-random numbers', () => {
      expect(code).toContain(
        `import _Math$seededPRNG from "@babel/runtime-corejs3/core-js/math/seeded-prng"`
      )
    })
  })
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
    version: BABEL_PLUGIN_TRANSFORM_RUNTIME_OPTIONS.corejs.version,
  })

  /**
   * Redwood targets Node.js 12, but that doesn't factor into what gets polyfilled
   * because Redwood uses the plugin-transform-runtime polyfill strategy.
   *
   * Also, plugin-transform-runtime is pinned to core-js v3.0.0,
   * so the list of available polyfill is a little outdated.
   * Some "ES Next" polyfills have landed in v12+ Node.js versions.
   */
  expect(list).toMatchInlineSnapshot(`
    [
      "es.regexp.flags",
      "es.typed-array.set",
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
