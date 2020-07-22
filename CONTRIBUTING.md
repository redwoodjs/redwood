# Contributing

Love Redwood and want to get involved? You’re in the right place!

Before interacting with the Redwood community, please check our [Code of Conduct](https://github.com/redwoodjs/redwood/blob/main/CODE_OF_CONDUCT.md) first.

**Table of Contents**

- [Contributing](#contributing)
  - [Local development](#local-development)
    - [Building the app](#building-the-app)
    - [Installing local Redwood in your app](#installing-local-redwood-in-your-app)
      - [Copy on source change](#copy-on-source-change)
      - [Local package registry emulation](#local-package-registry-emulation)
        - [Publishing a package](#publishing-a-package)
        - [Installing published packages in your app](#installing-published-packages-in-your-app)
  - [Running your Redwood app](#running-your-redwood-app)
  - [Integration tests](#integration-tests)
  - [Releases](#releases)
    - [Troubleshooting](#troubleshooting)
  - [CLI Reference: `redwood-tools` (alias `rwt`)](#cli-reference-redwood-tools-alias-rwt)
    - [copy (`cp`)](#copy-cp)
    - [copy:watch (`cpw`)](#copywatch-cpw)
    - [fix-bins (`fix`)](#fix-bins-fix)
    - [install (`i`)](#install-i)

## Local development

As a Redwood user, you're already familiar with the codebase `yarn create redwood-app` creates.
Here we'll call this codebase a "Redwood App"--it’s the fullstack-to-Jamstack solution you already know and love.

As a contributor, you'll have to gain familiarity with one more codebase: the Redwood Framework.
The Redwood Framework lives in the monorepo redwoodjs/redwood; it contains all the packages that make Redwood Apps work the way they do.

If you don't want to create any custom app for sake of working on Redwood's core you can use one of example apps: [invoice](https://github.com/redwoodjs/example-invoice), [blog](https://github.com/redwoodjs/example-blog), [todo](https://github.com/redwoodjs/example-todo).

### Building the app
You can build the Redwood Framework using:
```terminal
cd redwood
yarn build
```

Or you can trigger the building process on source files' change:

```terminal
cd redwood
yarn build:watch
```
Which is equivilant to running:
```
@redwoodjs/api: $ nodemon --watch src -e ts,js --ignore dist --exec 'yarn build'
@redwoodjs/core: $ nodemon --ignore dist --exec 'yarn build'
create-redwood-app: $ nodemon --ignore dist --exec 'yarn build'
@redwoodjs/eslint-plugin-redwood: $ nodemon --ignore dist --exec 'yarn build'
```

### Installing local Redwood in your app

While you'll be making most of your changes in the Redwood Framework, you'll probably want to see your changes "running live" in one of your own Redwood Apps or in one of our example apps.

We offer two workflows for making this possible. **How to choose which one to use?**

If you've installed or upgraded a dependency, use the "[local package registry emulation](#local-package-registry-emulation)" workflow; otherwise, use "[copy on source change](#copy-on-source-change)".

> Both workflows use `redwood-tools` (alias `rwt`), Redwood's companion CLI development tool, which is included in `@redwoodjs/core`.

#### Copy on source change

> Note for Windows users: there is an ongoing issue with `yarn rwt copy:watch`, more details available in [#701](https://github.com/redwoodjs/redwood/issues/701).

You can make Redwood watch changes in the source code to trigger build automatically:

```terminal
cd redwood-app
yarn rwt copy:watch ../path/to/redwood
```

Now any changes made in the framework will be copied into your app!

#### Local package registry emulation

Sometimes you'll want to test the full package-development workflow: building, publishing, and installing in your Redwood App. We facilitate this using a local NPM registry called [Verdaccio](https://github.com/verdaccio/verdaccio).

First, install Verdaccio:

```terminal
yarn global add verdaccio
```

Then, in your local copy of the Redwood Framework, run:

```terminal
./tasks/run-local-npm
```

This starts Verdaccio (http://localhost:4873) with our configuration file.

> Note for Windows users: you will need to use WSL 2 for the above to work.

##### Publishing a package

To push all the Redwood's core packages to your local NPM registry run:

```terminal
./tasks/publish-local
```

Which is equivalent to running:

```terminal
npm unpublish --tag dev --registry http://localhost:4873/ --force
npm publish --tag dev --registry http://localhost:4873/ --force
```

You can also publish a specific package by passing the package path to `publish-local`:

```terminal
./tasks/publish-local ./packages/api
```

##### Installing published packages in your app

The last step is to install the package into your Redwood App. If you want to install multiple packages you need to do this one by one.

```terminal
cd redwood-app
yarn rwt install @redwoodjs/dev-server
```

Which is equivalent to running:

```terminal
rm -rf ./node_modules/@redwoodjs/dev-server
yarn upgrade @redwoodjs/dev-server@dev --no-lockfile --registry http://localhost:4873/
```

## Running your Redwood app

When developing Redwood Apps, you’re probably used to running both the API and Web servers with `yarn rw dev` and seeing your changes included immediately.
But for local package development, your changes won’t be included automatically--you'll need to manually stop/start the respective server to include them.

In this case you might find it more convenient to run the servers for each of the yarn workspaces independently:

```terminal
yarn rw dev api
yarn rw dev web
```

## Integration tests

We're using Cypress to test the steps that we recommend in the tutorial. To run the command by doing the following:
```terminal
yarn build
./tasks/test-tutorial
```

This tests against the built packages in Redwood, it uses the base project in `__fixtures/new-project`, so any modifications to that project will also be reflected in the Cypress tests.
If you would like to test against the packages specified in `/__fixtures__/new-project` you can start it with the following:
```terminal
./tasks/test-tutorial --no-local
```

## Releases

To publish a new version of Redwood to NPM run the following commands:

```bash
yarn lerna version --force-publish
yarn lerna publish from-package
```

The changes the version of **all the packages** (even those that haven't changed) and publishes it to NPM.

### Troubleshooting

If something went wrong you can use `yarn lerna publish from-package` to publish the packages that aren't already in the registry.

## CLI Reference: `redwood-tools` (alias `rwt`)

This CLI Reference section covers the `redwood-tools` command options:

```
yarn rwt <command>
```

For `redwood` options, see the [CLI Reference on redwoodjs.com](https://redwoodjs.com/reference/command-line-interface).

##### Specifying a RW_PATH

You can create a `RW_PATH` environment variable so you don't have to pass the path explicitely each time you run a command.

Add the following line to your `~/.bashrc`:

```terminal
export RW_PATH="$HOME/path/to/redwood/framework"
```

With the above you can run:

```terminal
yarn rwt copy:watch
```

### copy (`cp`)

Copy the Redwood Framework path to this project.

```terminal
yarn rwt cp [RW_PATH]
```

You can avoid having to provide `RW_PATH` by defining an environment variable on your system. See [Specifying a RW_PATH](https://github.com/redwoodjs/redwood/blob/main/CONTRIBUTING.md#specifying-a-rw_path).

### copy:watch (`cpw`)

Watch the Redwood Framework path for changes and copy them over to this project.

```terminal
yarn rwt cpw [RW_PATH]
```

You can avoid having to provide `RW_PATH` by defining an environment variable on your system. See [Specifying a RW_PATH](https://github.com/redwoodjs/redwood/blob/main/CONTRIBUTING.md#specifying-a-rw_path).

### fix-bins (`fix`)

Fix Redwood symlinks and permissions.

```terminal
yarn rwt fix
```

The Redwood CLI has the following binaries:

- `redwood`
- `rw`
- `redwood-tools`
- `rwt`
- `dev-server`

When you're contributing, the permissions of these binaries can sometimes get mixed up. This makes them executable again.

### install (`i`)

Install a package from your local NPM registry.

```terminal
yarn rwt i <packageName>
```

You'll use this command if you're testing the full package-development workflow. See [Local Package Registry Emulation](https://github.com/redwoodjs/redwood/blob/main/CONTRIBUTING.md#local-package-registry-emulation).
