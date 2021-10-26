import fs from 'fs'
import path from 'path'

import fg from 'fast-glob'
import fetch from 'node-fetch'

import getRWPaths from '../../../lib/getRWPaths'
import ts2js from '../../../lib/ts2js'

export const udpateSeedScript = async () => {
  /**
   * add prisma to package.json
   */
  const rwPaths = getRWPaths()

  const rootPackageJSONPath = path.join(rwPaths.base, 'package.json')

  const rootPackageJSON = JSON.parse(
    fs.readFileSync(rootPackageJSONPath, 'utf8')
  )

  rootPackageJSON.prisma = { seed: 'yarn rw exec seed' }

  fs.writeFileSync(
    rootPackageJSONPath,
    JSON.stringify(rootPackageJSON, null, 2) + '\n'
  )

  /**
   * add template
   */
  const hasScripts = fs.existsSync(rwPaths.scripts)

  if (!hasScripts) {
    fs.mkdirSync(rwPaths.scripts)
  }

  const isTSProject =
    fg.sync('api/tsconfig.json').length > 0 ||
    fg.sync('web/tsconfig.json').length > 0

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
