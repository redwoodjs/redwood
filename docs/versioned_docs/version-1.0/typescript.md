# TypeScript
Redwood comes with full TypeScript support out of the box, and you don't have to give up any of the conveniences that Redwood offers to enjoy all the benefits of a type-safe codebase. You can use TypeScript and have great DX too.

## Starting a TypeScript Redwood project
You can use the `--typescript` flag on create-redwood-app to generate a project with TypeScript configured:
```shell
yarn create redwood-app --typescript my-redwood-app
```

## Converting an existing JS project to TypeScript
If you already have a Redwood app, but want to configure it for TypeScript, you can use our setup command:

```
yarn rw setup tsconfig
```
Remember you don't _need_ to convert all your files to TypeScript, you can always do it incrementally. Start by renaming your files from `.js` to `.ts` or `.tsx`

Having issues with automatic setup? See instructions for manual setup below:

<details>
<summary>Manually setup TypeScript</summary>

This is what the setup command does for you step by step:

**API**

1. Create a `./api/tsconfig.json` file:

```shell
touch api/tsconfig.json
```

<br />

2. Now copy and paste the latest config from the Redwood template [api/tsconfig.json](https://github.com/redwoodjs/redwood/blob/main/packages/create-redwood-app/template/api/tsconfig.json) file here

**WEB**

1. Create a `./api/tsconfig.json` file:

```shell
touch web/tsconfig.json
```

<br />

2. Now copy and paste the latest config from the Redwood template [web/tsconfig.json](https://github.com/redwoodjs/redwood/blob/main/packages/create-redwood-app/template/web/tsconfig.json) file here


You should now have type definitions&mdash;you can rename your files from `.js` to `.ts`, and the files that contain JSX to `.tsx`.
</details>

## Sharing Types between sides
For your shared types, we need to do a few things:

1. Put your shared types at the root of the project (makes sense right?), in a folder called `types` at the root
2. Run 'Restart TS Server' in vscode via the command palette. And your new types should now be available on both web and api sides!

Redwood's tsconfig already contains the config for picking up types from `web/types`, `api/types` and `types` folders in your project.

If you have an outdated tsconfig, and would like to replace it (i.e. overwrite it), use the setup command with the force flag

```
yarn rw setup tsconfig --force
```

## Running type checks

Redwood uses Babel to transpile your TypeScript - which is why you are able to incrementally convert your project from JS to TS. However, it also means that just doing a build won't show you errors that the TypeScript compiler finds in your project <br/> <br/> That's why we have the handy `redwood type-check` command!

To check your TypeScript project for errors, run
```
yarn rw type-check
```
This will run `tsc` on all the sides in your project, and make sure all the generated types are generated first, including Prisma.


### Check then build, on CI
> **Tip!**<br/>
> You don't need to build your project to run `rw type-check`

If your project is fully TypeScript, it might be useful to add typechecks before you run the deploy command in your CI.

For example, if you're deploying to Vercel, you could add a `build:ci` script to your `package.json`
```diff
"scripts": {
  .
  .
+  "build:ci": "yarn rw type-check && yarn rw test --no-watch && yarn rw deploy vercel",
}
```
Configure your project's build command to be `yarn build:ci` - and you even have your type checks and tests run whenever a pull request is opened!





## Auto generated types
Redwood's CLI automatically generates types for you, which not only includes types for your GraphQL queries, but also for your named routes, Cells, scenarios and tests.

When you run `yarn rw dev`, the CLI watches for file changes and automatically triggers the type generator.

To trigger type generation, you can run:
```shell
yarn rw g types
```


If you're curious, you can see the generated types in the `.redwood/types` folder, and in `./api/types/graphql.d.ts` and `./web/types/graphql.d.ts` in your project
