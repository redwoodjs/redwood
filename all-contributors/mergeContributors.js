#!/usr/bin/env node

// inspired by https://github.com/openclimatefix/merge-all-contributors

const fs = require('fs')

const mainContribFile = JSON.parse(fs.readFileSync('./.all-contributorsrc'))

const contribFiles = [
  './.crwa.all-contributorsrc',
  './.rwjs.com.all-contributorsrc',
]

async function main() {
  for (file of contribFiles) {
    let currentFile = JSON.parse(fs.readFileSync(file))
    for (contributor of currentFile.contributors) {
      if (
        mainContribFile.contributors.find((x) => x.login === contributor.login)
      ) {
        for (contributionType of contributor.contributions) {
          if (
            mainContribFile.contributors
              .find((x) => x.login === contributor.login)
              .contributions.indexOf(contributionType) === -1
          ) {
            mainContribFile.contributors
              .find((x) => x.login === contributor.login)
              .contributions.push(contributionType)
          }
        }
      } else {
        mainContribFile.contributors.push(contributor)
      }
    }
  }

  await fs.writeFileSync(
    './test.json',
    JSON.stringify(mainContribFile, null, 2)
  )
}

main()
