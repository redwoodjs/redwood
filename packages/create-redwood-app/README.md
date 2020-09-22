# create-redwood-app

<!-- toc -->
- [Purpose and Vision](#Purpose-and-Vision)
- [Package Lead](#Package-Lead)
- [Roadmap](#Roadmap)
- [Contributing](#Contributing)
- [FAQ](#FAQ)

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

Install [`esm`](https://www.npmjs.com/package/esm);

```bash
yarn workspace add --dev create-redwood-app
```

After making changes to `create-redwood-app.js`, do one of the following;

```bash
# Run and install yarn dependencies
node -r esm ./packages/create-redwood-app/src/create-redwood-app.js ../create-redwood-app-test

# Run without installing yarn dependencies
node -r esm ./packages/create-redwood-app/src/create-redwood-app.js --no-yarn-install ../create-redwood-app-test

# For the lazy; forcefully delete ../create-redwood-app-test and then run without installing yarn dependencies
rm -rf ../create-redwood-app-test && node -r esm ./packages/create-redwood-app/src/create-redwood-app.js --no-yarn-install ../create-redwood-app-test
```

_Note: In above example we are creating the app in the parent directory in folder `create-redwood-app-test`._
