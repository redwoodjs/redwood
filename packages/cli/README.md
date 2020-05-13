# Command Line Interface

The Redwood CLI comes with RedwoodJS (which means no extra software to install!).

## Usage

The [`yarn`](https://classic.yarnpkg.com/en/docs/install) package is required to use the Redwood CLI.

Be sure to prefix all Redwood CLI commands with `yarn`. For example, `yarn redwood new`.

Additionally, you can use `rw` as shorthand for `redwood`. For example, `yarn rw new`.

## Command line basics

```terminal
yarn create redwood-app <project-dir>
```

OK, OK, so this isn't really part of the RedwoodJS CLI, per se. But we felt it belonged here anyway!

We create a new Redwood application by running the `yarn create redwood-app <project-dir>` command, where `<project-dir>` is the path of the to-be Redwood project.

For example:

```terminal
$ yarn create redwood-app ~/myprojects/todo
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
