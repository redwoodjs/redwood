# Hammer-CLI

**WARNING:** This document is aspirational (see [Readme Driven
Development](https://tom.preston-werner.com/2010/08/23/readme-driven-development.html))
and not everything contained within it is true yet.

## What is this?

By installing `hammer` you'll be able to run a bunch of commands that you'll
find useful during development.

## Installation

`yarn add -D @hammerframework/hammer-cli`
`npm i @hammerframework/hammer-cli --dev`

## Command: Scaffolding

Run `yarn hammer scaffold component <path> <name>` to create a component, a test
file and a stubbed MDX file in that specified path.

## Development

We're building this in [React Pastel](https://github.com/vadimdemedes/pastel).

Add a new command by creating a `commandName.js` file in the `./commands`
directory.
