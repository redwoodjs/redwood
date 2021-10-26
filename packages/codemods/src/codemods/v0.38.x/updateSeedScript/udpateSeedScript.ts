import fs from 'fs'
import path from 'path'

import fetch from 'node-fetch'

import getRootPackageJson from '../../../lib/getRootPackageJSON'
import getRWPaths from '../../../lib/getRWPaths'
import isTSProject from '../../../lib/isTSProject'
import ts2js from '../../../lib/ts2js'

export const udpateSeedScript = async () => {
  /**
   * Add
   *
   * ```json
   * "prisma": {
   *   "seed": "yarn rw exec seed"
   * }
   * ```
   *
   * to root package.json.
   */
  const [rootPackageJSON, rootPackageJSONPath] = getRootPackageJson()

  rootPackageJSON.prisma = { seed: 'yarn rw exec seed' }

  fs.writeFileSync(
    rootPackageJSONPath,
    JSON.stringify(rootPackageJSON, null, 2) + '\n'
  )

  /**
   * add template
   */
  const rwPaths = getRWPaths()

  const hasScripts = fs.existsSync(rwPaths.scripts)

  if (!hasScripts) {
    fs.mkdirSync(rwPaths.scripts)
  }

  const res = await fetch(
    'https://raw.githubusercontent.com/redwoodjs/redwood/main/packages/create-redwood-app/template/scripts/seed.ts'
  )
  let text = await res.text()
  if (!isTSProject) {
    text = (await ts2js(text)) as string
  }

  fs.writeFileSync(
    path.join(rwPaths.scripts, `seed.${isTSProject ? 'ts' : 'js'}`),
    text
  )
}
