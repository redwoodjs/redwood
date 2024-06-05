#!/usr/bin/env node
/* eslint-env node */

import fs from 'node:fs'
import path from 'node:path'

import fg from 'fast-glob'

const __dirname = import.meta.dirname

// Read the package name from the command line arguments.
const packageName = process.argv[2]
if (!packageName) {
  console.error('Usage: node tasks/generateDistExportFields.mjs <package-name>')
  process.exit(1)
}

// Check the directories exist.
const packageRoot = path.join(__dirname, '..', 'packages', packageName)
if (!fs.existsSync(packageRoot)) {
  console.error(`Directory not found: ${packageRoot}`)
  process.exit(1)
}
const cjsDistDir = path.join(packageRoot, 'dist', 'cjs')
if (!fs.existsSync(cjsDistDir)) {
  console.error(`Directory not found: ${cjsDistDir}`)
  process.exit(1)
}

// Find all the JS files in the dist/cjs directory.
const jsFiles = fg.sync('**/*.js', {
  cwd: cjsDistDir,
  absolute: true,
})

const distDirs = new Set()
for (const jsFile of jsFiles) {
  distDirs.add(path.relative(packageRoot, path.dirname(jsFile)))
}

// Build the export fields object that contains entries for directories that contain JS files.
const exportFields = {}
for (const distDir of distDirs) {
  const esmDistDir = distDir.replace('dist/cjs', 'dist')
  exportFields[`./${esmDistDir}/*`] = {
    types: `./${esmDistDir}/*.d.ts`,
    import: `./${esmDistDir}/*.js`,
    default: `./${distDir}/*.js`,
  }
  exportFields[`./${esmDistDir}/*.js`] = {
    types: `./${esmDistDir}/*.d.ts`,
    import: `./${esmDistDir}/*.js`,
    default: `./${distDir}/*.js`,
  }
}

// Print it out so it can be copied into the package.json as needed.
console.log(JSON.stringify(exportFields, null, 2))
console.log('')
