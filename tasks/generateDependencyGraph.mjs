#!/usr/bin/env node
/* eslint-env node */
// @ts-check

import { fileURLToPath } from 'node:url'
import { parseArgs } from 'node:util'

import prompts from 'prompts'
import { chalk, fs, path, $ } from 'zx'

async function main() {
  $.verbose = false

  const rootDir = fileURLToPath(new URL('../', import.meta.url))
  const DEPENDENCY_CRUISER_CONFIG_FILE = '.dependency-cruiser.mjs'
  const globalConfigPath = path.join(rootDir, DEPENDENCY_CRUISER_CONFIG_FILE)

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

  const choices = (await $`yarn workspaces list --json`).stdout
    .trim()
    .split('\n')
    .map(JSON.parse)
    .filter(({ name }) => name)
    .flatMap(({ name, location }) => {
      const srcPath = path.join(rootDir, location, 'src')
      const distPath = path.join(rootDir, location, 'dist')
      return [
        { title: `${name} (src)`, value: srcPath },
        { title: `${name} (dist)`, value: distPath },
      ]
    })

  if (!targetDir) {
    const res = await prompts(
      {
        type: 'autocomplete',
        name: 'targetDir',
        message: 'Choose a package',
        choices,
        async suggest(input, choices) {
          return Promise.resolve(
            choices.filter(({ title }) => title.includes(input))
          )
        },
      },
      {
        onCancel: () => {
          process.exit(1)
        },
      }
    )

    targetDir = res.targetDir
  }

  const { dir: packageDir, base } = path.parse(targetDir)

  let configPath = globalConfigPath
  const localConfigPath = path.join(packageDir, DEPENDENCY_CRUISER_CONFIG_FILE)

  if (fs.existsSync(localConfigPath)) {
    configPath = localConfigPath
  }

  const outputPath = path.join(packageDir, `./dependencyGraph.${base}.svg`)

  await $`yarn depcruise ${targetDir} --config ${configPath} --output-type dot --exclude "src/__tests__" | dot -T svg -o ${outputPath}`

  console.log(
    `Wrote ${chalk.magenta(base)} dependency graph to ${chalk.magenta(
      outputPath
    )}`
  )

  if (values.open) {
    console.log(`Opening ${chalk.magenta(outputPath)}...`)
    await $`open ${outputPath}`
  }
}

main()
