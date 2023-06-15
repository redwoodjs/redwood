#!/usr/bin/env node
/* eslint-env node */
// @ts-check

import { execSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { parseArgs } from 'node:util'

import chalk from 'chalk'

const DEPENDENCY_CRUISER_CONFIG_FILE = '.dependency-cruiser.mjs'

const globalConfigPath = fileURLToPath(
  new URL(`../${DEPENDENCY_CRUISER_CONFIG_FILE}`, import.meta.url)
)

function main() {
  const { positionals, values } = parseArgs({
    allowPositionals: true,
    options: {
      open: {
        type: 'boolean',
        alias: 'o',
        default: false,
      },
    },
  })

  const [targetDir] = positionals

  if (!targetDir) {
    process.exitCode = 1
    console.error('Error: No target directory specified')
    return
  }

  const { dir: packageDir, base } = path.parse(targetDir)

  const localConfigPath = path.join(packageDir, DEPENDENCY_CRUISER_CONFIG_FILE)
  let configPath = globalConfigPath

  if (fs.existsSync(localConfigPath)) {
    configPath = localConfigPath
  }

  const depcruiseCommand = [
    'depcruise',
    targetDir,
    '--config',
    configPath,
    '--output-type dot',
    '--exclude "src/__tests__"',
  ].join(' ')

  const outputPath = path.join(packageDir, `./dependencyGraph.${base}.svg`)

  const dotCommand = ['dot', '-T svg', `-o ${outputPath}`].join(' ')

  execSync(`${depcruiseCommand} | ${dotCommand}`)

  console.log(
    `Wrote ${chalk.magenta(base)} dependency graph to ${chalk.magenta(
      outputPath
    )}`
  )

  if (values.open) {
    console.log(`Opening ${chalk.magenta(outputPath)}...`)
    execSync(`open ${outputPath}`)
  }
}

main()
