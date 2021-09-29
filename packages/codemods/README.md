# Codemods

- [Codemods](#codemods)
  - [Purpose and Vision](#purpose-and-vision)
  - [Package Leads](#package-leads)
  - [Contributing](#contributing)

## Purpose and Vision

This package contains codemods that automate upgrading a Redwood project.

## Package Leads

- Daniel Choudhury (@dac09)
- Dominic Saadi (@jtoar)

## Usage

Applying a suite of codemods:

```
npx @redwood/codemods --from=v0.35.0 --to=v0.37.0
```

Applying a single one:

```
npx @redwood/codemods add-directives
```

## Contributing

You should be familiar with [jscodeshift](https://github.com/facebook/jscodeshift).
It's API isn't documented too well so we'll try to explain some of it here.

Like Babel and ESLint, jscodeshift is all about ASTs.
The difference is that it's overwriting files.
That means things that Babel doesn't care about, like spaces, styling (single quotes or double quotes, etc.), all of a sudden matter a lot.
The parser jscodeshift uses, [recast](https://github.com/benjamn/recast), knows how to preserve these details as much as possible.

### A Typical Transform

A typical transform looks something like this:

```typescript
// fooToBar.ts

import type { FileInfo, API } from 'jscodeshift'

module.exports = function (file: FileInfo, api: API) {
  const j = api.jscodeshift

  const root = j(file.source)

  return root
    .findVariableDeclarators('foo')
    .renameTo('bar')
    .toSource()
}
```

You can then run this transform on files via the CLI:

```
yarn run jscodeshift -t fooToBar.js foo.js
```

In this way, jscodeshift is similar to Jest in that it's a runner.

#### The API

In the example above, `file` is the file it's running the transformation on
and `jscodeshift` itself is actually a property of `api`.
Since it's used so much, you'll see this pattern a lot:

```javascript
const j = api.jscodeshift
```

`j` exposes the whole api, but it's also a function—it parses its argument into a `Collection`, jscodeshift's major type. It's similar to a javascript array and has many of the same methods (`forEach`, `map`, etc.).
The best way to familiarze yourself with its methods is to either 1) look at a bunch of examples or 2) [skim the source](https://github.com/facebook/jscodeshift/blob/main/src/Collection.js).

### Writing a transform

When beginning to write a transform, your best bet is to start by pasting the code you want to transform into [AST Explorer](https://astexplorer.net/). Use it to figure out what node you want, and then use one of `jscodeshift`'s `find` methods to find it:

```typescript
import type { FileInfo, API } from 'jscodeshift'

module.exports = function (file: FileInfo, api: API) {
  const j = api.jscodeshift

  const root = j(file.source)

  /**
   * This finds the line:
   *
   * ```
   * import { ... } from '@redwoodjs/router'
   * ```
   */
  return root.find(j.ImportDeclaration, {
    source: {
      type: 'Literal',
      value: '@redwoodjs/router',
      },
    })
}
```

Sometimes `jscodeshift` has a more-specific find method than `find`, like `findVariableDeclarators`. Use it when you can—it makes things a lot easier.
But note that these find methods aren't on `Collection`.
They're in the extensions:

- [Node](https://github.com/facebook/jscodeshift/blob/main/src/collections/Node.js)
- [JSXElement](https://github.com/facebook/jscodeshift/blob/main/src/collections/JSXElement.js)
- etc.

After you find what you're looking for, you usually want to replace it with something else.
Again, use AST Explorer to find out what the AST of that something else is.
Then, instead of using a type (like `j.ImportDeclaration`) to find it, use a builder (like `js.importDeclaration`—it's just the type lowercased) to make it.

Again, sometimes jscodeshift has a method that makes this trivial, especially for simple operations, like renaming or removing something (just use `renameTo` or `remove`).
But sometimes you'll just have to use one of the more generic methods: `replaceWith`, `inserterBefore`, `insertAfter`, etc.

## Testing

We're taking advantage of jscodeshift's integration with Jest to take most of the setup out of unit tests: https://github.com/facebook/jscodeshift#unit-testing.

### Testing TS fixtures...

To test TS files:
https://github.com/facebook/jscodeshift/blob/main/src/testUtils.js#L87

```javascript
defineTest(__dirname, 'addPrismaCreateToScenarios', null, 'realExample', {
  parser: 'ts',
})
```
