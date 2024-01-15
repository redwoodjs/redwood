#!/usr/bin/env node
/* eslint-env node */
// @ts-check

import path from 'node:path'

import { addDependenciesToPackageJson } from './lib/project.mjs'

function main() {
  const projectPath = process.argv?.[2] ?? process.env.RWJS_CWD

  if (!projectPath) {
    process.exitCode = 1
    console.error([
      'Error: Please specify the path to your Redwood project',
      `Usage: ${process.argv?.[1]} ./path/to/rw/project`,
    ])
    return
  }

  try {
    const packageJsonPath = path.join(projectPath, 'package.json')
    addDependenciesToPackageJson(packageJsonPath)
    console.log('Done. Now run `yarn install`.')
  } catch (e) {
    console.log('Error:', e.message)
    process.exitCode = 1
  }
}

main()
