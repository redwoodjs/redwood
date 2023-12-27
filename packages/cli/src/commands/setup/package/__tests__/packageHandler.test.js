jest.mock('@redwoodjs/project-config', () => {
  return {
    getPaths: () => {
      const path = require('path')
      return {
        base: path.join('mocked', 'project'),
      }
    },
  }
})
jest.mock('@redwoodjs/cli-helpers', () => {
  return {
    getCompatibilityData: jest.fn(() => {
      throw new Error('Mock Not Implemented')
    }),
  }
})
jest.mock('fs')
jest.mock('execa', () =>
  jest.fn((cmd, params) => ({
    cmd,
    params,
  }))
)
jest.mock('enquirer', () => {
  return {
    Select: jest.fn(() => {
      return {
        run: jest.fn(() => {
          throw new Error('Mock Not Implemented')
        }),
      }
    }),
  }
})

import path from 'path'

import execa from 'execa'
import fs from 'fs-extra'

import { getCompatibilityData } from '@redwoodjs/cli-helpers'

import { handler } from '../packageHandler'

const { Select } = require('enquirer')

describe('packageHandler', () => {
  beforeEach(() => {
    jest.spyOn(console, 'log').mockImplementation(() => {})
    jest.spyOn(console, 'error').mockImplementation(() => {})

    fs.__setMockFiles({
      ['package.json']: JSON.stringify({
        devDependencies: {
          '@redwoodjs/core': '1.0.0',
        },
      }),
    })
  })

  afterEach(() => {
    fs.__setMockFiles({})
    jest.clearAllMocks()
  })

  test('using force does not check compatibility', async () => {
    await handler({
      npmPackage: 'some-package',
      force: true,
      _: ['setup', 'package'],
    })

    expect(console.log).toHaveBeenCalledWith(
      'No compatibility check will be performed because you used the --force flag.'
    )
    expect(getCompatibilityData).not.toHaveBeenCalled()
  })

  test('using force warns of experimental package if possible', async () => {
    await handler({
      npmPackage: 'some-package',
      force: true,
      _: ['setup', 'package'],
    })
    await handler({
      npmPackage: 'some-package@latest',
      force: true,
      _: ['setup', 'package'],
    })
    expect(console.log).not.toHaveBeenCalledWith(
      'Be aware that this package is under version 1.0.0 and so should be considered experimental.'
    )

    await handler({
      npmPackage: 'some-package@0.0.1',
      force: true,
      _: ['setup', 'package'],
    })
    expect(console.log).toHaveBeenCalledWith(
      'Be aware that this package is under version 1.0.0 and so should be considered experimental.'
    )
  })

  test('compatiblity check error prompts to continue', async () => {
    getCompatibilityData.mockImplementation(() => {
      throw new Error('No compatible version found')
    })

    Select.mockImplementation(() => {
      return {
        run: jest.fn(() => 'cancel'),
      }
    })
    await handler({
      npmPackage: 'some-package',
      force: false,
      _: ['setup', 'package'],
    })
    expect(Select).toHaveBeenCalledTimes(1)
    expect(execa).not.toHaveBeenCalled()

    Select.mockImplementation(() => {
      return {
        run: jest.fn(() => 'continue'),
      }
    })
    await handler({
      npmPackage: 'some-package',
      force: false,
      _: ['setup', 'package'],
    })
    expect(Select).toHaveBeenCalledTimes(2)
    expect(execa).toHaveBeenCalledWith('yarn', ['dlx', 'some-package@latest'], {
      stdio: 'inherit',
      cwd: path.join('mocked', 'project'),
    })
  })

  test('default of latest is compatible', async () => {
    getCompatibilityData.mockImplementation(() => {
      return {
        preferred: {
          version: '1.0.0',
          tag: 'latest',
        },
        compatible: {
          version: '1.0.0',
          tag: 'latest',
        },
      }
    })

    await handler({
      npmPackage: 'some-package',
      force: false,
      _: ['setup', 'package'],
    })
    expect(getCompatibilityData).toHaveBeenCalledWith('some-package', 'latest')
    expect(execa).toHaveBeenCalledWith('yarn', ['dlx', 'some-package@1.0.0'], {
      stdio: 'inherit',
      cwd: path.join('mocked', 'project'),
    })
  })

  test('default of latest is not compatible', async () => {
    getCompatibilityData.mockImplementation(() => {
      return {
        preferred: {
          version: '2.0.0',
          tag: 'latest',
        },
        compatible: {
          version: '1.0.0',
          tag: undefined,
        },
      }
    })

    Select.mockImplementation(() => {
      return {
        run: jest.fn(() => 'useLatestCompatibleVersion'),
      }
    })
    await handler({
      npmPackage: 'some-package',
      force: false,
      _: ['setup', 'package'],
    })
    expect(getCompatibilityData).toHaveBeenNthCalledWith(
      1,
      'some-package',
      'latest'
    )
    expect(Select).toHaveBeenCalledTimes(1)
    expect(execa).toHaveBeenNthCalledWith(
      1,
      'yarn',
      ['dlx', 'some-package@1.0.0'],
      {
        stdio: 'inherit',
        cwd: path.join('mocked', 'project'),
      }
    )

    Select.mockImplementation(() => {
      return {
        run: jest.fn(() => 'usePreferredVersion'),
      }
    })
    await handler({
      npmPackage: 'some-package',
      force: false,
      _: ['setup', 'package'],
    })
    expect(getCompatibilityData).toHaveBeenNthCalledWith(
      2,
      'some-package',
      'latest'
    )
    expect(Select).toHaveBeenCalledTimes(2)
    expect(execa).toHaveBeenNthCalledWith(
      2,
      'yarn',
      ['dlx', 'some-package@2.0.0'],
      {
        stdio: 'inherit',
        cwd: path.join('mocked', 'project'),
      }
    )

    Select.mockImplementation(() => {
      return {
        run: jest.fn(() => 'cancel'),
      }
    })
    await handler({
      npmPackage: 'some-package',
      force: false,
      _: ['setup', 'package'],
    })
    expect(getCompatibilityData).toHaveBeenNthCalledWith(
      3,
      'some-package',
      'latest'
    )
    expect(Select).toHaveBeenCalledTimes(3)
    expect(execa).toBeCalledTimes(2) // Only called for the previous two select options
  })

  test('tag is compatible', async () => {
    getCompatibilityData.mockImplementation(() => {
      return {
        preferred: {
          version: '1.0.0',
          tag: 'stable',
        },
        compatible: {
          version: '1.0.0',
          tag: 'stable',
        },
      }
    })

    await handler({
      npmPackage: 'some-package@stable',
      force: false,
      _: ['setup', 'package'],
    })

    expect(getCompatibilityData).toHaveBeenCalledWith('some-package', 'stable')
    expect(execa).toHaveBeenCalledWith('yarn', ['dlx', 'some-package@1.0.0'], {
      stdio: 'inherit',
      cwd: path.join('mocked', 'project'),
    })
  })

  test('tag is not compatible', async () => {
    getCompatibilityData.mockImplementation(() => {
      return {
        preferred: {
          version: '2.0.0',
          tag: 'stable',
        },
        compatible: {
          version: '1.0.0',
          tag: undefined,
        },
      }
    })

    Select.mockImplementation(() => {
      return {
        run: jest.fn(() => 'useLatestCompatibleVersion'),
      }
    })
    await handler({
      npmPackage: 'some-package@stable',
      force: false,
      _: ['setup', 'package'],
    })
    expect(getCompatibilityData).toHaveBeenNthCalledWith(
      1,
      'some-package',
      'stable'
    )
    expect(Select).toHaveBeenCalledTimes(1)
    expect(execa).toHaveBeenNthCalledWith(
      1,
      'yarn',
      ['dlx', 'some-package@1.0.0'],
      {
        stdio: 'inherit',
        cwd: path.join('mocked', 'project'),
      }
    )

    Select.mockImplementation(() => {
      return {
        run: jest.fn(() => 'usePreferredVersion'),
      }
    })
    await handler({
      npmPackage: 'some-package@stable',
      force: false,
      _: ['setup', 'package'],
    })
    expect(getCompatibilityData).toHaveBeenNthCalledWith(
      2,
      'some-package',
      'stable'
    )
    expect(Select).toHaveBeenCalledTimes(2)
    expect(execa).toHaveBeenNthCalledWith(
      2,
      'yarn',
      ['dlx', 'some-package@2.0.0'],
      {
        stdio: 'inherit',
        cwd: path.join('mocked', 'project'),
      }
    )

    Select.mockImplementation(() => {
      return {
        run: jest.fn(() => 'cancel'),
      }
    })
    await handler({
      npmPackage: 'some-package@stable',
      force: false,
      _: ['setup', 'package'],
    })
    expect(getCompatibilityData).toHaveBeenNthCalledWith(
      3,
      'some-package',
      'stable'
    )
    expect(Select).toHaveBeenCalledTimes(3)
    expect(execa).toBeCalledTimes(2) // Only called for the previous two select options
  })

  test('specific version is compatible', async () => {
    getCompatibilityData.mockImplementation(() => {
      return {
        preferred: {
          version: '1.0.0',
          tag: 'latest',
        },
        compatible: {
          version: '1.0.0',
          tag: 'latest',
        },
      }
    })

    await handler({
      npmPackage: 'some-package@1.0.0',
      force: false,
      _: ['setup', 'package'],
    })
    expect(getCompatibilityData).toHaveBeenCalledWith('some-package', '1.0.0')
    expect(execa).toHaveBeenCalledWith('yarn', ['dlx', 'some-package@1.0.0'], {
      stdio: 'inherit',
      cwd: path.join('mocked', 'project'),
    })
  })

  test('specific version is not compatible', async () => {
    getCompatibilityData.mockImplementation(() => {
      return {
        preferred: {
          version: '2.0.0',
          tag: 'latest',
        },
        compatible: {
          version: '1.0.0',
          tag: undefined,
        },
      }
    })

    Select.mockImplementation(() => {
      return {
        run: jest.fn(() => 'useLatestCompatibleVersion'),
      }
    })
    await handler({
      npmPackage: 'some-package@1.0.0',
      force: false,
      _: ['setup', 'package'],
    })
    expect(getCompatibilityData).toHaveBeenNthCalledWith(
      1,
      'some-package',
      '1.0.0'
    )
    expect(Select).toHaveBeenCalledTimes(1)
    expect(execa).toHaveBeenNthCalledWith(
      1,
      'yarn',
      ['dlx', 'some-package@1.0.0'],
      {
        stdio: 'inherit',
        cwd: path.join('mocked', 'project'),
      }
    )

    Select.mockImplementation(() => {
      return {
        run: jest.fn(() => 'usePreferredVersion'),
      }
    })
    await handler({
      npmPackage: 'some-package@1.0.0',
      force: false,
      _: ['setup', 'package'],
    })
    expect(getCompatibilityData).toHaveBeenNthCalledWith(
      2,
      'some-package',
      '1.0.0'
    )
    expect(Select).toHaveBeenCalledTimes(2)
    expect(execa).toHaveBeenNthCalledWith(
      2,
      'yarn',
      ['dlx', 'some-package@2.0.0'],
      {
        stdio: 'inherit',
        cwd: path.join('mocked', 'project'),
      }
    )

    Select.mockImplementation(() => {
      return {
        run: jest.fn(() => 'cancel'),
      }
    })
    await handler({
      npmPackage: 'some-package@1.0.0',
      force: false,
      _: ['setup', 'package'],
    })
    expect(getCompatibilityData).toHaveBeenNthCalledWith(
      3,
      'some-package',
      '1.0.0'
    )
    expect(Select).toHaveBeenCalledTimes(3)
    expect(execa).toBeCalledTimes(2) // Only called for the previous two select options
  })

  test('specific version is experimental', async () => {
    getCompatibilityData.mockImplementation(() => {
      return {
        preferred: {
          version: '0.0.1',
          tag: 'latest',
        },
        compatible: {
          version: '0.0.1',
          tag: 'latest',
        },
      }
    })

    // Force should just log to the console
    await handler({
      npmPackage: 'some-package@0.0.1',
      force: true,
      _: ['setup', 'package'],
    })
    expect(console.log).toHaveBeenCalledWith(
      'Be aware that this package is under version 1.0.0 and so should be considered experimental.'
    )

    // No force should prompt
    Select.mockImplementation(() => {
      return {
        run: jest.fn(() => 'useLatestCompatibleVersion'),
      }
    })
    await handler({
      npmPackage: 'some-package@0.0.1',
      force: false,
      _: ['setup', 'package'],
    })
    expect(getCompatibilityData).toHaveBeenNthCalledWith(
      1,
      'some-package',
      '0.0.1'
    )
    expect(Select).toHaveBeenCalledTimes(1)
    expect(execa).toHaveBeenNthCalledWith(
      1,
      'yarn',
      ['dlx', 'some-package@0.0.1'],
      {
        stdio: 'inherit',
        cwd: path.join('mocked', 'project'),
      }
    )
  })
})
