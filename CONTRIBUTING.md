# Contributing

Love Redwood and want to get involved? You’re in the right place!

Before interacting with the Redwood community, please read and understand our [Code of Conduct](https://github.com/redwoodjs/redwood/blob/main/CODE_OF_CONDUCT.md).

**Table of Contents**

  - [Code Organization](#code-organization)
  - [Local Setup](#local-setup)
    - [Redwood Framework](#redwood-framework)
    - [Redwood Project: Create a Functional Test Project](#redwood-project-create-a-functional-test-project)
    - [Testing the Framework in Your Project](#testing-the-framework-in-your-project)
    - [Testing the CLI in Your Project](#testing-the-cli-in-your-project)
  - [Browser-based Setup](#browser-based-setup)
  - [Integration Tests](#integration-tests)
  - [Releases](#releases)
    - [Troubleshooting](#troubleshooting)

## Code Organization

As a Redwood user, you're already familiar with the codebase created by `yarn create redwood-app`. In this document, we'll refer to that codebase as a Redwood Project.

As a contributor, you'll have to familiarize yourself with one more codebase: the Redwood Framework. The Redwood Framework lives in the monorepo [redwoodjs/redwood](https://github.com/redwoodjs/redwood) (which is where you're probably reading this). It contains all the packages that make Redwood Projects work the way they do. In a Redwood Project, you can find the Redwood Framework in `node_modules/@redwoodjs`.

Here we'll assume your local copy of the Redwood Framework is in a directory called `redwood` and your Redwood Project is in a directory called `redwood-project`.

Chances are that you'll have more than a few VS Codes open when you're contributing—one with the Redwood Framework and one with a Redwood Project at least. An easy way to tell which-is-which is by looking for a red bar at the bottom. The one with a red bar is the Redwood Framework:

![image](https://user-images.githubusercontent.com/32992335/130697522-313317f8-21e5-4f71-8b8e-9690dbad412a.png)

## Local Setup

### Redwood Framework

Use `git clone` to get a local copy of the Redwood Framework. If you've already got a local copy, make sure you've got the `main` branch's latest changes using `git pull`. Then run `yarn install` in the root directory to install the dependencies:

```terminal
git clone https://github.com/redwoodjs/redwood.git
cd redwood
yarn install
```

### Redwood Project: Create a Functional Test Project

You'll almost always want to test the functionality of your changes to the Redwood Framework in a Redwood Project. When it comes to getting a Redwood Project to test your changes out in, you have several options:

- run `yarn create redwood-app ./redwood-project`
- `git clone` the [RedwoodJS Tutorial Blog](https://github.com/redwoodjs/redwood-tutorial)
- use a project you've already created
- run `yarn run build:test-project <project path>` from the root of your local copy of the Redwood Framework to create a functional test project 👀

**Using the functional test project might be the fastest and easiest way to test your changes.** You can create a Redwood Project that contains a lot of functionality in just a few minutes. For example, here's a brief overview of all the things `yarn run build:test-project <project directory>` does. It...

1. installs using the `create-redwood-app` template in the current branch of your Redwood Framework
2. with the current `canary` version of Redwood Packages (with the option to use the `latest` stable version)
3. with a JavaScript language target (with the option for TypeScript)
4. then applies code mods from the [Redwood tutorial](https://learn.redwoodjs.com/docs/tutorial/welcome-to-redwood/) to add functionality and styling
5. and initializes a Prisma DB migration for SQLite

Unless you've already got a project with a lot of functionality, it'd take quite some to add all of this yourself. Moreover, testing your changes in a project that has a lot of functionality will increase your confidence in the changes you're making.

But how do you actually test your changes in the Redwood Framework in your Redwood Project? With another command, this time in the root of your Redwood Project: `yarn rwfw`.

> Besides `<project directory>`, `build:test-project` takes a few other options as well:
>
> | Arguments & Options   | Description                                                        |
> |-----------------------|--------------------------------------------------------------------|
> | `<project directory>` | Directory to build test project [default: "./blog-test-project"]   |
> | `--typescript, --ts`  | Generate a TypeScript project [default: JavaScript]                |
> | `--canary`            | Upgrade project to latest canary version [default: true]           |
> | `--help `             | Show help                                                          |
>
> **Example:**
> ```terminal
> cd redwood/
> yarn run build:test-project ~/my-repos/redwood-project --typescript --canary
> ```

### Testing the Framework in Your Project

As you make changes to the Redwood Framework, you'll want to see your changes reflected "live" in a Redwood Project. Since we're always looking for ways to make contributing to Redwood easier, there are a few workflows we've come up with. The one you'll want to use is `yarn rwfw`.

> `rwfw` is short for Redwood Framework.

Navigate to your Redwood Project and run `RWFW_PATH=<framework directory> yarn rwfw project:sync`:

```terminal
cd redwood-project
RWFW_PATH=~/redwood yarn rwfw project:sync
```

Where <framework directory> is the path to your local copy of the Redwood Framework. Once provided to `rwfw`, it'll remember it and you shouldn't have to provide it again unless you move it.

As `project:sync` starts up, it'll start logging to the console. In order, it:

<!-- Markdown numbers for us automatically -->
1. cleans and builds the framework
1. copies the framework's dependencies to your project
1. runs `yarn install` in your project
1. copies over the framework's packages to your project
1. waits for changes

Step two is the only explicit change you'll see to your project. You'll see that a ton of packages have been added to your project's root `package.json`:

![image](https://user-images.githubusercontent.com/32992335/130699570-6ceb91a6-58aa-4cbf-a080-9cee6f26aaf2.png)

This is all the packages in the Redwood Framework. It's a lot! But don't worry, this'll be cleaned up when you exit the `yarn rwfw project:sync` command.

Congratulations, you're all setup! Any changes you make in the Redwood Framework should be reflected in your Redwood Project.

> You may have to restart the dev server...

### Testing the CLI in Your Project

While you can test the CLI using `yarn rwfw`, there's an easier way.

If you've made build or design time changes to RedwoodJS—that is, if you've modified one of the following packages:

- api-server
- cli
- core
- eslint-config
- internal
- prerender
- structure
- testing

—you can run a development version of the CLI directly from your local copy of the Redwood Framework. You don't even have to sync any dependencies or files!

> For all the packages above, the entry point is the CLI. They're what we consider "build time" and "design time" packages, rather than "run-time" packages (which are web, auth, api, and forms).

To do that, use the `--cwd` option to set the current working directory to your Redwood Project:

```terminal
cd redwood
yarn build
cd packages/cli
yarn dev --cwd <project directory>
```

`yarn dev` runs the CLI and `--cwd` makes the command run in your Redwood Project. If you make a change to the code, remember to rebuild the packages!

> Tip: You can use `yarn build:watch` to automatically build the framework whilst you're making changes.
>
> Tip 2: --cwd is optional, it will reference the `__fixtures__/example-todo-main` project in the framework.

## Browser-based Setup

You can use the button below to start a development environment in the cloud and access it through your browser!

This generates a functional test project and links it with the Redwood Framework code in `main`, giving you an easy playground to try out your fixes and contributions.

> Note: if you make changes to the framework, you will need to run `yarn rwfw project:sync` in the terminal, so that your changes are watched and reflected in the test project

[![Open in Gitpod](https://gitpod.io/button/open-in-gitpod.svg)](https://gitpod.io/#https://github.com/redwoodjs/redwood)

## Integration Tests

We use Cypress to test the steps in the [tutorial](https://learn.redwoodjs.com/docs/tutorial/welcome-to-redwood/). You can run this end-to-end (e2e) test locally by running the following in your local copy of the Redwood Framework:

```terminal
./tasks/run-e2e
```

This creates a new project using `yarn create redwood-app` in a temporary directory. Once created, it upgrades the project to the most-recent `canary` release, which means it'll use the code that's in the `main` branch. Once upgraded, it starts Cypress.

If you want to run any of the integration tests against an existing project instead of creating a new one, just provide the path to the project:

```terminal
./tasks/run-e2e <project directory>
```

In this case, the command will _not_ upgrade the project to the most-recent `canary` release.

> **Windows Not Supported:** The command for this is written in bash and will not work on Windows.

## Releases

To publish a new version of Redwood to NPM, run the following commands:

> NOTE: `<version>` should be formatted `v0.24.0` (for example)

```bash
git clean -dfx
yarn install
./tasks/update-package-versions <version>
git commit -am "<version>"
git tag -am <version> "<version>"
git push && git push --tags
yarn build
yarn framework lerna publish from-package
```

This...
  1) changes the version of **all the packages** (even those that haven't changed),
  2) changes the version of the packages within the CRWA Template
  3) Commits, Tags, and Pushes to GH
  4) and finally publishes all packages to NPM.

### Troubleshooting

If something went wrong you can use `yarn lerna publish from-package` to publish the packages that aren't already in the registry.
