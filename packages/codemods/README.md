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

Or applying a single one:

```
npx @redwood/codemods add-directives
```

If you don't provide an argument, you'll be greeted with a list of all the available codemods:

```
npx @redwood/codemods
> - add-directives
> - add-prisma-create-to-scenarios
> - ...
```

## Contributing

You should be familiar with [jscodeshift](https://github.com/facebook/jscodeshift).
It's API isn't documented too well so, keep reading.

### Example

Like Babel and ESLint, jscodeshift is all about ASTs.
The difference is that it's overwriting files.
That means things that Babel doesn't care about, like spaces, styling, all of a sudden now matters a lot.
The parser jscodeshift uses, recast, knows how to preserve as much of these details as possible.

A jscodeshift transform looks like this:

```typescript
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

`file` is the file it's running the transformation on.
jscodeshift itself is actually a property of `api`.
since it's used so much, you'll see this pattern a lot:

```javascript
const j = api.jscodeshift
```

`j` exposes the whole api, but it's also a function—it parses its argument into a `Collection`, jscodeshift's major type. it's similar to a javascript array.

When writing a transform, start by pasting the code you want to transform into [AST Explorer](https://astexplorer.net/). Use it to figure out what node you want.

A lot of transforms look soemthing like...

```typescript
import type { FileInfo, API } from 'jscodeshift'

module.exports = function (file: FileInfo, api: API) {
  const j = api.jscodeshift

  const root = j(file.source)

  return root.find() # find takes a node, like j.Identifier, j.ObjectExpression, etc...
}
```

AST Explorer helps you figure out which node type to pass to jscodeshift's `find`.
This greatly simplifies things.
