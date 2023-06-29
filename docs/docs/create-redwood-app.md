---
slug: create-redwood-app
description:
---

# Create Redwood App

To get up and running with Redwood, you can use the Create Redwood App:

```terminal
yarn create redwood-app <your-app-name>
```

## Set up for success
Redwood requires that you're running Node version 18.0.0 or higher.

If you're running Node version 19.0.0 or above, you can still use Create Redwood app, but it may make your project incompatible with some deploy targets, such as AWS Lambdas.

To see what version of Node you're running, you can run the following command in your terminal:

```terminal
node -v
```

If you need to update your version of Node or run multiple versions of Node, we recommend installing nvm and have [documentation about how to get up and running.](/docs/how-to/using-nvm)

You also need to have yarn version 1.15 or higher installed. To see what version of yarn you're running, you can run the following command in your terminal:

```terminal
yarn -v
```

To upgrade your version of yarn, [you can refer to the yarn documentation](https://yarnpkg.com/getting-started/install).

## What you can expect

### Select your preferred language
Options: TypeScript or JavaScript

If you choose JavaScript, you can always [add TypeScript later](/docs/typescript/introduction#converting-a-javascript-project-to-typescript).

### Do you want to initialize a git repo?
Options: yes (default) or no

If you mark "yes", then it will ask you to **Enter a commit message**. The default is message is "Initial commit."

You can always initialize a git repo later and add a commit message by running the following commands in your terminal:

```terminal
git init
git add .
git commit -m "Initial commit"
```

If you're new to git, Amy Dutton has a great playlist on YouTube: [git for Beginners](https://www.youtube.com/playlist?list=PLrz61zkUHJJFmfTgOVL1mBw_NZcgGe882)

### Do you want to run `yarn install`?
Options: yes (default) or no

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
yarn install
yarn rw dev
```

- This will start your development server at `http://localhost:8910`.
- Your API will be available at `http://localhost:8911`.
- You can visit the Redwood GraphQL Playground at `http://localhost:8911/graphql`.

## Flags
You can by pass these prompts by using the following flags:

| Flag | What it does |
| --- | --- |
| `--yarn-install` | Run `yarn install` |
| `--typescript` | Set TypeScript as the preferred language (default to JavaScript) |
| `--overwrite` | What it does |
| `--git-init` | Initializes a git repository |
| `--commit-message "Initial commit"` | Specifies the initial git commit message |

For example, here's the project with all flags enabled:

```terminal
yarn create redwood-app <your-app-name> --typescript --git-init --commit-message "Initial commit" --yarn-install
```


