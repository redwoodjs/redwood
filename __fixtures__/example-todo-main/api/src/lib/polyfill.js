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
