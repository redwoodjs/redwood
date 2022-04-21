import util from 'util'

export const logdepth = (depth) => (thing) =>
  console.log(util.inspect(thing, { depth }))

export const logdeep = logdepth(100)
export const logshallow = logdepth(5)

export const nodeIs = (type) => (node) => node.type === type

// sieve (noun) a device with meshes or perforations through which finer particles of a mixture
// (as of ashes, flour, or sand) of various sizes may be passed to separate them from coarser ones.
// In this algorithm, we take N list-rule-pairs, of the form [[...elements], rule], where `rule` is
// a unary function accepting a result subarray and returning a position (possibly -1) indicating
// where an element of its list may be placed in the given subarray. Each list-rule-pair can be
// thought of as a category of elements that have particular ordering concerns.
// The algorithm returns a minimally-sized array of arrays, where each element occurs exactly once
// in one of the subarrays, and none of the ordering rules are violated.
// It is assumed that no rule prevents an element from being placed alone in its own subarray.
export function sieve(...listRulePairs) {
  const result = [[]]
  for (const [list, rule] of listRulePairs) {
    elementLoop: for (const element of list) {
      for (const arr of result) {
        const position = rule(arr)
        if (position !== -1) {
          arr.splice(position, 0, element)
          continue elementLoop
        }
      }
      // We haven't found an array appropriate to hold element. Assume that any element can
      // appear alone in a list, and create a new array holding that element:
      result.push([element])
    }
  }
  return result
}

// https://www.geeksforgeeks.org/lodash-_-uniqwith-method/
export function pushUnique(eq, arr, ...items) {
  itemloop: for (const i of items) {
    for (const j of arr) {
      if (eq(j, i)) {
        continue itemloop
      }
    }
    arr.push(i)
  }
}

export function fillUnique(eq, ...items) {
  const result = []
  pushUnique(eq, result, ...items)
  return result
}

export function forEachFunctionOn(object, callback) {
  for (const [key, value] of Object.entries(object)) {
    if (typeof value === 'function') {
      callback(key, value)
    }
  }
}

export function partition(arr, predicate) {
  return arr.reduce(
    (result, i) => {
      result[predicate(i) ? 0 : 1].push(i)
      return result
    },
    [[], []]
  )
}

export function overlap(base, ext, key) {
  const map = ext.reduce((acc, e) => {
    acc[key(e)] = e
    return acc
  }, {})
  const overlaps = base.reduce((acc, b) => {
    const k = key(b)
    if (k in map) {
      acc.push([b, map[k]])
      delete map[k]
    }
    return acc
  }, [])
  return [overlaps, Object.values(map)]
}

export function deletePropertyIf(object, predicate) {
  Object.entries(object)
    .filter(predicate)
    .forEach(([k, _v]) => {
      delete object[k]
    })
}
