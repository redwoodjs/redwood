import fs from 'fs'
import path from 'path'

import tempy from 'tempy'

import runTransform from '../../lib/runTransform'

export const testCodemod = (
  transformFilePath: string,
  fixtureName: string,
  variables?: any
) => {
  const tempFilePath = tempy.file()

  const fixturePath = path.resolve(
    path.join(__dirname, 'fixtures', fixtureName)
  )

  // Step 1: Copy fixture to temp file
  fs.copyFileSync(fixturePath, tempFilePath)

  // Step 2: Run transform against temp file
  runTransform({
    transformFilePath,
    targetPath: tempFilePath,
    variables,
  })

  // Step 3: Read modified file and snapshot
  const outputContent = fs.readFileSync(tempFilePath, 'utf-8')

  expect(outputContent).toMatchSnapshot(`${transformFilePath}-${fixtureName}`)
}

export default testCodemod
