# Merge Source Code

The contents of this directory are designed to enable the merging of Javascript source code using Babel.

## Usage

This library provides single entry point, `merge()`, which takes three arguments: the "base" source code as a string, the "extension" source code as a string, and a merge strategy. It returns the result of merging the base and extension code using the merge strategy. A merge strategy is an object with 1) an optional `identifier` object, and 2) Any number of node-reducers, with names corresponding to Babel's AST node types.

`identifier` is an object used to label AST nodes in both files. If two AST nodes have the same label, they will be merged by the corresponding node-reducer, if it exists in your strategy. If `identifier` is not defined for your strategy, `semanticIdentifier` is used by default. It is explicitly named in the following examples for clarity.

A valid `identifier` has two functions - `getId`, and `isAncestor`. The former takes a Babel NodePath and returns a string that identifies the given NodePath in a particular way. `isAncestor` takes two of these such strings, and returns true iff the first identifier represents an ancestor of the latter. We use `isAncestor` to skip nodes which should not be merged, because we've just merged their ancestor.

Let's take a look at a sample invocation of `merge`.

```js
const mergedCode = merge(baseCode, extensionCode, {
  identity: semanticIdentity,
  ArrayExpression: (lhs, rhs) => { lhs.elements = [...lhs.elements, ...rhs.elements] }
  ObjectExpression: (lhs, rhs) => { lhs.properties = [...lhs.properties, ...rhs.properties] }
})
```

`strategy.js` also provides some convenience functions, which provide consistent names for strategies, while defining node-specific implementations as required.

```js
import { concat } from 'merge/strategy'

const mergedCode = merge(baseCode, extensionCode, {
  identity: semanticIdentity,
  ArrayExpression: concat // Equivalent to `(lhs, rhs) => { lhs.elements = [...lhs.elements, ...rhs.elements] }`
  ObjectExpression: concat // Equivalent to `(lhs, rhs) => { lhs.properties = [...lhs.properties, ...rhs.properties] }`
})
```

Often, you'll want to concatenate two expressions, skipping any duplicates. To do this, you can use `concatUnique`, and provide an equality function for your node type.

```js
import { concat, concatUnique } from 'merge/strategy'

const objectPropertyEquality = (lhs, rhs) => lhs.key.name === rhs.key.name

const mergedCode = merge(baseCode, extensionCode, {
  identity: semanticIdentity,
  ArrayExpression: concat
  ObjectExpression: concatUnique(objectPropertyEquality)
})
```

You can find a complete summary of all available merge strategy convenience functions below, in **Merge Strategies**

## Design Summary

Broadly speaking, `merge()` requires the caller to answer two questions about the merge (but provides defaults for the first)

1. How do we choose which AST nodes to merge?
2. How do we merge AST nodes?

### Semantic Identity

For 1, the default approach is with _semantic identity_, defined in `semantics.js`. A semantic identity is a position-independent pseudo-unique identifier for an AST node. In English, these are just identifiers for code you'd intuitively call "the same" across files. An example can help illustrate:

```js
// a.js
const x = { foo: 'foo' }
export const y = [1, 2, 3, 4, 5]
// b.js
export const y = [5, 6, 7, 8, 9]
const x = { bar: 'bar' }
```

Both `a.js` and `b.js` define the same symbols, but in different orders. The semantic identity of `x` and `y` are the same across both files, because they share:

1. The same scope (module scope)
2. The same name
3. The same initializer type (object and array, respectively).
4. The same exported-ness.

Semantic identity also applies at arbitrary scope depth, and can look "inside" functions, objects, and arrays.

```js
// c.js
const x = { foo: { bar: 'bar' } }
const y = (a) => {
  const z = [1, 2, 3]
  return z.contains(a)
}
// d.js
const y = (a) => {
  const z = [4, 5, 6]
  return z.contains(a)
}
const x = { foo: { baz: 'baz' } }
```

In these examples, `x`, `z` and the `ObjectExpression` to the right side of `foo:` have the same semantic identity. Intuitively, two nodes have the same semantic identity if you can trace the "path" from their scope up to the module scope, and find identical identifiers at each parent scope. Here are some counterexamples to help illustrate:

```js
// e.js
const e = (a) => {
  const z = [1, 2, 3]
  return z.contains(a)
}
// f.js
const f = (a) => {
  // This `z` does not have the same semantic identity as e.z,
  // because the names e and f differ.
  const z = [1, 2, 3]
  return z.contains(a)
}
```

```js
// g.js
const g = {
  foo: {
    bar: {
      baz : 'baz'
    }
  }
}
// g2.js
const g = {
  foo: {
    bar: { // This object's ID is the same as g.foo.bar above,
      blep: 'baz' // But this string's ID is not; g.foo.bar.blep vs. g.foo.bar.baz.
    }
  }
}
```

The goal of semantic identifiers (roughly) is to produce a unique identifier for an AST node, such that iff two AST nodes with the same identifier appeared in the same file, a naming collision would occur. This has one important exception: import statements. Import statements are difficult to uniquely identify because the following is legal:

```js
import { foo } from 'src'
import { bar } from 'src'
```

We have two choices here. Either we consider these semantically equivalent by comparing their source (`src`), or consider them semantically different by comparing their import specifiers (`foo` and `bar`). For the purpose of merging, we choose the former. It is more useful to compare their source, and consider these semantically equivalent. Merging import statements is generally tricky, because Javascript has a few unintuitive rules about how import statements may be structured. For example, you cannot mix a default namespace import with import specifiers, like so:

```js
// Illegal javascript!
import {foo}, * as star from 'source'
import * as star, { foo } from 'source'
```

There's a handful of rules like this, which are explicitly handled in the default merge strategy for `ImportDeclaration`. See `strategy.js` for more.

### Node Reducers

We now get to our second question above - _how_ do we merge AST nodes, once we identify which ones we wish to merge? In this approach, we answer this question with a "node reducers".

A merge strategy is simply a set of named _reducers_ (like you might pass to `Array.reduce`), along with an `identity` function. Unlike regular reducers, you are not required to return the accumulator. Instead, you modify the accumulator in place (you may return something from your reducer, but it will be ignored). The reducers' names are Babel node types. If, for example, you wanted to merge array expressions by simply concatenating their contents together, you might write a strategy like the following:

```js
const strategy = {
  ArrayExpression: (lhs, rhs) => { lhs.elements = [...lhs.elements, ...rhs.elements] }
}
```

And if you also wanted to also merge object expressions by merging their key/value pairs (AKA properties), you could write:

```js
const strategy = {
  ArrayExpression: (lhs, rhs) => { lhs.elements = [...lhs.elements, ...rhs.elements] }
  ObjectExpression: (lhs, rhs) => { lhs.properties = [...lhs.properties, ...rhs.properties] }
}
```

Notably, this particular `ObjectExpression` strategy might prove troublesome. If `lhs` and `rhs` are guaranteed to have strictly different property names, this will work fine. But if they overlap, you'll produce an ObjectExpression with duplicate properties, which is legal, but likely a bug:

```js
// a.js
const x = { foo: 'foo1' }
// b.js
const x = { foo: 'foo2' }
// <merged>
const x = { foo: 'foo1', foo: 'foo2' } // Probably a bug.
```

At this stage, you have two choices. Assuming you're using semantic identity to identify your merge candidates, you can 1) recursively define the problem as how to merge the string literals `'foo'` and `'bar'`, since they have the same semantic identity, or 2) define a merge strategy that filters out this possiblity by only merging properties with different keys.

Option 1 looks like this:

```js
const strategy = {
  ObjectExpression: (lhs, rhs) => { lhs.properties = [...lhs.properties, ...rhs.properties] }
  StringLiteral: (lhs, rhs) => { lhs.value = `${lhs.value}|${rhs.value}` }
}
// Would merge a.js and b.js as:
const x = { foo: 'foo1|foo2' }
```

Option 2 looks like this:

```js
const propertyEquality = (lprop, rprop) => lprop.key.name === rprop.key.name
const strategy = {
  ObjectExpression: (lhs, rhs) => {
    // Assuming the presence of lodash
    lhs.properties = _.uniqWith([...lhs.properties, ...rhs.properties], propertyEquality)
  }
}
// Would merge a.js and b.js as:
const x = { foo: 'foo' }
```

### Opaqueness

Often, you'll want to define a strategy that treats certain AST nodes as "opaque", meaning their contents should not be recursively merged. Let's assume we have a simple strategy that concatenates the elements in ArrayExpressions.

```js
const strategy = {
  ArrayExpression: (lhs, rhs) => { lhs.elements = [...lhs.elements, ...rhs.elements] }
}
```

Then, given the following, we'll recursively merge nested ArrayExpressions by default.

```js
// a.js
const x = [1, [3, [5]]]
// b.js
const x = [2, [4, [6]]]
// merged:
const x = [1, 2, [3, 4, [5, 6]]]
```

Depending on your use case, that might be what you want. If it isn't, we need a way to define a merge strategy that prevents the nested arrays from being merged. To do this, we use the function `opaquely`. We use an adverb ("opaquely" rather than "opaque") to indicate that `opaquely` itself takes a strategy, and also marks that strategy as the final authority on how to merge the contents of the AST node it names. Let's see an example:

```js
const strategy = {
  ArrayExpression: opaquely((lhs, rhs) => { lhs.elements = [...lhs.elements, ...rhs.elements] })
}
```

Given this strategy, we'd merge the above example as:
```js
// a.js
const x = [1, [3, [5]]]
// b.js
const x = [2, [4, [6]]]
// merged:
const x = [1, [3, [5]], 2, [4, [6]]]
```

Notice we've just concatenated the contents of the top-level arrays, and not merged the nested child arrays.

The quintessential use-case for opaqueness is functions - often, you'll want to recursively merge expressions when they appear in your source code, unless they appear inside functions. So, in the case of `FunctionDeclaration` and `ArrowFunctionExpression`, we'll mark our merge strategies as opaque:

```js
const strategy = {
  ArrayExpression: (lhs, rhs) => { lhs.elements = [...lhs.elements, ...rhs.elements] }
  FunctionDeclaration: opaquely((lhs, rhs) => { ??? })
  ArrowFunctionDeclaration: opaquely((lhs, rhs) => { ??? })
}
```

This will successfully prevent the contents of functions (standard, and arrow-style) from being merged. Now, our only task is to write a merge strategy for functions. What do we do when we find two semantically-equivalent functions (that is, two with the same name at the same scope)?

There's no strictly-correct answer for this; you'll likely need different strategies for different applications. You're free to replace the `???` above what whatever function merging strategy is useful to you. `strategy.js` also provides one such strategy: `keepBoth`. `keepBoth` is an opaque strategy for simply putting both the base and extension nodes into the final merge. Similarly, `keepBothStatementParents` is particularly useful for arrow function expressions, which (by themselves) are not complete statements. `(x, y) => x + y` is an incomplete statement, you likely need `const foo = (x, y) => x + y`. To express the desire to keep semantically identical arrow function expressions, and their variable declaration, use `keepBothStatementParents`.

`keepBoth` and `keepBothStatementParents` are strictly opaque strategies, since it's nonsensical to "non-opaquely keep both" - that would imply recursively merging the contents of the extension into the base, _and then_ keep the merged-into base and unmodified extension in the final merge. At the time of writing, the author cannot fathom a reasonable use for this, so you'll have to implement that manually if you need it.

```js
const strategy = {
  ArrayExpression: (lhs, rhs) => { lhs.elements = [...lhs.elements, ...rhs.elements] }
  FunctionDeclaration: keepBoth // Implicitly opaque
  ArrowFunctionDeclaration: keepBothStatementParents // Implicitly opaque
}
```

This will perform the following merge:

```js
// a.js
const letters = ['a', 'b', 'c']
function func(a) {
  return [1, 2, 3].contains(a)
}
// b.js
const letters = ['d', 'e', 'f']
function func(a) {
  return [4, 5, 6].contains(a)
}
// merged
const letters = ['a', 'b', 'c', 'd', 'e', 'f']
function func(a) {
  return [1, 2, 3].contains(a)
}
function func(a) {
  return [4, 5, 6].contains(a)
}
```

Yes, you've produced a naming collision on `func`, but that's precisely what you've asked for with `keepBoth`. Presumably, you'll need to manually fix this collision in your generated code.

### Algorithm Design

This merge algorithm runs in one traversal of the base AST, and one traversal of the extension AST. First, it traverses the extension AST and generates an identifier for each node named by the merge strategy. Next, it traverses the base AST, and attempts to merge AST nodes **from the leaves, up**. That is, the inner-most expressions are merged first. If, however, a node reducer is marked as "opaque" (described above), that node is considered a leaf for the purpose of merging, and its children are not merged.

```js
// a.js
const x = [1, [3, [5]]]
// b.js
const x = [2, [4, [6]]]
// strategy
const strategy = {
  ArrayExpression: (lhs, rhs) => { lhs.elements = [...lhs.elements, ...rhs.elements] },
}
// merged
const x = [1, 2, [3, 4, [5, 6]]]
```

```js
// a.js
function f() {
  return [1, [3, [5]]]
}
// b.js
function f() {
  return [2, [4, [6]]]
}
// strategy
const strategy = {
  ArrayExpression: (lhs, rhs) => { lhs.elements = [...lhs.elements, ...rhs.elements] },
  FunctionDeclaration: opaquely(keepBoth())
}
// merged
function f() {
  return [1, [3, [5]]]
}
function f() {
  return [2, [4, [6]]]
}
```

Importantly, if the merge strategy given is empty - if does not provide any node reducers - `merge` will be a no-op, and simply yield the base source code, unmodified.

## Merge Strategies

### concat

### concatUnique

### interleave
For import declarations.

### opaquely
