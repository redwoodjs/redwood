#!/usr/bin/env node

// inspired by https://github.com/openclimatefix/merge-all-contributors

const fs = require('fs')

const targetFile = '.all-contributorsrc'

const mainContribFile = JSON.parse(fs.readFileSync(targetFile))

const contribFiles = [
  '.crwa.all-contributorsrc',
  '.rwjs.com.all-contributorsrc',
]

async function main() {
  console.log(
    'Initial count of contributors: ' + mainContribFile.contributors.length
  )
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
  console.log(
    'Updated count of contributors: ' + mainContribFile.contributors.length
  )
  await fs.writeFileSync(targetFile, JSON.stringify(mainContribFile, null, 2))
  console.log(`Successfully updated "${targetFile}"`)
}

main()
