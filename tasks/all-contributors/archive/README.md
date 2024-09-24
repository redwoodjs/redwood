# All-Contributors

<!-- toc -->

- [Purpose and Vision](#Purpose-and-Vision)
- [Package Lead](#Package-Lead)
- [Managing All-Contributors Data](#step-2-merge-contributors-into-main-file)
- [Roadmap](#Roadmap)
- [Contributing](#Contributing)

## Purpose and Vision

Redwood has a vibrant community that we want to highlight as much as possible. Using the [All-contributors](https://allcontributors.org/) specifications and CLI, this project allows us to:

- track the Framework, create-redwood-app, and Redwoodjs.com repo contributors
- display the aggregated list of contributors in the [Contributors section](https://github.com/redwoodjs/redwood/blob/main/README.md#contributors) of the root README.md

## Lead

[@thedavidprice](https://github.com/thedavidprice)

## Managing All-Contributors Data

In general, this is a three-part process:

1. Update the three `*.all-contributorsrc` files with new contributors
2. Merge changes into the main `.all-contributorsrc` file
3. Update README.md#Contributors with changes

**FILES**

**Framework** `redwoodjs/redwood` project:

_note: this file is also used for all aggregated contributors_

- `.all-contributorsrc`

**Website** `redwoodjs/redwoodjs.com` project:

- `.rwjs.com.all-contributorsrc`

**Learn** `redwoodjs/learn.redwoodjs.com` project:

- `.learn.all-contributorsrc`

// Archived
**CRWA** `redwoodjs/create-redwood-app` project:

- `.crwa.all-contributorsrc`

> When adding contributors, use this "type" key for specific repos:
>
> - 💻 (code) == Framework
> - 📖 (doc) == Redwoodjs.com
> - 🔧 (tool) == Create-Redwood-App
> - ✅ (tutorial) == Learn.Redwoodjs.com
>
> The "type" is required.

### Step 1: Check for new contributors and add to `*rc` files

`cd tasks/all-contributors`

> **NOTE:**
> Do not add [bot] accounts to the files.
>
> Also, members of the Core Team are manually added to the #core-team section. To avoid duplication, do not add the following profiles to the files below:
>
> - peterp
> - thedavidprice
> - mojombo
> - cannikin
> - jtoar
> - Tobbe
> - RobertBroersma
> - dthyresson
> - dac09
> - aldonline
> - clairefro
> - ajcwebdev
> - forresthayes
> - kimadeline
> - simoncrypta
> - KrisCoulson
> - keithtelliott
> - callingmedic911
> - agiannelli
> - alicelovescake
> - chrisvdm
> - realStandal
> - virtuoushub
>   ==BOTS==
> - dependabot[bot]
> - renovate[bot]
> - codesee-architecture-diagrams[bot]

#### Framework

```js
yarn all-contributors check --config .all-contributorsrc

// For each contributor listed in output, repeat the following:

yarn all-contributors add --config .all-contributorsrc <contributor> code
```

#### Redwoodjs.com

```js
yarn all-contributors check --config .rwjs.com.all-contributorsrc

// For each contributor listed in output, repeat the following:

yarn all-contributors add --config .rwjs.com.all-contributorsrc <contributor> doc
```

#### Learn.Redwoodjs.com

```js
yarn all-contributors check --config .learn.all-contributorsrc

// For each contributor listed in output, repeat the following:

yarn all-contributors add --config .learn.all-contributorsrc <contributor> tutorial
```

### Step 2: Merge contributors into main file

This script will add contributors from Redwoodjs.com and CRWA repos into the Framework file (if they don't already exist). It will also update the "type" of contribution for existing contributors.

```bash
node mergeContributors.js
```

### Step 3: Update the content in README.md#Contributors

```bash
yarn all-contributors generate --contributorsPerLine 5 --config .all-contributorsrc
```

Don't forget to commit and PR changes.

## Roadmap

- [ ] Create a script to handle Step 1 (check and add new contributors for each repo)
- [ ] Convert these scripts into a GH Action that runs daily

## Contributing

Help with this project is welcome and needed! No specific experience required. You'll want to be familiar with:

- All-contributors [config](https://allcontributors.org/docs/en/cli/configuration) and [CLI](https://allcontributors.org/docs/en/cli/usage)
- [GH Actions (Node.js)](https://docs.github.com/en/actions/language-and-framework-guides/using-nodejs-with-github-actions)
