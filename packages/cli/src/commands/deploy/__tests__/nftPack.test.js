import path from 'path'

import fs from 'fs-extra'

import { buildApi } from '@redwoodjs/internal/dist/build/api'
import { findApiDistFunctions } from '@redwoodjs/internal/dist/files'

import * as nftPacker from '../packing/nft'

const FIXTURE_PATH = path.resolve(
  __dirname,
  '../../../../../../__fixtures__/example-todo-main'
)

let functionDistFiles

beforeAll(() => {
  process.env.RWJS_CWD = FIXTURE_PATH

  // Actually build the fixture, if we need it
  if (!fs.existsSync(path.join(FIXTURE_PATH, 'api/dist/functions'))) {
    buildApi()
  }

  functionDistFiles = findApiDistFunctions()
})

afterAll(() => {
  delete process.env.RWJS_CWD
})

test('Check packager detects all functions', () => {
  const packageFileMock = jest
    .spyOn(nftPacker, 'packageSingleFunction')
    .mockResolvedValue(true)

  nftPacker.nftPack()

  expect(packageFileMock).toHaveBeenCalledTimes(5)
})

test('Creates entry file for nested functions correctly', () => {
  const nestedFunction = functionDistFiles.find((fPath) =>
    fPath.includes('nested')
  )

  const [outputPath, content] = nftPacker.generateEntryFile(
    nestedFunction,
    'nested'
  )

  expect(outputPath).toBe('./api/dist/zipball/nested/nested.js')
  expect(content).toMatchInlineSnapshot(
    `"module.exports = require('./api/dist/functions/nested/nested.js')"`
  )
})

test('Creates entry file for top level functions correctly', () => {
  const graphqlFunction = functionDistFiles.find((fPath) =>
    fPath.includes('graphql')
  )

  const [outputPath, content] = nftPacker.generateEntryFile(
    graphqlFunction,
    'graphql'
  )

  expect(outputPath).toBe('./api/dist/zipball/graphql/graphql.js')
  expect(content).toMatchInlineSnapshot(
    `"module.exports = require('./api/dist/functions/graphql.js')"`
  )
})
