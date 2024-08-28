/* eslint-env node, es6*/
import * as fs from 'node:fs'
import * as path from 'node:path'

import { hideBin } from 'yargs/helpers'
import yargs from 'yargs/yargs'

import { exec, getExecaOptions as utilGetExecaOptions } from './util'

function getExecaOptions(cwd: string) {
  return { ...utilGetExecaOptions(cwd), stdio: 'pipe' }
}

const args = yargs(hideBin(process.argv))
  .usage('Usage: $0 <project directory>')
  .parseSync()

/**
 * This script takes a regular test-project, and adds some extra files/config
 * so we can run e2e tests for fragments
 */
async function runCommand() {
  const OUTPUT_PROJECT_PATH = path.resolve(String(args._))
  await exec(
    'yarn rw setup graphql trusted-documents',
    [],
    getExecaOptions(OUTPUT_PROJECT_PATH),
  )

  const redwoodTomlPath = path.join(OUTPUT_PROJECT_PATH, 'redwood.toml')
  const redwoodTomlContent = fs.readFileSync(redwoodTomlPath, 'utf-8')

  // NOTE: The checks we do here are very specific. This would never be enough
  // for a user's project. But since we're in full control of the generation of
  // the project here, we can get away with these simpler checks

  if (!redwoodTomlContent.includes('trustedDocuments = true')) {
    console.error(
      'Failed to set up trusted-documents in fragments test-project',
    )
    console.error('trustedDocuments = true not set in redwood.toml')
    console.error()
    console.error('Please run this command locally to make sure it works')
    console.error()
    console.error("For debugging purposes, here's the content of redwood.toml:")
    console.error(redwoodTomlContent)
    console.error()
    throw new Error('Failed to set up trusted-document')
  }

  const graphqlHandlerPath = path.join(
    OUTPUT_PROJECT_PATH,
    'api/src/functions/graphql.ts',
  )
  const graphqlHandlerContent = fs.readFileSync(graphqlHandlerPath, 'utf-8')
  const storeImport = "import { store } from 'src/lib/trustedDocumentsStore'"

  if (!graphqlHandlerContent.includes(storeImport)) {
    console.error(
      'Failed to set up trusted-documents in fragments test-project',
    )
    console.error('`store` is not imported in the graphql handler')
    console.error()
    console.error('Please run this command locally to make sure it works')
    throw new Error('Failed to set up trusted-document')
  }

  if (!graphqlHandlerContent.includes('trustedDocuments: {')) {
    console.error(
      'Failed to set up trusted-documents in fragments test-project',
    )
    console.error(
      'The trustedDocuments store is not used in the graphql handler',
    )
    console.error()
    console.error('Please run this command locally to make sure it works')
    throw new Error('Failed to set up trusted-document')
  }

  await exec('yarn rw build', [], getExecaOptions(OUTPUT_PROJECT_PATH))
}

runCommand()
