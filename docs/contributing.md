# Setup and Process Overview

_Future Intro Here: ...something something... play nice._

**Table of Contents**
- [Local Package Development](##Local-Package-Development-Setup)
- [CLI Package Development](##CLI-Package-Development)

<!-- toc -->

## Local Package Development Setup

You'll want to run a local redwood app sandbox using your local @redwoodjs packages instead of the current releases from the package registry. To do this we use [`yarn link`](`https://classic.yarnpkg.com/en/docs/cli/link/).

### Example Setup: Package `@redwoodjs/cli` Local Dev

Assuming you've already cloned `redwoodjs/redwood` locally and run `yarn install`, navigate to the `packages/cli` directory and run the following command:

```
yarn link
```

You should see a message `success Registered "@redwoodjs/cli"`.

If you haven't created a local redwood app for testing, first run `yarn create redwood-app [app-name]` and then run `yarn` from the app's root directory. Still in the root directory of the app, run the following:

```
yarn link @redwoodjs/cli
```

> You can link as many packages as needed at a time. Note: although some packages include others, e.g. /scripts uses /cli as a dependency, you'll still need to link packages individually.

You should see a success message and can confirm the symlink was created by viewing the `/node_modules/@redwoodjs` directory from your editor or via command line `$ ls -l node_modules/@redwoodjs`

> HEADS UP: it's easy to forget you're using linked local packages in your sandbox app instead of those published to the package registry. You'll need to manually `git pull` upstream changes to packages.

### `Yarn Build:Watch`

As you make changes to a package (in this example `packages/cli`), you'll need to publish locally so the updates are included in your sandbox app. You can manually publish using `yarn build`. But it's more convenient to have the package re-publish each time you make a change. Run the following from the root of the package you're developing, `packages/cli` in this example:

```
yarn build:watch
```

### Unlinking Packages

Lastly, to reverse the process and remove the links, work backwords using `yarn unlink`. Starting first from the local redwood sandbox app root

```
yarn unlink @redwoodjs/cli
yarn install --force
```

_The latter command reinstalls the current published package._

Then from the package directory `/redwoodjs/redwood/packages/cli` of your local clone, run:

```
yarn unlink
yarn install --force
```

### Running the Local Server(s)

You can run both the API and Web servers with a single command:

```
yarn rw dev
```

However, for local package development, you'll need to manually stop/start the respective server to include changes. In this case you can run the servers for each of the yarn workspaces independently:

```
yarn rw dev api
yarn rw dev web
```

## CLI Package Development
We are using [Yargs](https://yargs.js.org/)
_Historical note: originally implemented in react-ink (too slow!) then converted._

### Example
Example dev command:

```
export const command = 'dev [app..]'
export const desc = 'Run development servers.'
export const builder = {
  app: { choices: ['db', 'api', 'web'], default: ['db', 'api', 'web'] },
}
export const handler = ({ app }) => {
   // do stuff...
}
```

Yargs creates a nice interface, coerces the args, and runs the handler.
