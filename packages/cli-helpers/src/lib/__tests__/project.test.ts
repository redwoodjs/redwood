import fs from 'fs'

import { updateTomlConfig, addEnvVar } from '../project' // Replace with the correct path to your module

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
    getConfigPath: () => {
      return '.redwood.toml'
    },
    getConfig: jest.fn(),
  }
})

describe('addEnvVar', () => {
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

describe('updateTomlConfig', () => {
  let tomlFileContent = `
[web]
  title = "Redwood App"
  port = 8910
  apiUrl = "/.redwood/functions" # You can customize graphql and dbauth urls individually too: see https://redwoodjs.com/docs/app-configuration-redwood-toml#api-paths
  includeEnvironmentVariables = [
    # Add any ENV vars that should be available to the web side to this array
    # See https://redwoodjs.com/docs/environment-variables#web
  ]
[api]
  port = 8911
[browser]
  open = false
[notifications]
  versionUpdates = ["latest"]
`

  describe('updateTomlConfig configures a new CLI plugin', () => {
    beforeEach(() => {
      jest.spyOn(fs, 'existsSync').mockImplementation(() => {
        return true
      })

      jest.spyOn(fs, 'readFileSync').mockImplementation(() => {
        return tomlFileContent
      })

      jest
        .spyOn(fs, 'writeFileSync')
        .mockImplementation((tomlPath, tomlFile) => {
          expect(tomlPath).toContain('redwood.toml')
          return tomlFile
        })
    })

    afterEach(() => {
      jest.restoreAllMocks()
      tomlFileContent = ''
    })

    it('adds when experimental cli is not configured', () => {
      tomlFileContent += ''
      const file = updateTomlConfig('@example/test-package-name')
      expect(file).toMatchSnapshot()
    })

    it('adds when experimental cli has some plugins configured', () => {
      tomlFileContent += `
[experimental.cli]
  autoInstall = true
  [[experimental.cli.plugins]]
    package = "@existing-example/some-package-name"
`
      const file = updateTomlConfig('@example/test-package-name')
      expect(file).toMatchSnapshot()
    })

    it('adds when experimental cli is setup but has no plugins configured', () => {
      tomlFileContent += `
[experimental.cli]
  autoInstall = true
`
      const file = updateTomlConfig('@example/test-package-name')
      expect(file).toMatchSnapshot()
    })

    it('does not add duplicate place when experimental cli has that plugin configured', () => {
      tomlFileContent += `
[experimental.cli]
  autoInstall = true
  [[experimental.cli.plugins]]
    package = "@existing-example/some-package-name"
`
      const file = updateTomlConfig('@existing-example/some-package-name')
      expect(file).toMatchSnapshot()
    })
  })
})
