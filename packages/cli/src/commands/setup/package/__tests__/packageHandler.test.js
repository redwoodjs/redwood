import fs from 'fs'
import path from 'path'

import execa from 'execa'
// import semver from 'semver'

import { handler } from '../packageHandler'

jest.mock('@redwoodjs/project-config', () => {
  const path = require('path')
  return {
    getPaths: () => {
      return {
        base: path.join('mocked', 'project'),
      }
    },
  }
})
jest.mock('fs')
jest.mock('execa')
jest.mock('enquirer')

describe('', () => {
  beforeEach(() => {
    jest.spyOn(console, 'log').mockImplementation(() => {})
    jest.spyOn(console, 'error').mockImplementation(() => {})

    const projectPackageJsonPath = path.join(
      'mocked',
      'project',
      'package.json'
    )
    fs.__setMockFiles({
      [projectPackageJsonPath]: JSON.stringify({
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

  test('fetch failure without force', async () => {
    global.fetch = jest.fn(() => Promise.reject('Some fetch error'))
    try {
      await handler({
        npmPackage: 'test-package',
        force: false,
        options: [],
      })
    } catch (error) {
      expect(error).toEqual('Some fetch error')
    }

    global.fetch = jest.fn(() =>
      Promise.resolve({ json: () => Promise.reject('Some json error') })
    )
    try {
      await handler({
        npmPackage: 'test-package',
        force: false,
        options: [],
      })
    } catch (error) {
      expect(error).toEqual('Some json error')
    }
    expect.assertions(2)
  })

  test('fetch failure with force', async () => {
    global.fetch = jest.fn(() => Promise.reject('Some fetch error'))
    try {
      await handler({
        npmPackage: 'test-package',
        force: true,
        options: [],
      })
    } catch (error) {
      expect(error).toBeUndefined()
    }

    global.fetch = jest.fn(() =>
      Promise.resolve({ json: () => Promise.reject('Some json error') })
    )
    try {
      await handler({
        npmPackage: 'test-package',
        force: true,
        options: [],
      })
    } catch (error) {
      expect(error).not.toEqual('Some json error')
    }

    expect(console.error).toHaveBeenCalledTimes(2)
    expect(execa).toHaveBeenCalledTimes(2)
    expect.assertions(2)
  })

  test('package does not exist', async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        json: () => Promise.resolve({ error: 'Not found' }),
      })
    )

    try {
      await handler({
        npmPackage: 'test-package',
        force: false,
        options: [],
      })
    } catch (error) {
      expect(error).toEqual(
        new Error("The package 'test-package' does not exist")
      )
    }

    try {
      await handler({
        npmPackage: 'test-package',
        force: true,
        options: [],
      })
    } catch (error) {
      expect(error).toEqual(
        new Error("The package 'test-package' does not exist")
      )
    }
    expect.assertions(2)
  })

  test('some packument error', async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        json: () =>
          Promise.resolve({
            error: 'Some other error',
          }),
      })
    )

    try {
      await handler({
        npmPackage: 'test-package',
        force: false,
        options: [],
      })
    } catch (error) {
      expect(error).toEqual(new Error('Some other error'))
    }

    try {
      await handler({
        npmPackage: 'test-package',
        force: true,
        options: [],
      })
    } catch (error) {
      expect(error).not.toEqual(new Error('Some other error'))
    }

    expect.assertions(2)
  })

  test('package does not have requested version', async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        json: () =>
          Promise.resolve({
            versions: {
              '1.0.0': {},
            },
          }),
      })
    )

    try {
      await handler({
        npmPackage: 'test-package@2.0.0',
        force: false,
        options: [],
      })
    } catch (error) {
      expect(error).toEqual(
        new Error("The package 'test-package' does not have a version 2.0.0")
      )
    }

    try {
      await handler({
        npmPackage: 'test-package@2.0.0',
        force: true,
        options: [],
      })
    } catch (error) {
      expect(error).toEqual(
        new Error("The package 'test-package' does not have a version 2.0.0")
      )
    }

    expect.assertions(2)
  })

  test('package does not have requested tag', async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        json: () =>
          Promise.resolve({
            versions: {
              '1.0.0': {},
            },
            'dist-tags': {
              latest: '1.0.0',
            },
          }),
      })
    )

    try {
      await handler({
        npmPackage: 'test-package@canary',
        force: false,
        options: [],
      })
    } catch (error) {
      expect(error).toEqual(
        new Error("The package 'test-package' does not have a tag canary")
      )
    }

    try {
      await handler({
        npmPackage: 'test-package@canary',
        force: true,
        options: [],
      })
    } catch (error) {
      expect(error).toEqual(
        new Error("The package 'test-package' does not have a tag canary")
      )
    }

    expect.assertions(2)
  })

  test('package lacks redwoodjs engine', async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        json: () =>
          Promise.resolve({
            versions: {
              '1.0.0': {},
            },
            'dist-tags': {
              latest: '1.0.0',
            },
          }),
      })
    )

    try {
      await handler({
        npmPackage: 'test-package',
        force: true,
        options: [],
      })
    } catch (error) {
      expect(error).not.toEqual(
        new Error(
          "The package 'test-package' does not specify a RedwoodJS compatibility version/range"
        )
      )
    }
    expect(console.error).toHaveBeenCalledTimes(1)

    try {
      await handler({
        npmPackage: 'test-package',
        force: false,
        options: [],
      })
    } catch (error) {
      expect(error).toEqual(
        new Error(
          "The package 'test-package' does not specify a RedwoodJS compatibility version/range"
        )
      )
    }

    expect.assertions(2)
  })
})

// describe('Project is at 1.0.0', () => {
//   beforeEach(() => {
//     jest.spyOn(console, 'log').mockImplementation(() => {})
//     jest.spyOn(console, 'error').mockImplementation(() => {})

//     const projectPackageJsonPath = path.join(
//       'mocked',
//       'project',
//       'package.json'
//     )
//     fs.__setMockFiles({
//       [projectPackageJsonPath]: JSON.stringify({
//         devDependencies: {
//           '@redwoodjs/core': '1.0.0',
//         },
//       }),
//     })
//   })

//   afterEach(() => {
//     fs.__setMockFiles({})
//     jest.clearAllMocks()
//   })

//   test.each([
//     ['package-name', 'package-name'],
//     ['@scoped/package-name', '@scoped/package-name'],
//     ['package-name@1.0.0', 'package-name'],
//     ['@scoped/package-name@1.0.0', '@scoped/package-name'],
//     ['package-name@latest', 'package-name'],
//     ['@scoped/package-name@latest', '@scoped/package-name'],
//   ])(
//     "The correct package name was used for '%s'",
//     async (packageInput, packageName) => {
//       global.fetch = jest.fn(() =>
//         Promise.resolve({
//           json: () => Promise.resolve({}),
//         })
//       )

//       try {
//         await handler({
//           npmPackage: packageInput,
//           force: false,
//           options: [],
//         })
//       } catch (_error) {
//         // ignore
//       }

//       expect(global.fetch).toHaveBeenCalledWith(
//         `https://registry.npmjs.org/${packageName}`
//       )
//     }
//   )

//   test('Fetch throws without force', async () => {
//     global.fetch = jest.fn(() => Promise.reject('Some fetch error'))
//     try {
//       await handler({
//         npmPackage: 'test-package',
//         force: false,
//         options: [],
//       })
//     } catch (error) {
//       expect(error).toEqual('Some fetch error')
//     }

//     global.fetch = jest.fn(() =>
//       Promise.resolve({ json: () => Promise.reject('Some json error') })
//     )
//     try {
//       await handler({
//         npmPackage: 'test-package',
//         force: false,
//         options: [],
//       })
//     } catch (error) {
//       expect(error).toEqual('Some json error')
//     }

//     expect.assertions(2)
//   })

//   test('Fetch does not throw with force', async () => {
//     global.fetch = jest.fn(() => Promise.reject('Some fetch error'))
//     try {
//       await handler({
//         npmPackage: 'test-package',
//         force: true,
//         options: [],
//       })
//     } catch (error) {
//       expect(error).toBeUndefined()
//     }

//     global.fetch = jest.fn(() =>
//       Promise.resolve({ json: () => Promise.reject('Some json error') })
//     )
//     try {
//       await handler({
//         npmPackage: 'test-package',
//         force: true,
//         options: [],
//       })
//     } catch (error) {
//       expect(error).not.toEqual('Some json error')
//     }
//     // Warnings about fetch failures
//     expect(console.error).toHaveBeenCalledTimes(2)
//     expect.assertions(1)
//   })

//   test("Run package without checks when using '--force' and fetch fails", async () => {
//     global.fetch = jest.fn(() => Promise.reject('Some fetch error'))

//     // Spy on execa
//     execa.mockImplementation(() => Promise.resolve())

//     // Spy on semver
//     jest.spyOn(semver, 'satisfies')
//     jest.spyOn(semver, 'sort')

//     try {
//       await handler({
//         npmPackage: 'test-package',
//         force: true,
//         options: [],
//       })
//     } catch (error) {
//       expect(error).toBeUndefined()
//     }

//     expect(execa).toHaveBeenCalledWith('yarn', ['dlx', 'test-package'], {
//       stdio: 'inherit',
//     })
//     expect(semver.satisfies).not.toHaveBeenCalled()
//     expect(semver.sort).not.toHaveBeenCalled()
//     expect.assertions(3)
//   })

//   test("Run package without checks when using '--force' and fetch fails - with version", async () => {
//     global.fetch = jest.fn(() => Promise.reject('Some fetch error'))

//     // Spy on execa
//     execa.mockImplementation(() => Promise.resolve())

//     // Spy on semver
//     jest.spyOn(semver, 'satisfies')
//     jest.spyOn(semver, 'sort')

//     try {
//       await handler({
//         npmPackage: 'test-package@1.2.3',
//         force: true,
//         options: [],
//       })
//     } catch (error) {
//       expect(error).toBeUndefined()
//     }

//     expect(execa).toHaveBeenCalledWith('yarn', ['dlx', 'test-package@1.2.3'], {
//       stdio: 'inherit',
//     })
//     expect(semver.satisfies).not.toHaveBeenCalled()
//     expect(semver.sort).not.toHaveBeenCalled()
//     expect.assertions(3)
//   })

//   test("Run package without checks when using '--force' and fetch fails - with options", async () => {
//     global.fetch = jest.fn(() => Promise.reject('Some fetch error'))

//     // Spy on execa
//     execa.mockImplementation(() => Promise.resolve())

//     // Spy on semver
//     jest.spyOn(semver, 'satisfies')
//     jest.spyOn(semver, 'sort')

//     try {
//       await handler({
//         npmPackage: 'test-package',
//         force: true,
//         options: ['apple', 'banana'],
//       })
//     } catch (error) {
//       expect(error).toBeUndefined()
//     }

//     expect(execa).toHaveBeenCalledWith(
//       'yarn',
//       ['dlx', 'test-package', 'apple', 'banana'],
//       {
//         stdio: 'inherit',
//       }
//     )
//     expect(semver.satisfies).not.toHaveBeenCalled()
//     expect(semver.sort).not.toHaveBeenCalled()
//     expect.assertions(3)
//   })

//   test("Always throws when the package doesn't exist", async () => {
//     global.fetch = jest.fn(() =>
//       Promise.resolve({
//         json: () => Promise.resolve({ error: 'Not found' }),
//       })
//     )

//     try {
//       await handler({
//         npmPackage: 'test-package',
//         force: false,
//         options: [],
//       })
//     } catch (error) {
//       expect(error).toEqual(
//         new Error("The package 'test-package' does not exist")
//       )
//     }

//     try {
//       await handler({
//         npmPackage: 'test-package',
//         force: true,
//         options: [],
//       })
//     } catch (error) {
//       expect(error).toEqual(
//         new Error("The package 'test-package' does not exist")
//       )
//     }

//     expect.assertions(2)
//   })

//   test("Throws for some packument error when not using '--force'", async () => {
//     global.fetch = jest.fn(() =>
//       Promise.resolve({
//         json: () =>
//           Promise.resolve({
//             error: 'Some other error',
//           }),
//       })
//     )

//     try {
//       await handler({
//         npmPackage: 'test-package',
//         force: false,
//         options: [],
//       })
//     } catch (error) {
//       expect(error).toEqual(new Error('Some other error'))
//     }

//     expect.assertions(1)
//   })

//   test("Does not throw for some packument error when not using '--force'", async () => {
//     global.fetch = jest.fn(() =>
//       Promise.resolve({
//         json: () =>
//           Promise.resolve({
//             error: 'Some other error',
//           }),
//       })
//     )

//     try {
//       await handler({
//         npmPackage: 'test-package',
//         force: true,
//         options: [],
//       })
//     } catch (error) {
//       expect(error).not.toEqual(new Error('Some other error'))
//     }

//     expect(console.error).toHaveBeenCalledTimes(3)
//     expect.assertions(2)
//   })

//   test("Always throws when the package doesn't have the requested version", async () => {
//     global.fetch = jest.fn(() =>
//       Promise.resolve({
//         json: () =>
//           Promise.resolve({
//             versions: {
//               '1.0.0': {},
//             },
//           }),
//       })
//     )

//     try {
//       await handler({
//         npmPackage: 'test-package@2.0.0',
//         force: false,
//         options: [],
//       })
//     } catch (error) {
//       expect(error).toEqual(
//         new Error("The package 'test-package' does not have a version 2.0.0")
//       )
//     }

//     try {
//       await handler({
//         npmPackage: 'test-package@2.0.0',
//         force: true,
//         options: [],
//       })
//     } catch (error) {
//       expect(error).toEqual(
//         new Error("The package 'test-package' does not have a version 2.0.0")
//       )
//     }

//     expect.assertions(2)
//   })

//   test('Always throws when no version can be decided on', async () => {
//     global.fetch = jest.fn(() =>
//       Promise.resolve({
//         json: () => Promise.resolve({}),
//       })
//     )

//     try {
//       await handler({
//         npmPackage: 'test-package',
//         force: false,
//         options: [],
//       })
//     } catch (error) {
//       expect(error).toEqual(
//         new Error(
//           "No version was specified and no latest version was found for 'test-package'"
//         )
//       )
//     }

//     try {
//       await handler({
//         npmPackage: 'test-package',
//         force: true,
//         options: [],
//       })
//     } catch (error) {
//       expect(error).toEqual(
//         new Error(
//           "No version was specified and no latest version was found for 'test-package'"
//         )
//       )
//     }

//     expect.assertions(2)
//   })

//   test("Throws without '--force' when the package doesn't have a peer dependency on @redwoodjs/core", async () => {
//     global.fetch = jest.fn(() =>
//       Promise.resolve({
//         json: () =>
//           Promise.resolve({
//             versions: {
//               '1.0.0': {},
//             },
//           }),
//       })
//     )

//     try {
//       await handler({
//         npmPackage: 'test-package@1.0.0',
//         force: false,
//         options: [],
//       })
//     } catch (error) {
//       expect(error).toEqual(
//         new Error(
//           "The package 'test-package' does not have a peer dependency on '@redwoodjs/core'"
//         )
//       )
//     }

//     expect.assertions(1)
//   })

//   test.each([
//     ['package-name', 'package-name@2.0.0'],
//     ['@scoped/package-name', '@scoped/package-name@2.0.0'],
//     ['package-name@1.0.0', 'package-name@1.0.0'],
//     ['@scoped/package-name@1.0.0', '@scoped/package-name@1.0.0'],
//     ['package-name@latest', 'package-name@2.0.0'],
//     ['@scoped/package-name@latest', '@scoped/package-name@2.0.0'],
//   ])(
//     "The correct package version was used for '%s'",
//     async (packageInput, packageVersion) => {
//       global.fetch = jest.fn(() =>
//         Promise.resolve({
//           json: () =>
//             Promise.resolve({
//               versions: {
//                 '1.0.0': {
//                   peerDependencies: {
//                     '@redwoodjs/core': '1.0.0',
//                   },
//                 },
//                 '2.0.0': {
//                   peerDependencies: {
//                     '@redwoodjs/core': '1.0.0',
//                   },
//                 },
//               },
//               'dist-tags': {
//                 latest: '2.0.0',
//               },
//             }),
//         })
//       )

//       // Spy on execa
//       execa.mockImplementation(() => Promise.resolve())

//       try {
//         await handler({
//           npmPackage: packageInput,
//           force: false,
//           options: [],
//         })
//       } catch (error) {
//         expect(error).toBeUndefined()
//       }
//       expect(execa).toHaveBeenCalledWith('yarn', ['dlx', packageVersion], {
//         stdio: 'inherit',
//       })
//     }
//   )
// })
