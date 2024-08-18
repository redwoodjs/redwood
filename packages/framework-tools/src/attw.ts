import { createRequire } from 'node:module'
import path from 'node:path'

import { $ } from 'zx'

interface Problem {
  kind: string
  entrypoint?: string
  resolutionKind?: string
}

interface Options {
  cwd: string
}

export async function attw({ cwd }: Options): Promise<Problem[]> {
  // We can't rely on directly running the attw binary because it's not
  // a direct dependency of the package that will ultimately use this.
  // Instead, we have to do a little work to find the attw binary and run it.
  const require = createRequire(import.meta.url)
  const pathToAttw = require.resolve('@arethetypeswrong/cli/package.json')
  const attwPackageJson = require(pathToAttw)
  const relativeBinPath = attwPackageJson.bin.attw
  const attwBinPath = path.resolve(path.dirname(pathToAttw), relativeBinPath)

  // Run attw via it's CLI
  await $({
    nothrow: true,
    cwd,
  })`yarn node ${attwBinPath} -P -f json > .attw.json`

  // Read the resulting JSON file
  const output = await $`cat .attw.json`
  await $`rm .attw.json`
  const json = JSON.parse(output.stdout)

  // If no errors were found then return early
  if (!json.analysis.problems || json.analysis.problems.length === 0) {
    return []
  }

  // We don't care about node10 errors
  const problems: Problem[] = json.analysis.problems.filter(
    (problem: Problem) => problem.resolutionKind !== 'node10',
  )

  return problems
}
