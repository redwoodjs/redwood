/* eslint-env node */

// This file runs some lib functions in an observable way for QA.
// Run this file with...
//
//```js
// yarn node ./tasks/release/tests/releaseLibQA.mjs
//```
//
// TODO: some of this code would break on an annotated tag...

import { fs, question } from 'zx'

import { annotateSymmetricDifference, purgeTriageData } from '../releaseLib.mjs'

async function main() {
  const linesFileURL = new URL('./lines.json', import.meta.url)

  let lines

  try {
    lines = await fs.readJSON(linesFileURL)
  } catch (e) {
    console.log(
      `Couldn't read ${linesFileURL}. Have you run \`yarn node ./tasks/release/triageMain.mjs\`?`
    )
    process.exitCode = 1
    return
  }

  const range = {
    from: 'main',
    to: 'next',
  }

  const annotatedSymmetricDifference = await annotateSymmetricDifference(
    lines,
    {
      ...range,
      // Uncomment this to `true` to go step by step:
      // verbose: true,
    }
  )

  // await QA_AnnotateSymmetricDifference(annotatedSymmetricDifference, range)
  // await QA_MainCommits(annotatedSymmetricDifference, range)
  // await QA_TriageData(annotatedSymmetricDifference, range)
}

main()

//------------------------

async function QA_AnnotateSymmetricDifference(
  annotatedSymmetricDifference,
  { from, to }
) {
  const types = new Set(
    annotatedSymmetricDifference.map((commit) => commit.type)
  )

  const categoryToCommitsInitialValue = [...types, from, to].reduce(
    (obj, type) => {
      obj[type] = []
      return obj
    },
    {}
  )

  const categoryToCommits = annotatedSymmetricDifference.reduce(
    (categoryToCommits, commit) => {
      categoryToCommits[commit.type].push(commit)
      categoryToCommits[commit.ref].push(commit)
      return categoryToCommits
    },
    categoryToCommitsInitialValue
  )

  fs.writeJSON(
    new URL('./tests/annotatedSymmetricDifference.json', import.meta.url),
    categoryToCommits,
    { spaces: 2 }
  )
}

async function QA_MainCommits(annotatedSymmetricDifference, { from }) {
  const fromCommits = annotatedSymmetricDifference.filter(
    (commit) => commit.ref === from
  )

  const triageMainData = await fs.readJSON(
    new URL('./data/triageMainData.json', import.meta.url)
  )

  for (const commit of fromCommits) {
    const triageStatus = triageMainData[commit.hash]?.needsCherryPick

    if (triageStatus === undefined) {
      console.log(`${commit.pretty} has no triage status`)
    } else {
      console.log(`${commit.pretty}`)
      console.log(`needs cherry pick? ${triageStatus}`)
    }

    await question('')
  }
}

async function QA_TriageData(annotatedSymmetricDifference, { to }) {
  const triageMainData = new Map(
    Object.entries(
      await fs.readJSON(new URL('./data/triageMainData.json', import.meta.url))
    )
  )

  await purgeTriageData(triageMainData, {
    commits: annotatedSymmetricDifference.filter(
      (commit) => commit.type === 'commit'
    ),
    branch: to,
  })
}

// qa commits to be released...
// since last minor...
// since last patch...
