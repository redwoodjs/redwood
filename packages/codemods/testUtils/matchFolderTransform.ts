import fs from 'fs'
import path from 'path'

import fg from 'fast-glob'
import fse from 'fs-extra'
import tempy from 'tempy'

export const createProjectMock = () => {
  const tempDir = tempy.directory()

  // // Override paths,
  process.env.RWJS_CWD = tempDir
  // // and add fake redwood.toml
  fs.closeSync(fs.openSync(path.join(tempDir, 'redwood.toml'), 'w'))

  return tempDir
}

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
    dot: true,
    ignore: ['redwood.toml', '**/*.DS_Store'], // ignore the fake redwood.toml added for getRWPaths
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
  fse.copySync(fixtureInputDir, tempDir, {
    overwrite: true,
  })

  // Step 2: Run transform against temp dir
  await transformFunction()

  const transformedPaths = fg.sync('**/*', { ...GLOB_CONFIG, cwd: tempDir })

  const expectedPaths = fg.sync('**/*', {
    ...GLOB_CONFIG,
    cwd: fixtureOutputDir,
  })

  // Step 3: Check output paths
  expect(transformedPaths).toEqual(expectedPaths)

  // Step 4: Check contents of each file
  transformedPaths.forEach((transformedFile) => {
    const actualPath = path.join(tempDir, transformedFile)
    const expectedPath = path.join(fixtureOutputDir, transformedFile)

    expect(actualPath).toMatchFixture(expectedPath, transformedFile)
  })
}
