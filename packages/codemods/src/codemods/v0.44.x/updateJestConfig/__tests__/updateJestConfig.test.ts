import updateJestConfig from '../updateJestConfig'

jest.mock('../../../../lib/fetchFileFromTemplate', () =>
  jest.fn((_tag, file) => {
    if (file === 'jest.config.js') {
      return [
        '// This the Redwood root jest config',
        '// Each side, e.g. ./web/ and ./api/ has specific config that references this root',
        '// More info at https://redwoodjs.com/docs/project-configuration-dev-test-build',
        '',
        'module.exports = {',
        "  rootDir: '.',",
        "  projects: ['<rootDir>/{*,!(node_modules)/**/}/jest.config.js'],",
        '}',
      ].join('\n')
    }

    return [
      '// More info at https://redwoodjs.com/docs/project-configuration-dev-test-build',
      '',
      'const config = {',
      "  rootDir: '../',",
      `  preset: '@redwoodjs/testing/config/jest/${
        file.match(/(?<side>api|web)/).groups.side
      }',`,
      '}',
      '',
      'module.exports = config',
    ].join('\n')
  })
)

describe('Update Jest Config', () => {
  it('Adds missing files', async () => {
    await matchFolderTransform(updateJestConfig, 'missing', {
      removeWhitespace: true,
    })
  })

  it('Keeps custom jest config in api and web', async () => {
    jest.setTimeout(25_000)

    await matchFolderTransform(updateJestConfig, 'custom', {
      removeWhitespace: true,
    })
  })
})
