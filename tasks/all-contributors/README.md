# All-Contributors

<!-- toc -->

- [All-Contributors](#all-contributors)
  - [Purpose and Vision](#purpose-and-vision)
  - [Lead](#lead)
  - [Managing All-Contributors Data](#managing-all-contributors-data)
    - [Step 1: Check for new contributors and add to `*rc` files](#step-1-check-for-new-contributors-and-add-to-rc-files)
    - [Step 2: Update the content in README.md#Contributors](#step-2-update-the-content-in-readmemdcontributors)
  - [Roadmap](#roadmap)
  - [Contributing](#contributing)

## Purpose and Vision

Redwood has a vibrant community that we want to highlight as much as possible. Using the [All-contributors](https://allcontributors.org/) specifications and CLI, this project allows us to:

- track the Framework, create-redwood-app, and Redwoodjs.com repo contributors
- display the aggregated list of contributors in the [Contributors section](https://github.com/redwoodjs/redwood/blob/main/README.md#contributors) of the root README.md

## Lead

[@thedavidprice](https://github.com/thedavidprice)

## Managing All-Contributors Data

In general, this is a three-part process:

1. Update the three `.all-contributorsrc` file with new contributors
2. Update README.md#Contributors with changes

> When adding contributors, use this "type" key for specific repos:
>
> - 💻 (code) == Framework
>
> The "type" is required and we used to differentiate for various repos. But we don't display it.

### Step 1: Check for new contributors and add to `*rc` files

> **NOTE:**
> Do not add [bot] accounts to the files.
>
> Also, members of the Core Team are manually added to the relevant section of #contributors. To avoid duplication, do not add the following profiles to .all-contributorsrc:
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

```js
cd tasks/all-contributors

yarn all-contributors check --config .all-contributorsrc

// For each contributor listed in output, repeat the following:

yarn all-contributors add --config .all-contributorsrc <contributor> code
```

### Step 2: Update the content in README.md#Contributors

```bash
yarn all-contributors generate --contributorsPerLine 5 --config .all-contributorsrc
```

Don't forget to commit and PR changes.

## Roadmap

- [ ] Create a script to handle Step 1 (check and add new contributors for each repo)

## Contributing

Help with this project is welcome and needed! No specific experience required. You'll want to be familiar with:

- All-contributors [config](https://allcontributors.org/docs/en/cli/configuration) and [CLI](https://allcontributors.org/docs/en/cli/usage)
- [GH Actions (Node.js)](https://docs.github.com/en/actions/language-and-framework-guides/using-nodejs-with-github-actions)
