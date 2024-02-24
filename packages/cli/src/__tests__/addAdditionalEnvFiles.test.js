import path from 'path'

import { afterEach, beforeAll, describe, expect, it, test } from 'vitest'

import { addAdditionalEnvFiles } from '../middleware/addAdditionalEnvFiles'

describe('addAdditionalEnvFiles', () => {
  let originalProcessEnv
  beforeAll(() => {
    originalProcessEnv = { ...process.env }
  })
  afterEach(() => {
    process.env = { ...originalProcessEnv }
  })

  it("doesn't load .env files if there are none to load", () => {
    const fn = addAdditionalEnvFiles(__dirname)
    fn({})

    expect(process.env).toEqual(originalProcessEnv)
  })

  it("doesn't load .env files if not instructed to", () => {
    const fn = addAdditionalEnvFiles(
      path.join(__dirname, '__fixtures__/redwood-app-env-prod')
    )
    fn({})

    expect(process.env).toEqual(originalProcessEnv)
  })

  it('loads specified .env files', () => {
    expect(process.env).not.toHaveProperty('PROD_DATABASE_URL')

    const fn = addAdditionalEnvFiles(
      path.join(__dirname, '__fixtures__/redwood-app-env-prod')
    )
    fn({ includeEnvFiles: ['prod'] })

    expect(process.env).toHaveProperty(
      'PROD_DATABASE_URL',
      'postgresql://user:password@localhost:5432/myproddb'
    )
  })

  test('process.env is reset between tests', () => {
    expect(process.env).not.toHaveProperty('PROD_DATABASE_URL')
  })

  it('loads multiple .env files', () => {
    expect(process.env).not.toHaveProperty('DEV_DATABASE_URL')
    expect(process.env).not.toHaveProperty('PROD_DATABASE_URL')

    const fn = addAdditionalEnvFiles(
      path.join(__dirname, '__fixtures__/redwood-app-env-many')
    )
    fn({ includeEnvFiles: ['dev', 'prod'] })

    expect(process.env).toHaveProperty(
      'DEV_DATABASE_URL',
      'postgresql://user:password@localhost:5432/mydevdb'
    )
    expect(process.env).toHaveProperty(
      'PROD_DATABASE_URL',
      'postgresql://user:password@localhost:5432/myproddb'
    )
  })

  it('is additive (i.e. only adds to process.env, not overwrites)', () => {
    expect(process.env).not.toHaveProperty('DATABASE_URL')
    expect(process.env).not.toHaveProperty('TEST_BASE')
    expect(process.env).not.toHaveProperty('TEST_COLLISION')

    const fn = addAdditionalEnvFiles(
      path.join(__dirname, '__fixtures__/redwood-app-env-collision')
    )
    fn({ includeEnvFiles: ['base', 'collision'] })

    expect(process.env).toHaveProperty(
      'DATABASE_URL',
      'postgresql://user:password@localhost:5432/mydb'
    )
    expect(process.env).toHaveProperty('TEST_BASE', '1')
    expect(process.env).toHaveProperty('TEST_COLLISION', '1')
  })

  it('loads .env files based on NODE_ENV ', () => {
    expect(process.env).not.toHaveProperty('PROD_DATABASE_URL')
    expect(process.env).not.toHaveProperty('BAZINGA')

    process.env.NODE_ENV = 'bazinga'
    const fn = addAdditionalEnvFiles(
      path.join(__dirname, '__fixtures__/redwood-app-env-node-env')
    )
    fn({})

    expect(process.env).toHaveProperty(
      'PROD_DATABASE_URL',
      'postgresql://user:password@localhost:5432/bazinga'
    )
    expect(process.env).toHaveProperty('BAZINGA', '1')
  })

  it('loads .env files based on NODE_ENV last', () => {
    expect(process.env).not.toHaveProperty('PROD_DATABASE_URL')
    expect(process.env).not.toHaveProperty('BAZINGA')

    process.env.NODE_ENV = 'bazinga'
    const fn = addAdditionalEnvFiles(
      path.join(__dirname, '__fixtures__/redwood-app-env-node-env')
    )
    fn({
      includeEnvFiles: ['prod'],
    })

    expect(process.env).toHaveProperty(
      'PROD_DATABASE_URL',
      'postgresql://user:password@localhost:5432/myproddb'
    )
    expect(process.env).toHaveProperty('BAZINGA', '1')
  })

  it("throws if it can't find a specified env file", () => {
    const fn = addAdditionalEnvFiles(
      path.join(__dirname, '__fixtures__/redwood-app-env-node-env')
    )

    try {
      fn({
        includeEnvFiles: ['missing'],
      })
    } catch (error) {
      // Just testing that the error message reports the file it tried to load.
      expect(error.message).toMatch(/\.env\.missing/)
    }
  })
})
