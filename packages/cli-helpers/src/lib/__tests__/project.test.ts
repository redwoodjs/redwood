import fs from 'fs'

// import toml from 'toml' // Make sure to import 'toml' or an equivalent library

// import { updateTomlConfig, addEnvVar } from '../project' // Replace with the correct path to your module
import { addEnvVar } from '../project' // Replace with the correct path to your module

jest.mock('fs')

jest.mock('@redwoodjs/project-config', () => {
  return {
    getPaths: () => {
      return {
        generated: {
          base: '.redwood',
        },
        base: '',
      }
    },
    getConfig: jest.fn(),
  }
})

describe('addEnvVar adds environment variables as part of a setup task', () => {
  let envFileContent = ''

  describe('addEnvVar adds environment variables as part of a setup task', () => {
    beforeEach(() => {
      jest.spyOn(fs, 'existsSync').mockImplementation(() => {
        return true
      })

      jest.spyOn(fs, 'readFileSync').mockImplementation(() => {
        return envFileContent
      })

      jest.spyOn(fs, 'writeFileSync').mockImplementation((envPath, envFile) => {
        expect(envPath).toContain('.env')
        return envFile
      })
    })

    afterEach(() => {
      // Restore the original implementations of fs.existsSync and fs.readFileSync
      jest.restoreAllMocks()
      envFileContent = ''
    })

    it('should add a new environment variable when it does not exist (overwrite: false)', () => {
      envFileContent = 'EXISTING_VAR=value\n# CommentedVar=123\n'
      const file = addEnvVar(
        'NEW_VAR',
        'new_value',
        'New Variable Comment',
        false
      )
      expect(file).toMatchSnapshot()
    })

    it('should updates an existing environment variable when it exists and overwrite chosen', () => {
      envFileContent = 'EXISTING_VAR=value\n# CommentedVar=123\n'
      const file = addEnvVar(
        'EXISTING_VAR',
        'new_value',
        'Updated existing variable Comment',
        true
      )
      expect(file).toMatchSnapshot()
    })

    it('should not update existing environment variable if exists and overwrite is default', () => {
      envFileContent = 'EXISTING_VAR=value\n# CommentedVar=123\n'
      const file = addEnvVar(
        'EXISTING_VAR',
        'new_value',
        'Updated existing variable Comment'
      )
      expect(file).toMatchSnapshot()
    })

    it('should not update existing environment variable if exists and overwrite is false', () => {
      envFileContent = 'EXISTING_VAR=value\n# CommentedVar=123\n'
      const file = addEnvVar(
        'EXISTING_VAR',
        'new_value',
        'Updated existing variable Comment',
        false
      )
      expect(file).toMatchSnapshot()
    })
  })
})

// describe('updateTomlConfig', () => {
//   const redwoodTomlPath = 'fake-path-to-redwood-toml'
//   const packageName = 'test-package-name'

//   beforeEach(() => {
//     // Reset the mocked functions and data
//     ;(fs.readFileSync as jest.Mock).mockClear()
//     ;(fs.writeFileSync as jest.Mock).mockClear()
//     ;(toml.parse as jest.Mock).mockClear()
//   })

//   test('it should update the configuration with a new package', () => {
//     const existingConfig = {
//       experimental: {
//         cli: {
//           plugins: [{ package: 'existing-package' }],
//         },
//       },
//     }

//     const expectedNewConfig = {
//       experimental: {
//         cli: {
//           plugins: [{ package: 'existing-package' }, { package: packageName }],
//         },
//       },
//     }

//     ;(fs.readFileSync as jest.Mock).mockReturnValue(
//       JSON.stringify(existingConfig)
//     )
//     ;(toml.parse as jest.Mock).mockReturnValue(existingConfig)

//     updateTomlConfig(packageName)

//     expect(fs.readFileSync).toHaveBeenCalledWith(redwoodTomlPath, 'utf-8')
//     expect(fs.writeFileSync).toHaveBeenCalledWith(
//       redwoodTomlPath,
//       toml(expectedNewConfig),
//       'utf-8'
//     )
//   })

//   test('it should add missing configuration sections and the package', () => {
//     // Simulate a missing 'experimental.cli' section in the configuration
//     const existingConfig = {}

//     const expectedNewConfig = {
//       experimental: {
//         cli: {
//           autoInstall: true,
//           plugins: [{ package: packageName }],
//         },
//       },
//     }

//     fs.readFileSync.mockReturnValue('')
//     toml.parse.mockReturnValue(existingConfig)

//     updateTomlConfig(packageName)

//     expect(fs.readFileSync).toHaveBeenCalledWith(redwoodTomlPath, 'utf-8')
//     expect(fs.writeFileSync).toHaveBeenCalledWith(
//       redwoodTomlPath,
//       toml.dump(expectedNewConfig),
//       'utf-8'
//     )
//   })

//   // Add more test cases for different scenarios (e.g., autoInstall already set, etc.)
// })
