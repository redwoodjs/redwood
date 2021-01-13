# Redwood
>👉 **"This is not the Repo you are looking for"** _...most likely_. If your goal is to start building an app using RedwoodJS, you'll want to read through the [Tutorial](https://redwoodjs.com/tutorial/welcome-to-redwood) and get started from the command line:
>$ `yarn create redwood-app <directory-name>`
>
**This repo is a template used by the RedwoodJS app bootstrap package 'Create Redwood App'**, which is located at [`redwood/packages/create-redwood-app/`](https://github.com/redwoodjs/redwood/tree/main/packages/create-redwood-app). If you're looking to do things like contributing to RedwoodJS development or reference Redwood's full-stack building blocks, then you're in the right place!🌲🎉

## Releases
To ensure `yarn.lock` is in sync with latest @redwoodjs packages, follow these steps:
1. confirm your local branch is up to date with `main`, then run `git clean -fxd`
2. update root, web/, and api/ `package.json` to latest @redwoodjs package version
3. run `yarn`
4. Commit all changes including `yarn.lock`
5. Create new release

## Development: Getting Started
Before you begin, please read the RedwoodJS [Contributor Covenant Code of Conduct](https://github.com/redwoodjs/redwood/blob/main/CODE_OF_CONDUCT.md)

Most likely, you'll need to set up a development environment linked to packages from a local clone of [`redwoodjs/redwood/packages`](https://github.com/redwoodjs/redwood/tree/main/packages). This doc will help get you started:
[Contributing to RedwoodJS](https://github.com/redwoodjs/redwood/blob/main/CONTRIBUTING.md)
