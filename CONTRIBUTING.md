# Contributing

Love Redwood and want to get involved? You’re in the right place!

Before interacting with the Redwood community, please read and understand our [Code of Conduct](https://github.com/redwoodjs/redwood/blob/main/CODE_OF_CONDUCT.md).

**Table of Contents**

- [Contributing](#contributing)
  - [Local Development](#local-development)
    - [Installing Dependencies](#installing-dependencies)
    - [yarn rwt link](#yarn-rwt-link)
    - [Copy and Watch](#copy-and-watch)
      - [Specifying a RW_PATH](#specifying-a-rw_path)
    - [Local Package Registry Emulation](#local-package-registry-emulation)
      - [Running a Local NPM Registry](#running-a-local-npm-registry)
      - [Publishing a Package](#publishing-a-package)
      - [Installing Published Packages in Your Redwood App](#installing-published-packages-in-your-redwood-app)
  - [Running Your Redwood App's Local Server(s)](#running-your-redwood-apps-local-servers)
  - [Integration tests](#integration-tests)
  - [Releases](#releases)
    - [Troubleshooting](#troubleshooting)
  - [CLI Reference: `redwood-tools`](#cli-reference-redwood-tools)
    - [redwood-tools (rwt)](#redwood-tools-rwt)
    - [copy (cp)](#copy-cp)
    - [copy:watch (cpw)](#copywatch-cpw)
    - [fix-bins (fix)](#fix-bins-fix)
    - [install (i)](#install-i)

## Local Development

As a Redwood user, you're already familiar with the codebase `yarn create redwood-app` creates.
Here we'll call this codebase a "Redwood App"&mdash;it’s the fullstack-to-Jamstack solution you already know and love.

As a contributor, you'll have to gain familiarity with one more codebase: the Redwood Framework.
The Redwood Framework lives in the monorepo redwoodjs/redwood (which is where you're probably reading this); it contains all the packages that make Redwood Apps work the way they do.
After you use `git clone` to make a local copy, this is where you'll be making most of your changes.

You'll probably want to see your changes to your local copy of the Redwood Framework "running live" in one of your own Redwood Apps or in one of our example apps.
Since we're always looking for ways to make contributing to Redwood easier, there's a few workflows we've come up with, but the one you'll want to use is `yarn rwt link`. You can fall back on any of the others if that one doesn't work, but once you've tried `yarn rwt link`, you won't want to.

> **I've used `yarn rw` before, but what's `yarn rwt`?**
>
> All workflows use `redwood-tools` (`rwt`), Redwood's companion CLI development tool.

All right, let's go through the entire contributor workflow, from Redwood Framework to Redwood App.

### Installing Dependencies

First, in your local copy of the Redwood Framework, make sure you've got the `main` branch's latest changes (via a `git pull`), then run `yarn install` in the root directory to install all the dependencies.

```terminal
cd redwood
yarn install
```

Then, in your Redwood App, which you've either just created using `yarn create redwood-app` or already had lying around, you'll want to upgrade to the canary&mdash;Redwood's bleeding edge&mdash;just so you can be sure you're testing your contribution with all the most recent changes:

```terminal
cd redwood-app # wherever your redwood-app happens to be, whether it's one of our templates or your own
yarn rw upgrade -t canary
```

### yarn rwt link

Ok, now that everything's up to date, in your Redwood App, run:

```bash
yarn rwt link [RW_PATH]
```

where [RW_PATH] is the path to your local copy of the Redwood Framework. For example,

```
yarn rwt link ~/redwood
```

> You can set an env var so that you don't have to specify this. See [Specifying a `RW_PATH`](#specifying-a-rw_path).

You'll be prompted to add the redwood workspace to your Redwood App; go ahead and say yes.

Then you'll start seeing a ton of output&mdash;`yarn rwt link` is building the Redwood Framework, watching it for changes, and copying all that over into the redwood workspace in your Redwood App. Your Redwood App isn't using the packages in `node_modules/@redwoodjs` anymore, but the packages in this workspace, with your local changes. You can even install packages or upgrade dependencies&mdash;it's really that simple.

When you're done, make sure to `unlink` your Redwood App:

```
yarn rwt unlink
```

This'll restore your Redwood App to it's original state, reverting it to the version of Redwood that it orignally had installed. Next time you want to contribute, just run `yarn rwt link` again!

### Copy and Watch

`yarn rwt link` not working for you? That's ok&mdash;we have a few legacy contributing workflows that you can fall back on.

After you've [installed all your dependencies](#installing-dependencies), you'll want to build-and-watch files in the Redwood Framework for changes:

```terminal
cd redwood
yarn build:watch

@redwoodjs/api: $ nodemon --watch src -e ts,js --ignore dist --exec 'yarn build'
@redwoodjs/core: $ nodemon --ignore dist --exec 'yarn build'
create-redwood-app: $ nodemon --ignore dist --exec 'yarn build'
@redwoodjs/eslint-plugin-redwood: $ nodemon --ignore dist --exec 'yarn build'
```

Then, copy-and-watch those changes into your Redwood App or example app (here, [example-invoice](https://github.com/redwoodjs/example-invoice)):

> Wait! Are you on Windows (and not using WSL)? If so, you most likely first have to [install rsync](https://tlundberg.com/blog/2020-06-15/installing-rsync-on-windows/). Also, unfortunately you can't use "copy and watch". You'll have to manually run `yarn rwt cp ../path/to/redwood` when you've made changes to the Redwood Framework (this is tracked in [issue #701](https://github.com/redwoodjs/redwood/issues/701)).

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

Sometimes you'll want to test the full package-development workflow: building, publishing, and installing all the packages in your local copy of the Redwood Framework in your Redwood App. We accomodate this using a local NPM registry called [Verdaccio](https://github.com/verdaccio/verdaccio).

You might also have to use this workflow if you've installed or upgraded one of Redwood's dependencies.

#### Running a Local NPM Registry

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

> This script is equivalent to running:
>
> ```terminal
> npm unpublish --tag dev --registry http://localhost:4873/ --force
> npm publish --tag dev --registry http://localhost:4873/ --force
> ```

Note that you can build a particular package by specifying the path to the package: `./tasks/publish-local ./packages/api`. For example, if you've made changes to the `@redwoodjs/dev-server` package, you would run:

```terminal
./tasks/publish-local ./packages/dev-server
```

#### Installing Published Packages in Your Redwood App

The last step is to install the package into your Redwood App.

```terminal
yarn rwt install @redwoodjs/dev-server
```

> This is equivalent to running:
>
> ```terminal
> rm -rf <APP_PATH>/node_modules/@redwoodjs/dev-server
> yarn upgrade @redwoodjs/dev-server@dev --no-lockfile --registry http://localhost:4873/
> ```

## Running Your Redwood App's Local Server(s)

When developing Redwood Apps, you’re probably used to running both the API and Web servers with `yarn rw dev` and seeing your changes included immediately.
But for local package development, your changes won’t be included automatically&mdash;you'll need to manually stop/start the respective server to include them.

In this case you might find it more convenient to run the servers for each of the yarn workspaces independently:

```terminal
yarn rw dev api
yarn rw dev web
```

## Integration tests

We're using Cypress to test the steps that we recommend in the tutorial. Run the command by doing the following:

```terminal
yarn build
./tasks/test-tutorial
```

This creates a new project in a tmp directory using `yarn create redwood-app ...` Once installed, it then upgrades the project to the most recent `canary` release, which means it will use the current code in the `main` branch. Once the upgrade is complete (and successful), it will start Cypress for the E2E tests.


```terminal
./tasks/test-tutorial /path/to/app
```

Use this `path/to/app` option to run the same Cypress E2E tests against a local project. In this case, the command will _not_ upgrade the project to the `canary` release — it will use the project's installed packages. Chose this option if you have modified code (and packages) you want to test locally.


> Windows Not Supported: The command for this is written in bash and will not work on Windows.

## Releases

To publish a new version of Redwood to NPM run the following commands:

> NOTE: `<version>` should be formatted `v0.24.0` (for example)

```bash
git clean -dfx
yarn install
./tasks/update-package-versions <version>
git commit -am "<version>"
git tag <version>
git push && git push --tags
yarn build
yarn lerna publish from-package
```

This 1) changes the version of **all the packages** (even those that haven't changed), 2) changes the version of the packages within the CRWA Template, 3) Commits, Tags, and Pushes to GH, and 4) publishes all packages to NPM.

### Troubleshooting

If something went wrong you can use `yarn lerna publish from-package` to publish the packages that aren't already in the registry.

## CLI Reference: `redwood-tools`

This CLI Reference section covers the `redwood-tools` command options. For `redwood` options, see the [CLI Reference on redwoodjs.com](https://redwoodjs.com/reference/command-line-interface).

### redwood-tools (rwt)

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

### copy (cp)

Copy the Redwood Framework path to this project.

```terminal
yarn rwt cp [RW_PATH]
```

You can avoid having to provide `RW_PATH` by defining an environment variable on your system. See [Specifying a RW_PATH](https://github.com/redwoodjs/redwood/blob/main/CONTRIBUTING.md#specifying-a-rw_path).

### copy:watch (cpw)

Watch the Redwood Framework path for changes and copy them over to this project.

```terminal
yarn rwt cpw [RW_PATH]
```

You can avoid having to provide `RW_PATH` by defining an environment variable on your system. See [Specifying a RW_PATH](https://github.com/redwoodjs/redwood/blob/main/CONTRIBUTING.md#specifying-a-rw_path).

### fix-bins (fix)

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

### install (i)

Install a package from your local NPM registry.

```terminal
yarn rwt i <packageName>
```

You'll use this command if you're testing the full package-development workflow. See [Local Package Registry Emulation](https://github.com/redwoodjs/redwood/blob/main/CONTRIBUTING.md#local-package-registry-emulation).
