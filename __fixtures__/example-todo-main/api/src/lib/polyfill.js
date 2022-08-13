/**
 * Redwood targets Node.js 12, but that doesn't factor into what gets polyfilled
 * because Redwood uses the plugin-transform-runtime polyfill strategy.
 *
 * Also, plugin-transform-runtime is pinned to core-js v3 (no minors, no patches),
 * so the list of available polyfill is a little outdated.
 *
 * Most of these examples are taken from the core-js README, the proposal's README, or MDN.
 *
 * Key:
 * - ✅ -> plugin-transform-runtime successfully polyfills this
 * - ❌  -> plugin-transform-runtime fails to polyfill this
 */

/**
 * # ES
 */
// Node.js 13
// ✅ es.math.hypot
Math.hypot(3, 4)

// ❌ es.typed-array.set
// Node.js 17
const buffer = new ArrayBuffer(8);
const uint8 = new Uint8Array(buffer);
uint8.set([1, 2, 3], 3);

/**
 * # ES Next
 */
// Node.js 15
// ✅ esnext.aggregate-error
const error1 = new TypeError('Error 1');
const error2 = new TypeError('Error 2');
const aggregate = new AggregateError([error1, error2], 'Collected errors');

/**
 * ## Array
 *
 * Stage 1 proposal
 * ❌ esnext.array.last-index, esnext.array.last-item
 */
[1, 2, 3].lastItem // => 3
[1, 2, 3].lastIndex // => 2

const array = [1, 2, 3]
array.lastItem = 4

new Array(1, 2, 3).lastItem
new Array(1, 2, 3).lastIndex

/**
 * ## compositeKey, compositeSymbol
 *
 * Stage 1 proposal
 * ✅ esnext.composite-key, esnext.composite-symbol
 */
const key = compositeKey({});
console.log(typeof key); // => 'object'

const symbol = compositeSymbol({});
console.log(typeof symbol); // => 'symbol'

/**
 * ## Map
 *
 * ✅
 *
 * Stage 1 proposal
 *
 * esnext.map.delete-all
 * esnext.map.every
 * esnext.map.filter
 * esnext.map.find
 * esnext.map.find-key
 * esnext.map.from
 * esnext.map.group-by
 * esnext.map.includes
 * esnext.map.key-by
 * esnext.map.key-of
 * esnext.map.map-keys
 * esnext.map.map-values
 * esnext.map.merge
 * esnext.map.of
 * esnext.map.reduce
 * esnext.map.some
 * esnext.map.update
 */
const m = new Map()
m.deleteAll()

/**
 * ## Math
 *
 * ✅
 *
 * Stage 1 proposal
 *
 * esnext.math.clamp
 * esnext.math.deg-per-rad
 * esnext.math.degrees
 * esnext.math.fscale
 * esnext.math.rad-per-deg
 * esnext.math.radians
 * esnext.math.scale
 * esnext.math.signbit
 *
 * Will be removed in core-js 4:
 *
 * esnext.math.iaddh
 * esnext.math.imulh
 * esnext.math.isubh
 * esnext.math.umulh
 * esnext.math.seeded-prng
 */
Math.clamp(2, 1, 3)
Math.DEG_PER_RAD
Math.degrees(1)
Math.fscale(5, 1, 1, 2, 2)
Math.RAD_PER_DEG
Math.radians(360)
Math.scale(5, 1, 1, 2, 2)

for (let x of Math.seededPRNG({ seed: 42 })) {
  console.log(x); // => 0.16461519912315087, 0.2203933906000046, 0.8249682894209105
  if (x > .8) break;
}

Math.signbit(NaN); // => false

Math.iaddh(lo0, hi0, lo1, hi1)
Math.imulh(a, b)
Math.isubh(lo0, hi0, lo1, hi1)
Math.umulh(a, b)

/**
 * ## Number.fromString
 *
 * Stage 1 proposal
 * ✅ esnext.number.from-string
 */
Number.fromString('42')

/**
 * ## Observable
 *
 * Stage 1 proposal
 * ✅ esnext.observable
 */
new Observable(observer => {
  observer.next('hello');
  observer.next('world');
  observer.complete();
}).subscribe({
  next(it) { console.log(it); },
  complete() { console.log('!'); }
})

Symbol.observable

/**
 * ## Promise
 *
 * Node.js 15
 * ✅ esnext.promise.any
 *
 * Will be removed in core-js 4:
 * ✅ esnext.promise.try
 */
Promise.any([
  Promise.resolve(1),
  Promise.reject(2),
  Promise.resolve(3),
]).then(console.log); // => 1
Promise.any([
  Promise.reject(1),
  Promise.reject(2),
  Promise.reject(3),
]).catch(({ errors }) => console.log(errors))

Promise.try(() => 42).then(it => console.log(`Promise, resolved as ${it}`))
Promise.try(() => { throw 42; }).catch(it => console.log(`Promise, rejected as ${it}`))

/**
 * ## Reflect metadata
 *
 * ✅
 *
 * Stage ? proposal
 *
 * esnext.reflect.define-metadata
 * esnext.reflect.delete-metadata
 * esnext.reflect.get-metadata
 * esnext.reflect.get-metadata-keys
 * esnext.reflect.get-own-metadata
 * esnext.reflect.get-own-metadata-keys
 * esnext.reflect.has-metadata
 * esnext.reflect.has-own-metadata
 * esnext.reflect.metadata
 */
let object = {}
Reflect.defineMetadata('foo', 'bar', object)
Reflect.ownKeys(object)
Reflect.getOwnMetadataKeys(object)
Reflect.getOwnMetadata('foo', object)

/**
 * ## Set
 *
 * ✅
 *
 * Stage 1 proposal
 *
 * esnext.set.add-all
 * esnext.set.delete-all
 * esnext.set.difference
 * esnext.set.every
 * esnext.set.filter
 * esnext.set.find
 * esnext.set.from
 * esnext.set.intersection
 * esnext.set.is-disjoint-from
 * esnext.set.is-subset-of
 * esnext.set.is-superset-of
 * esnext.set.join
 * esnext.set.map
 * esnext.set.of
 * esnext.set.reduce
 * esnext.set.some
 * esnext.set.symmetric-difference
 * esnext.set.union
 */
const s = new Set()
s.addAll()

/**
 * ## String
 *
 * ✅
 *
 * Stage 1 proposal
 * esnext.string.code-points
 *
 * Node.js 14
 * esnext.string.match-all
 *
 * Node.js 15
 * esnext.string.replace-all
 *
 * Will be removed in core-js 4
 * esnext.string.at
 */

for (let { codePoint, position } of 'qwe'.codePoints()) {
  console.log(codePoint)
  console.log(position)
}

for (let [_, d, D] of '1111a2b3cccc'.matchAll(/(\d)(\D)/g)) {
  console.log(d, D)
}

'Test abc test test abc test.'.replaceAll('abc', 'foo')

'a𠮷b'.at(1)
'a𠮷b'.at(1).length

/**
 * ## Symbol
 *
 * ✅
 *
 * Stage 1 proposal
 * This was renamed matcher at some point
 * esnext.symbol.pattern-match
 *
 * Stage 2 proposal
 * esnext.symbol.dispose
 */
Symbol.patternMatch
Symbol.dispose

/**
 * ## WeakMap
 *
 * Stage 1 proposal
 * ✅ esnext.weak-map.delete-all, esnext.weak-map.from, esnext.weak-map.of
 */
const wm = new WeakMap()
wm.deleteAll()

/**
 * ## WeakSet
 *
 * Stage 1 proposal
 * ✅ esnext.weak-set.add-all, esnext.weak-set.delete-all, esnext.weak-set.from, esnext.weak-set.of
 */
const ws = new WeakSet()
ws.addAll()
