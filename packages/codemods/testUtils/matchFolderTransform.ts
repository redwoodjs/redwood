import fs from 'fs'
import path from 'path'

import fg from 'fast-glob'

import { createProjectMock } from './index'

export const matchFolderTransform = async (
  transformFunction: () => any,
  fixtureName: string
) => {
  const tempDir = createProjectMock()

  // Looks up the path of the caller
  const testPath = expect.getState().testPath

  if (!testPath) {
    throw new Error('Could not find test path')
  }

  const GLOB_CONFIG = {
    absolute: false,
    cwd: tempDir,
    dot: true,
    ignore: ['redwood.toml', '.DS_Store'], // ignore the fake redwood.toml added for getRWPaths
  }

  // Use require.resolve, so we can pass in ts/js/tsx without specifying
  const fixtureFolder = path.join(
    testPath,
    '../../__testfixtures__',
    fixtureName
  )

  const fixtureInputDir = path.join(fixtureFolder, 'input')
  const fixtureOutputDir = path.join(fixtureFolder, 'output')

  // Step 1: Copy files recursively from fixture folder to temp
  fg.sync('**/*.*', GLOB_CONFIG).map((filePath) => {
    fs.copyFileSync(
      path.join(fixtureInputDir, filePath),
      path.join(tempDir, filePath)
    )
  })

  // Step 2: Run transform against temp dir
  await transformFunction()

  const transformedPaths = fg.sync('**/*.*', GLOB_CONFIG)

  const expectedPaths = fg.sync('**/*.*', GLOB_CONFIG)

  // Step 3: Check output paths
  expect(transformedPaths).toEqual(expectedPaths)

  // Step 4: Check contents of each file
  transformedPaths.forEach((transformedFile) => {
    const actualPath = path.join(tempDir, transformedFile)
    const expectedPath = path.join(fixtureOutputDir, transformedFile)

    expect(actualPath).toMatchFixture(expectedPath, transformedFile)
  })
}
