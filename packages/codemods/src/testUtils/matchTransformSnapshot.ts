import fs from 'fs'
import path from 'path'

import tempy from 'tempy'

import runTransform from '../lib/runTransform'

import { formatCode } from './index'

export const matchTransformSnapshot = async (
  transformName: string,
  fixtureName: string = transformName,
  parser: 'ts' | 'tsx' | 'babel' = 'tsx'
) => {
  const tempFilePath = tempy.file()

  // Looks up the path of the caller
  const testPath = expect.getState().testPath

  if (!testPath) {
    throw new Error('Could not find test path')
  }

  // Use require.resolve, so we can pass in ts/js/tsx without specifying
  const fixturePath = require.resolve(
    path.join(testPath, '../../__testfixtures__', `${fixtureName}.input`)
  )

  const transformPath = require.resolve(
    path.join(testPath, '../../', transformName)
  )

  // Step 1: Copy fixture to temp file
  fs.copyFileSync(fixturePath, tempFilePath, fs.constants.COPYFILE_FICLONE)

  // Step 2: Run transform against temp file
  await runTransform({
    transformPath,
    targetPaths: [tempFilePath],
    parser,
    options: {
      verbose: true,
    },
  })

  // Step 3: Read modified file and snapshot
  const transformedContent = fs.readFileSync(tempFilePath, 'utf-8')

  const expectedOutput = fs.readFileSync(
    fixturePath.replace('.input.', '.output.'),
    'utf-8'
  )

  expect(formatCode(transformedContent)).toEqual(formatCode(expectedOutput))
}
