# The Redwood Command Line

## Installation

We recommend that you install Redwood's CLI globally
with npm `npm install -g @redwoodjs/cli` or with
yarn `yarn global add @redwoodjs/cli`.

## Command line basics

### `redwood new`

The first thing we'll want to do is create a new Redwood application by running the
`redwood new` command after installation.

```terminal
$ yarn new ~/myprojects/todo
Created ~/myprojects/todo
Downloading https://github.com/redwoodjs/create-redwood-app/archive/v0.0.1-alpha.7.zip...
Extracting...
Added 50 files in ~/myprojects/todo
```

## Development

Commands require a "redwood project structure" to be effectively tested.
You can use `create-redwood-app` to test your commands, but first you'll need link
to this repo with `create-redwood-app`.

```terminal
$ cd redwood/packages/cli
$ yarn link
success Registered "@redwoodjs/cli".
info You can now run `yarn link "@redwoodjs/cli"` in the projects where you want to use this package and it will be used instead.
$ cd ../../../create-redwood-app
$ `yarn link "@redwoodjs/cli"`
$ yarn redwood dev <command>
```

Run `yarn dev <command>` to automatically re-run your command when you make changes
during development.

### Adding new commands

Add a new command by creating `CommandName/CommandName.js` file in the
`./src/commands` directory.

A command should export the following:

```js
export default ({ args }) => {} // The react-ink component.
export const commandProps = {
  name: 'generate',
  alias: 'g', // invoke with `redwood s` instead of `redwood scaffold`,
  description: 'This command does a, b, but not c.',
}
```

## Publishing

This is a monorepo and is published via [LernaJS](https://lerna.js.org/). See the root README for instructions.
