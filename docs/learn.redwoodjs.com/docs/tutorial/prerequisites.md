---
id: prerequisites
title: 'Prerequisites'
sidebar_label: 'Prerequisites'
---

This tutorial assumes you are already familiar with a few core concepts:

- [React](https://reactjs.org/)
- [GraphQL](https://graphql.org/)

You could work through this tutorial without knowing anything about these technologies but you may find yourself getting lost in terminology that we don't stop and take the time to explain. It also helps knowing where the line is between what is built into React and what additional features Redwood brings to the table.

> **Windows:** Recommended Development Setup  
> JavaScript development on Windows has specific requirements in addition to Yarn and npm. Follow our simple setup guide:
>
> - [Recommended Windows Development Setup](https://redwoodjs.com/cookbook/windows-development-setup)

### Redwood Versions

To complete the tutorial, you will need to be on Redwood v0.39 or greater (or the latest v1.0.0-rc). If this is your first time using Redwood then no worries; the latest version will be installed automatically when you create your app skeleton!

If you have an existing site created with a prior version, you'll need to upgrade and (most likely) apply code modifications. Follow this two step process:

1. For _each_ version included in your upgrade, follow the "Code Modifications" section of the specific version's Release Notes:
   - [Redwood Releases](https://github.com/redwoodjs/redwood/releases)
2. The upgrade to the latest version. Run the command:
   - `yarn redwood upgrade`

### Node.js and Yarn Versions

During installation, RedwoodJS checks if your system meets version requirements for Node and Yarn:

- node: ">=14.17 <=16.x"
- yarn: ">=1.15"

If your system versions do not meet both requirements, _the installation bootstrap will result in an ERROR._ To check, please run the following from your terminal command line:

```
node --version
yarn --version
```

Please do upgrade accordingly. Then proceed to the Redwood installation when you're ready!

> **Installing Node and Yarn**
>
> There are many ways to install and manage both Node.js and Yarn. If you're installing for the first time, we recommend the following:
>
> **1. Yarn**  
> We recommend following the [instructions via Yarnpkg.com](https://classic.yarnpkg.com/en/docs/install/).
>
> **2. Node.js**  
> Using the latest [installation from Nodejs.org](https://nodejs.org/en/) works just fine.
>
> - `nvm` is a great tool for managing multiple versions of Node on one system. It takes a bit more effort to set up and learn, however. Follow the [nvm installation instructions](https://github.com/nvm-sh/nvm#installing-and-updating). (Windows users should go to [nvm-windows](https://github.com/coreybutler/nvm-windows/releases)). For **Mac** users with Homebrew installed, you can alternatively use it to [install `nvm`](https://formulae.brew.sh/formula/nvm).
>
> If you're confused about which of the two current Node versions to use, we recommend using the most recent LTS, which is currently [v16.x](https://nodejs.org/download/release/latest-gallium/.
