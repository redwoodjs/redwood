#!/usr/bin/env node
/* eslint-env node */
// @ts-check

import { execSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { parseArgs } from 'node:util'

import chalk from 'chalk'
import { default as enquirer } from 'enquirer'

const rootDir = fileURLToPath(new URL('../', import.meta.url))
const DEPENDENCY_CRUISER_CONFIG_FILE = '.dependency-cruiser.mjs'
const globalConfigPath = path.join(rootDir, DEPENDENCY_CRUISER_CONFIG_FILE)

async function main() {
  const { positionals, values } = parseArgs({
    allowPositionals: true,
    options: {
      open: {
        type: 'boolean',
        short: 'o',
        default: false,
      },
    },
  })

  let [targetDir] = positionals

  const packages = execSync('yarn workspaces list --json', {
    encoding: 'utf-8',
  })
    .trim()
    .split('\n')
    .map(JSON.parse)
    .filter(({ name }) => name)
    .flatMap(({ location }) => {
      const srcPath = path.join(rootDir, location, 'src')
      const distPath = path.join(rootDir, location, 'dist')
      return [srcPath, distPath]
    })

  if (!targetDir) {
    const res = await enquirer.prompt({
      type: 'select',
      name: 'targetDir',
      message: 'Choose a target directory',
      // Unfortunately we exceed the terminal's height with all our packages
      // and enquirer doesn't handle it too well.
      // But showing choices gives users an idea of how it works.
      choices: [...packages.slice(0, 10), '...'],
    })

    targetDir = res.targetDir
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
