# Hammer-CLI

**WARNING:** This document is aspirational (see [Readme Driven
Development](https://tom.preston-werner.com/2010/08/23/readme-driven-development.html))
and not everything contained within it is true yet.

## What is this?

By installing `hammer` you'll be able to run a bunch of commands that you might
find useful during development.

## Installation

`yarn add -D @hammerframework/hammer-cli`
or
`npm i @hammerframework/hammer-cli --dev`

## Usage

```terminal
yarn hammer

⚒ Hammer - Build something. (https://example.org) (v0.0.0-alpha.0)

Commands

 scaffold    auto generate a set of files for rapid development
```

Run `yarn hammer scaffold component <path> <name>` to create a component, a test
file, and a stubbed MDX file in that specified path.

## Development

Run `yarn dev`

Add a new command by creating a `commandName.js` file in the `./commands`
directory.

## Publishing

This is a monorepo and is published via LearnaJS. See the root README for instructions.
