import fs from 'fs'

import { vol } from 'memfs'

import { getPaths } from '@redwoodjs/project-config'

import { handler } from '../commands/storybookHandler'

jest.mock('fs', () => require('memfs').fs)

jest.mock('execa', () => {
  return {
    command: jest.fn(() => {
      return {
        stdout: 42,
      }
    }),
  }
})

describe('storybookHandler', () => {
  it('adds the config files', async () => {
    const redwoodProjectPath = '/redwood-app'
    process.env.RWJS_CWD = redwoodProjectPath

    vol.fromNestedJSON(
      {
        'redwood.toml': '',
        web: {},
      },
      redwoodProjectPath,
    )

    const options = {
      open: true,
      build: false,
      ci: false,
      port: 7910,
      buildDirectory: 'public/storybook',
      smokeTest: false,
    }
    const webPath = getPaths().web.base
    console.log('web dir', fs.readdirSync(webPath))

    await handler(options)

    const storybookConfigPath = getPaths().web.storybook

    expect(fs.readdirSync(storybookConfigPath)).toEqual([
      'main.ts',
      'preview-body.html',
    ])
    // TODO add tests to verify content...
  })
})
