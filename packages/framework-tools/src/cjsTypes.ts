import { readFileSync, writeFileSync } from 'node:fs'

import type { PackageJson } from 'type-fest'
import { $ } from 'zx'

/**
 * This function will temporarily add "type": "commonjs" to the package.json file,
 * then run `yarn build:types-cjs` to generate the CJS type definitions.
 *
 * This does not work in all packages, because more complex packages have certain dependencies
 * that won't allow types to be generated in this way.
 */
export const generateCjsTypes = async () => {
  //  we need to also produce CJS type definitions
  //
  // The best way[1] to do this is to (temporarily) change the "type" in
  // package.json to "commonjs" and run tsc with our tsconfig.build-cjs.json
  // config file.
  // It's possible to run TSC programmatically[2] but it's much easier to just
  // shell out to the CLI.
  //
  // [1]: https://github.com/arethetypeswrong/arethetypeswrong.github.io/issues/21#issuecomment-1494618930
  // [2]: https://github.com/Microsoft/TypeScript/wiki/Using-the-Compiler-API

  await $`cp package.json package.json.bak`

  const packageJson: PackageJson = JSON.parse(
    readFileSync('./package.json', 'utf-8'),
  )
  packageJson.type = 'commonjs'
  writeFileSync('./package.json', JSON.stringify(packageJson, null, 2))

  try {
    await $`yarn build:types-cjs`
  } catch (e: any) {
    console.error('---- Error building CJS types ----')
    process.exitCode = e.exitCode
    throw new Error(e)
  } finally {
    await $`mv package.json.bak package.json`
  }
}
