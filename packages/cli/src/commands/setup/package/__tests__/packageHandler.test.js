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

import fs from 'fs'
import path from 'path'

import execa from 'execa'

import { getCompatibilityData } from '@redwoodjs/cli-helpers'

import { handler } from '../packageHandler'

const { Select } = require('enquirer')

describe('', () => {
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
    await handler({ npmPackage: 'some-package', force: true, options: [] })

    expect(console.log).toHaveBeenCalledWith(
      'No compatibility check will be performed because you used the --force flag.'
    )
    expect(getCompatibilityData).not.toHaveBeenCalled()
  })

  test('using force warns of experimental package if possible', async () => {
    await handler({
      npmPackage: 'some-package',
      force: true,
      options: [],
    })
    await handler({
      npmPackage: 'some-package@latest',
      force: true,
      options: [],
    })
    expect(console.log).not.toHaveBeenCalledWith(
      'Be aware that this package is under version 1.0.0 and so should be considered experimental.'
    )

    await handler({
      npmPackage: 'some-package@0.0.1',
      force: true,
      options: [],
    })
    expect(console.log).toHaveBeenCalledWith(
      'Be aware that this package is under version 1.0.0 and so should be considered experimental.'
    )
  })

  test('no compatible version throws an error', async () => {
    getCompatibilityData.mockImplementation(() => {
      return null
    })

    await expect(
      handler({ npmPackage: 'some-package', force: false, options: [] })
    ).rejects.toThrowErrorMatchingInlineSnapshot(
      `"No compatible version of 'some-package' was found."`
    )
  })

  test('default of latest is compatible', async () => {
    getCompatibilityData.mockImplementation(() => {
      return {
        preferred: {
          version: '1.0.0',
          tag: 'latest',
        },
        latestCompatible: {
          version: '1.0.0',
          tag: 'latest',
        },
      }
    })

    await handler({ npmPackage: 'some-package', force: false, options: [] })
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
        latestCompatible: {
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
    await handler({ npmPackage: 'some-package', force: false, options: [] })
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
    await handler({ npmPackage: 'some-package', force: false, options: [] })
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
    await handler({ npmPackage: 'some-package', force: false, options: [] })
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
        latestCompatible: {
          version: '1.0.0',
          tag: 'stable',
        },
      }
    })

    await handler({
      npmPackage: 'some-package@stable',
      force: false,
      options: [],
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
        latestCompatible: {
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
      options: [],
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
      options: [],
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
      options: [],
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
        latestCompatible: {
          version: '1.0.0',
          tag: 'latest',
        },
      }
    })

    await handler({
      npmPackage: 'some-package@1.0.0',
      force: false,
      options: [],
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
        latestCompatible: {
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
      options: [],
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
      options: [],
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
      options: [],
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
        latestCompatible: {
          version: '0.0.1',
          tag: 'latest',
        },
      }
    })

    // Force should just log to the console
    await handler({
      npmPackage: 'some-package@0.0.1',
      force: true,
      options: [],
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
      options: [],
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
