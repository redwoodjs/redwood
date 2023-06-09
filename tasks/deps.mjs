/* eslint-env node */
// @ts-check

import { execSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const DependencyCruiserConfigFile = '.dependency-cruiser.mjs'

const globalConfigPath = fileURLToPath(
  new URL(`../${DependencyCruiserConfigFile}`, import.meta.url)
)

function main() {
  const [targetDir] = process.argv.slice(2)

  if (!targetDir) {
    process.exitCode = 1
    console.error('No target directory specified.')
    return
  }

  const { dir: packageDir, base } = path.parse(targetDir)
  const localConfigPath = path.join(packageDir, DependencyCruiserConfigFile)
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

  console.log(`Wrote dependency graph to ${outputPath}`)
}

main()
