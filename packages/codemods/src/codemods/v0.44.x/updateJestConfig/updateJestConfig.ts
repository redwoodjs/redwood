/**
 * @typedef {[string, string, string]} JestConfigPaths
 */
import fs from 'fs'
import path from 'path'

import fetchFileFromTemplate from '../../../lib/fetchFileFromTemplate'
import getRWPaths from '../../../lib/getRWPaths'
import runTransform from '../../../lib/runTransform'

export default async function updateJestConfig() {
  const rwPaths = getRWPaths()

  /**
   * @type JestConfigPaths
   */
  const jestConfigPaths = [
    [rwPaths.base, 'jest.config.js'],
    [rwPaths.api.base, 'jest.config.js'],
    [rwPaths.web.base, 'jest.config.js'],
  ].map((paths) => path.join(...paths))

  const [rootJestConfigPath, ...apiWebJestConfigPaths] = jestConfigPaths

  const tag = 'main'

  if (!fs.existsSync(rootJestConfigPath)) {
    const rootJestConfigTemplate = await fetchFileFromTemplate(
      tag,
      'jest.config.js'
    )
    fs.writeFileSync(rootJestConfigPath, rootJestConfigTemplate)
  }

  for (const apiWebJestConfigPath of apiWebJestConfigPaths) {
    if (!fs.existsSync(apiWebJestConfigPath)) {
      const { dir, base } = path.parse(apiWebJestConfigPath)

      const file = path.format({
        dir: path.basename(dir),
        base,
      })

      const apiWebJestConfigTemplate = await fetchFileFromTemplate(tag, file)
      fs.writeFileSync(apiWebJestConfigPath, apiWebJestConfigTemplate)
    } else {
      await runTransform({
        transformPath: path.join(__dirname, 'updateJestConfig.transform.js'),
        targetPaths: [apiWebJestConfigPath],
      })
    }
  }
}
