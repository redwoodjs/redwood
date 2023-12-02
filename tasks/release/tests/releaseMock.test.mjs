import { jest } from '@jest/globals'
import chalk from 'chalk'

jest.unstable_mockModule('zx', () => {
  return {
    $: jest.fn(() => {
      return {
        stdout: '',
      }
    }),
    question: jest.fn(),
    chalk,
    fs: {
      readJSONSync: jest.fn(() => {
        throw { code: 'ENOENT' }
      }),
    },
    within: jest.fn(),
  }
})

describe('releaseLib with mocks', () => {
  test("`setUpDataFile` shouldn't throw if the file doesn't exist", async () => {
    const releaseLib = await import('../releaseLib.mjs')

    expect(() => {
      releaseLib.setUpDataFile(
        new URL('./testTriageData.json', import.meta.url)
      )
    }).not.toThrow()
  })

  test("`getRedwoodRemote` returns an error if it can't find the Redwood remote", async () => {
    const releaseLib = await import('../releaseLib.mjs')

    const result = await releaseLib.getRedwoodRemote()

    expect(result).toEqual({
      error:
        "Couldn't find a git remote that points to git@github.com:redwoodjs/redwood.git",
    })
  })

  test('`handleBranchesToCommits` handles branches having commits exclusive to the remote', async () => {
    const releaseLib = await import('../releaseLib.mjs')
    const { question } = await import('zx')

    console.log = jest.fn()

    const result = await releaseLib.handleBranchesToCommits(
      {
        main: {
          existsOnRedwoodRemote: true,
          upToDate: false,
          commitsExclusiveToLocalBranch: 0,
          commitsExclusiveToRemoteBranch: 42,
        },
        next: {
          existsOnRedwoodRemote: true,
          upToDate: false,
          commitsExclusiveToLocalBranch: 0,
          commitsExclusiveToRemoteBranch: 42,
        },
      },
      {
        redwoodRemote: 'origin',
      }
    )

    expect(console.log.mock.calls[0][0]).toMatchInlineSnapshot(`
      "╭ 🐙 Branch status(es) ─────────────────────────────────────────╮
      │[48;5;236m 🧮 [35mmain[39m has...                                                [49m│
      │[48;5;236m    🏠 0 commit(s) locally that the remote branch doesn't have [49m│
      │[48;5;236m    📡 42 commit(s) remotely that the local branch doesn't     [49m│
      │[48;5;236m 🧮 [35mnext[39m has...                                                [49m│
      │[48;5;236m    🏠 0 commit(s) locally that the remote branch doesn't have [49m│
      │[48;5;236m    📡 42 commit(s) remotely that the local branch doesn't     [49m│
      ╰───────────────────────────────────────────────────────────────╯"
    `)
    expect(result.error).toBeUndefined()
    expect(question).toHaveBeenCalledWith(
      `Ok to \`git fetch\` ${chalk.magenta('main')}? [Y/n] `
    )
    expect(question).toHaveBeenCalledWith(
      `Ok to \`git fetch\` ${chalk.magenta('next')}? [Y/n] `
    )
  })
})
