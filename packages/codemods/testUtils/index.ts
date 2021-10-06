import fs from 'fs'
import path from 'path'

import { format } from 'prettier'
import tempy from 'tempy'

import runTransform from '../src/lib/runTransform'

const formatCode = (code: string) => {
  return format(code, { parser: 'babel-ts' })
}

export const matchTransformSnapshot = (
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
  runTransform({
    transformPath,
    targetPaths: [tempFilePath],
    parser,
  })

  // Step 3: Read modified file and snapshot
  const transformedContent = fs.readFileSync(tempFilePath, 'utf-8')

  const expectedOutput = fs.readFileSync(
    fixturePath.replace('.input.', '.output.'),
    'utf-8'
  )

  expect(formatCode(transformedContent)).toEqual(formatCode(expectedOutput))
}

export const matchInlineTransformSnapshot = (
  transformName: string,
  fixtureCode: string,
  expectedCode: string,
  parser: 'ts' | 'tsx' | 'babel' = 'tsx'
) => {
  const tempFilePath = tempy.file()

  // Looks up the path of the caller
  const testPath = expect.getState().testPath

  if (!testPath) {
    throw new Error('Could not find test path')
  }

  const transformPath = require.resolve(
    path.join(testPath, '../../', transformName)
  )

  // Step 1: Write passed in code to a temp file
  fs.writeFileSync(tempFilePath, fixtureCode)

  // Step 2: Run transform against temp file
  runTransform({
    transformPath,
    targetPaths: [tempFilePath],
    parser,
  })

  // Step 3: Read modified file and snapshot
  const transformedContent = fs.readFileSync(tempFilePath, 'utf-8')

  expect(formatCode(transformedContent)).toEqual(formatCode(expectedCode))
}

export default matchTransformSnapshot
