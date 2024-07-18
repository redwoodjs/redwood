import fs from 'fs'

import { vi, describe, it, expect } from 'vitest'

import { getPaths } from '@redwoodjs/project-config'

import { handler } from '../commands/storybookHandler'

vi.mock('fs')

vi.mock('@redwoodjs/project-config', () => {
  return {
    getPaths: vi.fn(() => {
      return {
        base: '/redwood-app',
        web: {
          base: '/redwood-app/web',
          storybook: '/redwood-app/web/src/storybook',
        },
        generated: {
          types: {
            includes: '/redwood-app/web/src/generated',
          },
        },
      }
    }),
  }
})

vi.mock('execa', () => {
  return {
    default: {
      command: vi.fn(() => {
        return {
          stdout: 42,
        }
      }),
    },
  }
})

describe('storybookHandler', () => {
  it('adds the config files', async () => {
    const redwoodProjectPath = '/redwood-app'
    process.env.RWJS_CWD = redwoodProjectPath

    const options = {
      open: true,
      build: false,
      ci: false,
      port: 7910,
      buildDirectory: 'public/storybook',
      smokeTest: false,
    }
    await handler(options)

    // We check that we would have written out the two files to the correct
    // locations
    // Note: The `undefined` here is because the contents to the writeFileSync
    // are undefined during tests because we are also mocking the readFileSync
    // function and this means the templates are undefined.
    const storybookConfigPath = getPaths().web.storybook
    expect(fs.writeFileSync).toHaveBeenCalledTimes(2)
    expect(fs.writeFileSync).toHaveBeenNthCalledWith(
      1,
      `${storybookConfigPath}/main.ts`,
      undefined,
    )
    expect(fs.writeFileSync).toHaveBeenNthCalledWith(
      2,
      `${storybookConfigPath}/preview-body.html`,
      undefined,
    )

    // TODO add tests to verify content...
  })
})
