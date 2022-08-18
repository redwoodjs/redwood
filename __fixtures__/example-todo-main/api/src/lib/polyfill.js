// These examples have been taken from the core-js README, the proposal's README, or MDN.

/**
 * # ES
 */

// ## Node.js 15

const error1 = new TypeError('Error 1')
const error2 = new TypeError('Error 2')
const aggregate = new AggregateError([error1, error2], 'Collected errors')

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

'Test abc test test abc test.'.replaceAll('abc', 'foo')

// ## Node.js 16

Object.hasOwn({ foo: 42 }, 'foo')

// ## Node.js 17

btoa('hi, core-js')

const exception = new DOMException('error', 'DataCloneError');
console.log(exception.name)
console.log(exception.message)
console.log(exception.code)
console.log(typeof exception.stack)
console.log(exception instanceof DOMException)
console.log(exception instanceof Error)
console.log(exception.toString())
console.log(Object.prototype.toString.call(exception))

const structured = [{ a: 42 }]
const sclone = structuredClone(structured)

// ## Node.js 18

function isOdd(value) {
  return value % 2
}
;[1, 2, 3, 4].findLast(isOdd)
;[1, 2, 3, 4].findLastIndex(isOdd)

atob('aGksIGNvcmUtanM=')
