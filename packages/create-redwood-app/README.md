INTRO
Will be visible on NPM at https://www.npmjs.com/package/create-redwood-app
Note: open graph doesn't play nice with markup it seems

- [ ] Add RedwoodJS one-line description
- [ ] Add getting started: use `yarn create ...`
- [ ] quick links to website + tutorial and help

EXISTING
- [ ] Audit and complete or remove existing sections

# create-redwood-app

<!-- toc -->
- [create-redwood-app](#create-redwood-app)
  - [Purpose and Vision](#purpose-and-vision)
  - [Package Lead](#package-lead)
  - [Roadmap](#roadmap)
  - [Contributing](#contributing)
  - [FAQ](#faq)
    - [How to run create redwood-app script locally](#how-to-run-create-redwood-app-script-locally)

## Purpose and Vision

Summarise the project's values, purpose, and aspirational vision.

## Package Lead

Identify the decision maker and/or go-to for questions.

## Roadmap

Similar to Purpose and Vision, but more concrete, comprising near-term priorities and long-term goals.

## Contributing

Explains how to contribute by addressing the following three points:

1) Core technologies a contributor should be a familiar with.
2) How this package fits into the Redwood Framework, if it depends on other Redwood packages, etc.
3) The structure of the package and/or an explanation of its contents.

## FAQ

### How to run create redwood-app script locally

Step into the `create-redwood-app` package:

```bash
cd packages/create-redwood-app
```

Watch for changes to the package:

```bash
yarn build:watch
```

In a new terminal, when you make a change to e.g. `create-redwood-app.js`, run it:

```bash
# Run and install yarn dependencies
node ./dist/create-redwood-app.js /path/to/new/redwood-app

# Run without installing yarn dependencies
node ./dist/create-redwood-app.js --no-yarn-install /path/to/new/redwood-app
```
