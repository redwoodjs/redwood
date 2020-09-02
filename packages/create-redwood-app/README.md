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

After making changes to `create-redwood-app.js`:

```
node -r esm ./redwood/packages/create-redwood-app/src/create-redwood-app.js ../path/to/new-project`
```

If running from within the current redwood source directory, be sure your target app path is outside.

Note: Assumes that

```
npm install --save esm
```