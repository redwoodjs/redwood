# The Redwood Command Line Interface

The Redwood CLI comes with RedwoodJS (which means no extra software to install!). It is made with [yargs](https://yargs.js.org/).

## Usage

The [`yarn`](https://classic.yarnpkg.com/en/docs/install) package is required to use the Redwood CLI.

Be sure to prefix all Redwood CLI commands with `yarn`. For example, `yarn redwood new`.

Additionally, you can use `rw` as shorthand for `redwood`. For example, `yarn rw new`.

## Command line basics

### Get Help

```terminal
$ yarn redwood --help
```

You can see the list of available CLI commands directly from the terminal. The output will be similar to:

```terminal
rw <command>

Commands:
  rw build [app..]    Build for production.
  rw db <command>     Database tools.                        [aliases: database]
  rw dev [app..]      Run development servers.
  rw generate <type>  Save time by generating boilerplate code.     [aliases: g]
  rw lint             Lint your files.
  rw open [port]      Open your project in your browser.
  rw test [app..]     Run Jest tests for api and web.
```

The `--help` flag can be passed after any of the Redwood CLI commands described above. For example, `yarn redwood open --help` displays the documentation for the `redwood open` command.

### Create a New Redwood Project

```terminal
$ yarn create redwood-app <project-dir>
```

OK, OK, so this isn't really part of the RedwoodJS CLI, per se. But we felt it belonged here anyway!

We create a new Redwood application by running the `yarn create redwood-app <project-dir>` command, where `<project-dir>` is the path of the to-be Redwood project.

For example:

```terminal
$ yarn create redwood-app ~/myprojects/todo
```

### Database Tools

```terminal
$ yarn redwood database <command>
```

or

```terminal
$ yarn redwood db <command>
```

This command exposes the various database commands.

#### Create a New Migration

```terminal
$ yarn redwood db save [name..]
```

This command creates and saves new migrations in a new folder based on current data model changes.

It takes an optional parameter, `name`, that, if present, will be used as a name for the new migration.

#### Generate Prisma Client and Apply Migrations

```terminal
$ yarn redwood db up
```

This command generates the Prisma Client and applies any unapplied migrations.

#### Undo Migrations

```terminal
$ yarn redwood db down
```

This command undoes any migrations that were applied to the database.

#### Generate Prisma Client

```terminal
$ yarn redwood db generate
```

This command generates the Prisma Client (more specifially, it invokes the generators specific in the Prisma project file).

#### Seed Database

```terminal
$ yarn redwood db seed
```

This command seeds the database with test data.

More specifically, it runs the `api/prisma/seeds.js` file which must be filled with seed code to seed the database with initial test data.

### Run Linter

```terminal
$ yarn redwood lint
```

This command runs the linter in all projects.

### Run Tests

```terminal
$ yarn redwood test [app..]
```

This command runs tests in the specified projects.

It takes an optional parameter, `app`, which is an array of strings, each which identifies the project to be run.

By default, it runs the tests of all projects (`api` and `web`).

For example, if you'd like to _only_ run the `api` project tests, run:

```terminal
$ yarn redwood test api
```

### Run Development Server(s)

```terminal
$ yarn redwood dev [app..]
```

This command runs the development servers.

It takes an optional parameter, `app`, which is an array of strings, each which identifies the project to be run.

By default, it runs the development servers of all projects (`api` and `web`).

For example, if you'd like to _only_ run the `api` project development server, run:

```terminal
$ yarn redwood dev api
```

### Open Project

```terminal
$ yarn redwood open
```

This command opens the browser to the local port in which the web development server is running. This port is defined and can be modified in your project's `redwood.toml` file (found in the root).

Please note that this command _does not_ run the development server. It simply opens the browser.

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
