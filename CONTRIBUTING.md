# Contributing

Love Redwood and want to get involved? You’re in the right place!

Before interacting with the Redwood community, please read and understand our [Code of Conduct](https://github.com/redwoodjs/redwood/blob/master/CODE_OF_CONDUCT.md).

**Table of Contents**

- [Local Development](#local-development)
  - [Copy and Watch](#copy-and-watch)
    - [Specifying a RW_PATH](#specifying-a-rwpath)
  - [Local Package Registry Emulation](#local-package-registry-emulation)
    - [Setting Up and Running a Local NPM Registry](#setting-up-and-running-a-local-npm-registry)
    - [Publishing a Package](#publishing-a-package)
    - [Installing Published Packages in Your Redwood App](#installing-published-packages-in-your-redwood-app)
- [Running Your Redwood App's Local Server(s)](#running-your-redwood-apps-local-servers)
- [Releases](#releases)
  - [Troubleshooting](#troubleshooting)
- [CLI Reference: redwood-tools](#cli-reference-redwood-tools)
  - [redwood-tools (alias rwt)](#redwood-tools-alias-rwt)
  - [copy (alias cp)](#copy-alias-cp)
  - [copy:watch (alias cpw)](#copywatch-alias-cpw)
  - [fix-bins (alias fix)](#fix-bins-alias-fix)
  - [install (alias i)](#install-alias-i)

## Local Development

As a Redwood user, you're already familiar with the codebase `yarn create redwood-app` creates.
Here we'll call this codebase a "Redwood App"--it’s the fullstack-to-Jamstack solution you already know and love.

As a contributor, you'll have to gain familiarity with one more codebase: the Redwood Framework.
The Redwood Framework lives in the monorepo redwoodjs/redwood; it contains all the packages that make Redwood Apps work the way they do.

While you'll be making most of your changes in the Redwood Framework, you'll probably want to see your changes “running live" in one of your own Redwood Apps or in one of our example apps.
We offer two workflows for making this possible: "copy and watch", which has some restrictions, and "local package registry emulation", which doesn't.

**How to choose which one to use?** If you've installed or upgraded a dependency, use the "local package registry emulation" workflow; otherwise, use "copy and watch".

> Both workflows use `redwood-tools` (alias `rwt`), Redwood's companion CLI development tool.

### Copy and Watch

> Are you on Windows? If so, you most likely first have to [install rsync](https://tlundberg.com/blog/2020-06-15/installing-rsync-on-windows/). Also, unfortunately you can't use "copy and watch". You'll have to manually run `yarn rwt cp ../path/to/redwood` when you've made changes to the Redwood Framework (this is tracked in [issue #701](https://github.com/redwoodjs/redwood/issues/701)).

First, build-and-watch files in the Redwood Framework for changes:

```terminal
cd redwood
yarn build:watch

@redwoodjs/api: $ nodemon --watch src -e ts,js --ignore dist --exec 'yarn build'
@redwoodjs/core: $ nodemon --ignore dist --exec 'yarn build'
create-redwood-app: $ nodemon --ignore dist --exec 'yarn build'
@redwoodjs/eslint-plugin-redwood: $ nodemon --ignore dist --exec 'yarn build'
```

Then, copy-and-watch those changes into your Redwood App or example app (here, [example-invoice](https://github.com/redwoodjs/example-invoice)):

```terminal
cd example-invoice
yarn rwt copy:watch ../path/to/redwood

Redwood Framework Path:  /Users/peterp/Personal/redwoodjs/redwood
Trigger event:  add
building file list ... done
```

Now any changes made in the framework will be copied into your app!

#### Specifying a RW_PATH

You can create a `RW_PATH` environment variable so you don't have to specify the path in the `copy:watch` command.

_On Linux_

Add the following line to your `~/.bashrc`:

```terminal
export RW_PATH=”$HOME/path/to/redwood/framework”
```

Where /path/to/redwood/framework is replaced by the path to your local copy of the Redwood Framework.

Then, in your Redwood App or example app, you can just run:

```terminal
yarn rwt copy:watch
```

And see your changes copied!

_On Mac_

Add the following line to your `~/.bash_profile`:

```terminal
export RW_PATH=”$HOME/path/to/redwood/framework”
```

Where /path/to/redwood/framework is replaced by the path to your local copy of the Redwood Framework.

Then, in your Redwood App or example app, you can just run:

```terminal
yarn rwt copy:watch
```

And see your changes copied!

_On Windows_
[Todo: please contribute a PR if you can help add instructions here.]

### Local Package Registry Emulation

Sometimes you'll want to test the full package-development workflow: building, publishing, and installing in your Redwood App. We facilitate this using a local NPM registry called [Verdaccio](https://github.com/verdaccio/verdaccio).

#### Setting Up and Running a Local NPM Registry

First, install Verdaccio:

```terminal
yarn global add verdaccio
```

Then, in your local copy of the Redwood Framework, run:

```terminal
./tasks/run-local-npm
```

This starts Verdaccio (http://localhost:4873) with our configuration file.

#### Publishing a Package

To build, unpublish, and publish all the Redwood packages to your local NPM registry with a "dev" tag, run:

```terminal
./tasks/publish-local
```

> Note: this script is equivalent to running:
>
> ```terminal
> npm unpublish --tag dev --registry http://localhost:4873/ --force
> npm publish --tag dev --registry http://localhost:4873/ --force
> ```

You can build a particular package by specifying the path to the package: `./tasks/publish-local ./packages/api`.

For example, if you've made changes to the `@redwoodjs/dev-server` package, you would run:

```terminal
./tasks/publish-local ./packages/dev-server
```

#### Installing Published Packages in Your Redwood App

The last step is to install the package into your Redwood App. The CLI command `redwood-tools` (alias `rwt`) makes installing local NPM packages easy:

```terminal
yarn rwt install @redwoodjs/dev-server
```

> Note: this is equivalent to running:
>
> ```terminal
> rm -rf <APP_PATH>/node_modules/@redwoodjs/dev-server
> yarn upgrade @redwoodjs/dev-server@dev --no-lockfile --registry http://localhost:4873/
> ```

## Running Your Redwood App's Local Server(s)

When developing Redwood Apps, you’re probably used to running both the API and Web servers with `yarn rw dev` and seeing your changes included immediately.
But for local package development, your changes won’t be included automatically--you'll need to manually stop/start the respective server to include them.

In this case you might find it more convenient to run the servers for each of the yarn workspaces independently:

```terminal
yarn rw dev api
yarn rw dev web
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

## CLI Reference: `redwood-tools`

This CLI Reference section covers the `redwood-tools` command options. For `redwood` options, see the [CLI Reference on redwoodjs.com](https://redwoodjs.com/reference/command-line-interface).

### redwood-tools (alias rwt)

Redwood's companion CLI development tool. You'll be using this if you're contributing to Redwood.

```
yarn rwt <command>
```

|Command | Description|
|:-|:-|
|`copy` | Copy the Redwood Framework path to this project.|
|`copy:watch` | Watch the Redwood Framework path for changes and copy them over to this project.|
|`fix-bins` | Fix Redwood symlinks and permissions.|
|`install` | Install a package from your local NPM registry.|

### copy (alias cp)

Copy the Redwood Framework path to this project.

```terminal
yarn rwt cp [RW_PATH]
```

You can avoid having to provide `RW_PATH` by defining an environment variable on your system. See [Specifying a RW_PATH](https://github.com/redwoodjs/redwood/blob/master/CONTRIBUTING.md#specifying-a-rw_path).

### copy:watch (alias cpw)

Watch the Redwood Framework path for changes and copy them over to this project.  

```terminal
yarn rwt cpw [RW_PATH]
```

You can avoid having to provide `RW_PATH` by defining an environment variable on your system. See [Specifying a RW_PATH](https://github.com/redwoodjs/redwood/blob/master/CONTRIBUTING.md#specifying-a-rw_path).

### fix-bins (alias fix)

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

### install (alias i)

Install a package from your local NPM registry.

```terminal
yarn rwt i <packageName>
```

You'll use this command if you're testing the full package-development workflow. See [Local Package Registry Emulation](https://github.com/redwoodjs/redwood/blob/master/CONTRIBUTING.md#local-package-registry-emulation).
