# The Hammer Command Line

## Installation

We recommend that you install Hammer's CLI globally
with npm `npm install -g @hammerframework/hammer-cli` or with
yarn `yarn global add @hammerframework/hammer-cli`.

## Command line basics

### `hammer new`

The first thing we'll want to do is create a new Hammer application by running the
`hammer new` command after installation.

```terminal
$ yarn new ~/myprojects/todo
Created ~/myprojects/todo
Downloading https://github.com/hammerframework/create-hammer-app/archive/v0.0.1-alpha.7.zip...
Extracting...
Added 50 files in ~/myprojects/todo
```

## Development

Run `yarn dev` to automatically reload the

Add a new command by creating `CommandName/CommandName.js` file in the
`./src/commands` directory.

A command should export the following:

```js
export default ({ args }) => {} // The react-ink component.
export const commandProps = {
  name: 'generate',
  alias: 'g', // invoke with hammer s instead of hammer scaffold,
  description: 'This command does a, b, but not c.',
}
```

## Publishing

This is a monorepo and is published via LearnaJS. See the root README for instructions.
