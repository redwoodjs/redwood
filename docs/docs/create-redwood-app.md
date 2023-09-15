<!--@@joggrdoc@@-->
<!-- @joggr:version(v1):end -->
<!-- @joggr:warning:start -->
<!-- 
  _   _   _    __        __     _      ____    _   _   ___   _   _    ____     _   _   _ 
 | | | | | |   \ \      / /    / \    |  _ \  | \ | | |_ _| | \ | |  / ___|   | | | | | |
 | | | | | |    \ \ /\ / /    / _ \   | |_) | |  \| |  | |  |  \| | | |  _    | | | | | |
 |_| |_| |_|     \ V  V /    / ___ \  |  _ <  | |\  |  | |  | |\  | | |_| |   |_| |_| |_|
 (_) (_) (_)      \_/\_/    /_/   \_\ |_| \_\ |_| \_| |___| |_| \_|  \____|   (_) (_) (_)
                                                              
This document is managed by Joggr. Editing this document could break Joggr's core features, i.e. our 
ability to auto-maintain this document. Please use the Joggr editor to edit this document 
(link at bottom of the page).
-->
<!-- @joggr:warning:end -->
---
slug: create-redwood-app
description: Instructions and usage examples for Create Redwood App
---

# Create Redwood App

To get up and running with Redwood, you can use Create Redwood App:

```terminal
yarn create redwood-app <your-app-name>
```

## Set up for success
Redwood requires that you're running Node version 18.0.0 or higher.

If you're running Node version 19.0.0 or higher, you can still use Create Redwood App, but it may make your project incompatible with some deploy targets, such as AWS Lambdas.

To see what version of Node you're running, you can run the following command in your terminal:

```terminal
node -v
```

If you need to update your version of Node or run multiple versions of Node, we recommend installing nvm and have [documentation about how to get up and running.](./how-to/using-nvm)

You also need to have yarn version 1.15 or higher installed. To see what version of yarn you're running, you can run the following command in your terminal:

```terminal
yarn -v
```

To upgrade your version of yarn, [you can refer to the yarn documentation](https://yarnpkg.com/getting-started/install).

## What you can expect

### Select your preferred language
Options: TypeScript (default) or JavaScript

If you choose JavaScript, you can always [add TypeScript later](/docs/typescript/introduction#converting-a-javascript-project-to-typescript).

### Do you want to initialize a git repo?
Options: yes (default) or no

If you mark "yes", then it will ask you to **Enter a commit message**. The default message is "Initial commit."

You can always initialize a git repo later and add a commit message by running the following commands in your terminal:

```terminal
cd <your-app-name>
git init
git add .
git commit -m "Initial commit"
```

If you're new to git, here's a recommended playlist on YouTube: [git for Beginners](https://www.youtube.com/playlist?list=PLrz61zkUHJJFmfTgOVL1mBw_NZcgGe882)

### Do you want to run `yarn install`?
Options: yes (default) or no

_NOTE: This prompt will only display if you're running yarn, version 1._

This command will download all of your project's dependencies.

If you mark "no", you can always run this command later:

```terminal
cd <your-app-name>
yarn install
```

## Running the development server

Once the Create Redwood app has finished running, you can start your development server by running the following command:

```terminal
cd <your-app-name>
yarn rw dev
```

- This will start your development server at `http://localhost:8910`.
- Your API will be available at `http://localhost:8911`.
- You can visit the Redwood GraphQL Playground at `http://localhost:8911/graphql`.

## Flags
You can by pass these prompts by using the following flags:

| Flag | Alias | What it does |
| :--- | :--- | :--- |
| `--yarn-install` | | Run `yarn install` |
| `--typescript` | `ts` | Set TypeScript as the preferred language (pass `--no-typescript` to use JavaScript) |
| `--overwrite` | | Overwrites the existing directory, if it has the same name |
| `--git-init` | `git` | Initializes a git repository |
| `--commit-message "Initial commit"` | `m` | Specifies the initial git commit message |
| `--yes` | `y` | Automatically select all defaults |

For example, here's the project with all flags enabled:

```terminal
yarn create redwood-app <your-app-name> --typescript --git-init --commit-message "Initial commit" --yarn-install
```



<!-- @joggr:editLink(df5d0636-f670-4026-9072-7c9ea2e4a075):start -->
---
<a href="https://app.joggr.io/app/documents/df5d0636-f670-4026-9072-7c9ea2e4a075/edit" alt="Edit doc on Joggr">
  <img src="https://storage.googleapis.com/joggr-public-assets/github/badges/edit-document-badge.svg" />
</a>
<!-- @joggr:editLink(df5d0636-f670-4026-9072-7c9ea2e4a075):end -->