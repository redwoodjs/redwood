# Contributing

Love Redwood and want to get involved? You’re in the right place!

Before interacting with the Redwood community, please read and understand our [Code of Conduct](https://github.com/redwoodjs/redwood/blob/master/CODE_OF_CONDUCT.md).

**Table of Contents**

- [Local development](#Local-development)
- [Running the Local Server(s)](#Running-the-Local-Server(s))
- [CLI Package Development](#CLI-Package-Development)

<!-- toc -->

## Local development

When contributing to Redwood, you'll probably want to see your changes in the Redwood Framework's monorepo "running live" in one of your own Redwood projects or in one of our example apps. We offer two workflows to make this possible: "watch and copy", which has some restrictions, and "emulate npm", which doesn't. If you've installed or upgraded a dependency, you'll want to use the "emulate npm" workflow; otherwise, use "watch and copy".

> Both workflows use `rwdev`, Redwood's companion CLI development tool.

### Watch and copy

First, build-and-watch files in the Redwood Framework for changes:

```terminal
cd redwood
yarn build:watch

@redwoodjs/api: $ nodemon --watch src -e ts,js --ignore dist --exec 'yarn build'
@redwoodjs/core: $ nodemon --ignore dist --exec 'yarn build'
create-redwood-app: $ nodemon --ignore dist --exec 'yarn build'
@redwoodjs/eslint-plugin-redwood: $ nodemon --ignore dist --exec 'yarn build'
```

Then, watch-and-copy those changes into your Redwood project or example app (here, [example-invoice](https://github.com/redwoodjs/example-invoice)):

```terminal
cd example-invoice
yarn rwdev watch ../path/to/redwood

Redwood Framework Path:  /Users/peterp/Personal/redwoodjs/redwood
Trigger event:  add
building file list ... done
```

> You can create a `RW_PATH` env var so you don't have to specify the path in the watch command.

Now any changes made in the framework will be copied into your project!

### Emulate NPM

Sometimes you'll want to test the full-development flow, from building and publishing our packages to installing them in your project. We facilitate this using a local NPM registry called [Verdaccio](https://github.com/verdaccio/verdaccio).

#### Setting up and running a local NPM registry

```terminal
yarn global add verdaccio
./tasks/run-local-npm
```

This starts Verdaccio (http://localhost:4873) with our configuration file.

#### Publishing a package

`./tasks/publish-local` will build, unpublish, and publish all the Redwood packages to your local NPM registry with a "dev" tag. For the curious, it's equivalent to running:

```terminal
npm unpublish --tag dev --registry http://localhost:4873/ --force
npm publish --tag dev --registry http://localhost:4873/ --force
```

You can build a particular package by specifying the path to the package: `./tasks/publish-local ./packages/api`.

#### Installing published packages

`rwdev` makes installing local npm packages easy:

```terminal
yarn rwdev install @redwoodjs/dev-server
```

This is equivalent to running:

```terminal
rm -rf <PROJECT_PATH>/node_modules/@redwoodjs/dev-server
yarn upgrade @redwoodjs/dev-server@dev --no-lockfile --registry http://localhost:4873/
```

## Running the Local Server(s)

You can run both the API and Web servers with a single command:

```terminal
yarn rw dev
```

But for local package development, you'll need to manually stop/start the respective server to include changes. In this case you can run the servers for each of the yarn workspaces independently:

```terminal
yarn rw dev api
yarn rw dev web
```

## CLI Package Development

We are using [Yargs](https://yargs.js.org/)
_Historical note: originally implemented in react-ink (too slow!) then converted._

### Example

Example dev command:

```javascript
export const command = 'dev [app..]'
export const desc = 'Run development servers.'
export const builder = {
  app: { choices: ['db', 'api', 'web'], default: ['db', 'api', 'web'] },
}
export const handler = ({ app }) => {
   // do stuff...
}
```

Yargs creates a nice interface, coerces the args, and runs the handler.
