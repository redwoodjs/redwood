// These examples have been taken from the core-js README, the proposal's README, or MDN.

Math.hypot(3, 4)

const error1 = new TypeError('Error 1')
const error2 = new TypeError('Error 2')
const aggregate = new AggregateError([error1, error2], 'Collected errors')

const buffer = new ArrayBuffer(8)
const uint8 = new Uint8Array(buffer)
uint8.set([1, 2, 3], 3)

;[1, 2, 3].lastIndex
;[1, 2, 3].lastItem

const array = [1, 2, 3]
array.lastItem = 4

new Array(1, 2, 3).lastIndex
new Array(1, 2, 3).lastItem

const key = compositeKey({})
const symbol = compositeSymbol({})

const m = new Map()
m.deleteAll()

Math.clamp(2, 1, 3)
Math.DEG_PER_RAD
Math.degrees(1)
Math.fscale(5, 1, 1, 2, 2)
Math.RAD_PER_DEG
Math.radians(360)
Math.scale(5, 1, 1, 2, 2)

Math.signbit(NaN)

Math.iaddh(lo0, hi0, lo1, hi1)
Math.imulh(a, b)
Math.isubh(lo0, hi0, lo1, hi1)
Math.umulh(a, b)

for (let x of Math.seededPRNG({ seed: 42 })) {
  console.log(x)
  if (x > .8) break;
}

Number.fromString('42')

new Observable(observer => {
  observer.next('hello')
  observer.next('world')
  observer.complete()
}).subscribe({
  next(it) { console.log(it) },
  complete() { console.log('!') }
})
Symbol.observable

Promise.any([
  Promise.resolve(1),
  Promise.reject(2),
  Promise.resolve(3),
]).then(console.log)
Promise.any([
  Promise.reject(1),
  Promise.reject(2),
  Promise.reject(3),
]).catch(({ errors }) => console.log(errors))

Promise.try(() => 42).then(it => console.log(`Promise, resolved as ${it}`))
Promise.try(() => { throw 42; }).catch(it => console.log(`Promise, rejected as ${it}`))

let object = {}
Reflect.defineMetadata('foo', 'bar', object)
Reflect.getOwnMetadataKeys(object)
Reflect.getOwnMetadata('foo', object)

const s = new Set()
s.addAll()

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

Symbol.patternMatch
Symbol.dispose

const wm = new WeakMap()
wm.deleteAll()

const ws = new WeakSet()
ws.addAll()
