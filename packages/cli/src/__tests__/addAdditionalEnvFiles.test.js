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
    const fn = addAdditionalEnvFiles()
    fn({})

    const envWithAdditionalEnvFiles = { ...process.env }
    expect(envWithAdditionalEnvFiles).toEqual(originalProcessEnv)
  })

  it("doesn't load .env files if not instructed to", () => {
    const fn = addAdditionalEnvFiles(
      path.join(__dirname, '__fixtures__/redwood-app-env-prod')
    )
    fn({})

    const envWithAdditionalEnvFiles = { ...process.env }
    expect(envWithAdditionalEnvFiles).toEqual(originalProcessEnv)
  })

  it('loads specified .env files', () => {
    expect(process.env).not.toHaveProperty('PROD_DATABASE_URL')

    const fn = addAdditionalEnvFiles(
      path.join(__dirname, '__fixtures__/redwood-app-env-prod')
    )
    fn({ includeEnv: ['prod'] })

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
    fn({ includeEnv: ['dev', 'prod'] })

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

    const fn = addAdditionalEnvFiles(
      path.join(__dirname, '__fixtures__/redwood-app-env-collision')
    )
    fn({ includeEnv: ['base', 'collision'] })

    expect(process.env).toHaveProperty(
      'DATABASE_URL',
      'postgresql://user:password@localhost:5432/mydb'
    )
  })
})
