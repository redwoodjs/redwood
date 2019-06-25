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
⚒ Hammer - Build something. (https://example.org) | v0.0.0-alpha.0

Commands

generate save time by automatically generating boilerplate code
```

Run `yarn hammer generate component <path> <name>` to create a component, a test
file, and a stubbed MDX (docz) file at the specified path.

## Development

Run `yarn dev`

Add a new command by creating a `commandName.js` file in the `./commands`
directory.

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
