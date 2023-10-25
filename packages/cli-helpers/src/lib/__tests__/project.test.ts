import fs from 'fs'

import toml from '@iarna/toml'

import { updateTomlConfig, addEnvVar } from '../project' // Replace with the correct path to your module

jest.mock('fs')

const defaultRedwoodToml = {
  web: {
    title: 'Redwood App',
    port: 8910,
    apiUrl: '/.redwood/functions',
    includeEnvironmentVariables: [],
  },
  api: {
    port: 8911,
  },
}

const getRedwoodToml = () => {
  return defaultRedwoodToml
}

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
    getConfig: () => {
      return getRedwoodToml()
    },
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

    it('should add a new environment variable when it does not exist', () => {
      envFileContent = 'EXISTING_VAR = value\n# CommentedVar = 123\n'
      const file = addEnvVar('NEW_VAR', 'new_value', 'New Variable Comment')

      expect(file).toMatchSnapshot()
    })

    it('should add a new environment variable when it does not exist when existing envars have no spacing', () => {
      envFileContent = 'EXISTING_VAR=value\n# CommentedVar = 123\n'
      const file = addEnvVar('NEW_VAR', 'new_value', 'New Variable Comment')

      expect(file).toMatchSnapshot()
    })

    it('should add a comment that the existing environment variable value was not changed, but include its new value as a comment', () => {
      envFileContent = 'EXISTING_VAR=value\n# CommentedVar=123\n'
      const file = addEnvVar(
        'EXISTING_VAR',
        'new_value',
        'Updated existing variable Comment'
      )

      expect(file).toMatchSnapshot()
    })

    it('should handle existing environment variables with quoted values', () => {
      envFileContent = `EXISTING_VAR = "value"\n# CommentedVar = 123\n`
      const file = addEnvVar('EXISTING_VAR', 'value', 'New Variable Comment')

      expect(file).toMatchSnapshot()
    })

    it('should handle existing environment variables with quoted values and no spacing', () => {
      envFileContent = `EXISTING_VAR="value"\n# CommentedVar=123\n`
      const file = addEnvVar('EXISTING_VAR', 'value', 'New Variable Comment')

      expect(file).toMatchSnapshot()
    })

    it('should handle existing environment variables and new value with quoted values by not updating the original value', () => {
      envFileContent = `EXISTING_VAR = "value"\n# CommentedVar = 123\n`
      const file = addEnvVar(
        'EXISTING_VAR',
        'new_value',
        'New Variable Comment'
      )

      expect(file).toMatchSnapshot()
    })
  })
})

describe('updateTomlConfig', () => {
  describe('updateTomlConfig configures a new CLI plugin', () => {
    beforeEach(() => {
      jest.spyOn(fs, 'existsSync').mockImplementation(() => {
        return true
      })

      jest.spyOn(fs, 'readFileSync').mockImplementation(() => {
        return toml.stringify(defaultRedwoodToml)
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
    })

    it('adds when experimental cli is not configured', () => {
      const file = updateTomlConfig(
        '@example/test-package-when-cli-not-configured'
      )
      expect(file).toMatchSnapshot()
    })

    it('adds when experimental cli has some plugins configured', () => {
      defaultRedwoodToml['experimental'] = {
        cli: {
          autoInstall: true,
          plugins: [
            {
              package:
                '@existing-example/some-package-when-cli-has-some-packages-configured',
            },
          ],
        },
      }

      const file = updateTomlConfig('@example/test-package-name')
      expect(file).toMatchSnapshot()
    })

    it('adds when experimental cli is setup but has no plugins configured', () => {
      defaultRedwoodToml['experimental'] = {
        cli: {
          autoInstall: true,
        },
      }

      const file = updateTomlConfig(
        '@example/test-package-when-no-plugins-configured'
      )

      expect(file).toMatchSnapshot()
    })

    it('adds package but keeps autoInstall false', () => {
      defaultRedwoodToml['experimental'] = {
        cli: {
          autoInstall: false,
        },
      }

      const file = updateTomlConfig(
        '@example/test-package-when-autoInstall-false'
      )

      expect(file).toMatchSnapshot()
    })

    it('does not add duplicate place when experimental cli has that plugin configured', () => {
      defaultRedwoodToml['experimental'] = {
        cli: {
          autoInstall: true,
          plugins: [
            {
              package: '@existing-example/some-package-name-already-exists',
            },
          ],
        },
      }

      const file = updateTomlConfig(
        '@existing-example/some-package-name-already-exists'
      )

      expect(file).toMatchSnapshot()
    })
  })
})
