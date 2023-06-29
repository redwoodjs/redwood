#!/usr/bin/env node
/* eslint-env node */
// @ts-check

import {
  copyFrameworkFilesToProject,
  fixProjectBinaries,
} from './lib/project.mjs'

async function main() {
  const redwoodProjectPath = process.argv?.[2] ?? process.env.RWJS_CWD

  // Mostly just making TS happy with the second condition.
  if (!redwoodProjectPath || typeof redwoodProjectPath !== 'string') {
    process.exitCode = 1
    console.error([
      'Error: Please specify the path to your Redwood project',
      `Usage: ${process.argv?.[1]} ./path/to/rw/project`,
    ])
    return
  }

  try {
    await copyFrameworkFilesToProject(redwoodProjectPath)
    fixProjectBinaries(redwoodProjectPath)
  } catch (e) {
    console.error('Error:', e.message)
    process.exitCode = 1
  }
}

main()
