---
description: Redwood comes with full TypeScript support
---

# TypeScript

Redwood comes with full TypeScript support, and you don't have to give up any of the conveniences that Redwood offers to enjoy all the benefits of a type-safe codebase.

## Starting a Redwood Project in TypeScript

You can use the `--typescript` option on `yarn create redwood-app` to use TypeScript from the get-go:

```
yarn create redwood-app my-redwood-app --typescript
```

## Converting a JavaScript Project to TypeScript

Started your project in JavaScript but want to switch to TypeScript?
Start by using the tsconfig setup command:

```
yarn rw setup tsconfig
```

This adds `tsconfig.json` files to both the web and the api side, telling VSCode that this's a TypeScript project.
(You can go ahead and remove the `jsconfig.json` files in both sides now.)

You don't need to convert all your JavaScript files to TypeScript right away.
In fact, you probably shouldn't.
Do it incrementally.
Start by renaming your files from `.js` to `.ts`, or, if they have a React component, `.tsx`.

## Sharing Types between Sides

To share types between sides:

1. Put them in a directory called `types` at the root of your project (note that you may have to create this directory)
   - Redwood's `tsconfig.json` is already configured to pick up types from this directory
2. Restart your editor's TypeScript server
   - In VSCode, you can do this by searching for "TypeScript: Restart TS server" using the command palette (make sure you're in a `.js` or `.ts` file)

## Running Type Checks

Behind the scenes, Redwood actually uses Babel to transpile TypeScript.
This's why you're able to convert your project from JavaScript to TypeScript incrementally, but it also means that, strictly speaking, dev and build don't care about what the TypeScript compiler has to say.

That's where the `type-check` command comes in:

```
yarn rw type-check
```

This runs `tsc` on your project and ensures that all the necessary generated types are generated first, including Prisma.

## Auto-generated Types

The CLI automatically generates types for you.
These generated types not only include your GraphQL queries, but also your named routes, Cells, scenarios, and tests.

When you run `yarn rw dev`, the CLI watches for file changes and triggers the type generator, but you can also trigger it manually:

```
yarn rw g types
```

> If you're curious, you can find the generated types in the `.redwood/types`, `web/types/graphql.d.ts`, and `api/types/graphql.d.ts` directories.
