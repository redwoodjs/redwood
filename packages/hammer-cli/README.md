# Hammer-CLI

**WARNING:** This document is aspirational (see [Readme Driven
Development](https://tom.preston-werner.com/2010/08/23/readme-driven-development.html))
and not everything contained within it is true yet.

## What is this?

By installing `hammer` you'll be able to run a bunch of commands that you might
find useful during development.

## Installation

With Yarn `yarn add -D @hammerframework/hammer-cli`, or NPM
`npm install --save-dev @hammerframework/hammer-cli`

## Usage

```terminal
yarn hammer [command]
```

## Development

Run `yarn dev` to automatically reload the

Add a new command by creating `CommandName/CommandName.js` file in the
`./src/commands` directory.

A command should export the following:

```js
export default ({ args }) => {}; // The react-ink component.
export const commandProps = {
  name: 'generate',
  alias: 'g', // invoke with hammer s instead of hammer scaffold,
  description: 'This command does a, b, but not c.',
};
```

## Publishing

This is a monorepo and is published via LearnaJS. See the root README for instructions.
