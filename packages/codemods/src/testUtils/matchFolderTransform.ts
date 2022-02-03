import path from 'path'

import fg from 'fast-glob'
import fse from 'fs-extra'

import { createProjectMock } from './index'

export const matchFolderTransform = async (
  transformFunction: () => any,
  fixtureName: string,
  { removeWhitespace } = { removeWhitespace: false }
) => {
  const tempDir = createProjectMock()

  // Override paths used in getPaths() utility func
  process.env.RWJS_CWD = tempDir

  // Looks up the path of the caller
  const testPath = expect.getState().testPath

  if (!testPath) {
    throw new Error('Could not find test path')
  }

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

  const GLOB_CONFIG = {
    absolute: false,
    dot: true,
    ignore: ['redwood.toml', '**/*.DS_Store'], // ignore the fake redwood.toml added for getRWPaths
  }
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

    expect(actualPath).toMatchFileContents(expectedPath, { removeWhitespace })
  })

  delete process.env['RWJS_CWD']
}
