import { jest } from '@jest/globals'
import execa from 'execa'
import { chalk, fs, $ } from 'zx'

import * as releaseLib from '../releaseLib.mjs'

const range = {
  from: 'ds-fixture-dont-delete-main',
  to: 'ds-fixture-dont-delete-next',
}

releaseLib.setVerbosity(false)

describe('releaseLib', () => {
  test("its exports haven't unintentionally changed", async () => {
    const releaseLib = await import('../releaseLib.mjs')

    expect(releaseLib).toMatchInlineSnapshot(`
      {
        "compareRange": [Function],
        "consoleBoxen": [Function],
        "defaultGitLogOptions": [
          "--oneline",
          "--no-abbrev-commit",
          "--left-right",
          "--graph",
          "--left-only",
          "--cherry-pick",
          "--boundary",
        ],
        "getBranchesToCommits": [Function],
        "getLatestRelease": [Function],
        "getMilestone": [Function],
        "getOctokit": [Function],
        "getPRMilestoneFromURL": [Function],
        "getRedwoodRemote": [Function],
        "getReleaseBranches": [Function],
        "getSymmetricDifference": [Function],
        "handleBranchesToCommits": [Function],
        "isYes": [Function],
        "openCherryPickPRs": [Function],
        "prMilestoneCache": undefined,
        "prompts": [Function],
        "reportCommitStatuses": [Function],
        "resolveBranchStatuses": [Function],
        "resolveCommitsToTriage": [Function],
        "resolveLine": [Function],
        "resolveSymmetricDifference": [Function],
        "separator": "[2m------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------[22m",
        "setUpDataFile": [Function],
        "setVerbosity": [Function],
        "triageCommits": [Function],
        "triageRange": [Function],
        "unwrap": [Function],
      }
    `)
  })

  describe('setUpDataFile', () => {
    it("returns an empty map if the file doesn't exist", async () => {
      const data = releaseLib.setUpDataFile(
        new URL('./nonExistentFile.json', import.meta.url)
      )

      expect(data).toEqual(new Map())
    })

    it('returns a map the if the file exists', async () => {
      const data = releaseLib.setUpDataFile(
        new URL('./test.commitTriageData.json', import.meta.url)
      )

      expect(data).toMatchInlineSnapshot(`
        Map {
          "ed8a87d98d8c3e5dad23ac3e2143b46a201194dc" => {
            "message": "chore(deps): update dependency esbuild to v0.19.2 (#9029)",
            "needsCherryPick": false,
          },
        }
      `)
    })

    describe('process.exit', () => {
      const file = './testFile.json'

      afterAll(async () => {
        await fs.rm(file)
      })

      it("doesn't write a file if the map is empty on the `process`'s `exit` event", async () => {
        await execa.command(
          `yarn node ./setUpDataFileTest.mjs --file=${file} --scenario=empty-map`
        )

        expect(await fs.exists(file)).toBe(false)
      })

      it("writes a file if the map is populated on `process`'s `exit`", async () => {
        await execa.command(`yarn node ./setUpDataFileTest.mjs --file=${file}`)

        expect(await fs.exists(file)).toBe(true)
      })
    })
  })

  describe('symmetric difference', () => {
    let symmetricDifference

    test('`getSymmetricDifference` gets the symmetric difference between fixture branches', async () => {
      symmetricDifference = await releaseLib.getSymmetricDifference(range)

      expect(symmetricDifference.length).toEqual(147)
      expect(symmetricDifference).toMatchSnapshot()
    })

    describe('resolveSymmetricDifference', () => {
      describe('resolveLine', () => {
        const options = {
          range: {
            ...range,
            to: [range.to],
          },
          refsToColorFunctions: {
            [range.to]: chalk.dim.bgBlue,
          },
          logger: () => {},
        }

        it('resolves a ui line starting with `| o`', async () => {
          const line =
            '| o a2fcc1618a70a77570943e4bc85d29ea055ab507 chore(deps): update dependency @playwright/test to v1.37.0 (#9028)'

          const commit = await releaseLib.resolveLine(line, options)

          expect(commit).toMatchObject({
            type: 'ui',
            ref: range.from,
            pretty: chalk.dim(line),
          })
        })

        it('resolve a ui line starting with `o`', async () => {
          const line = 'o 79faf45ead7bdaa351afb7d5f99ca7ee828939bf v6.0.7'

          const commit = await releaseLib.resolveLine(line, options)

          expect(commit).toEqual({
            line,
            type: 'ui',
            ref: range.from,
            pretty: chalk.dim(line),
          })
        })

        it("parses a commit's hash and message", async () => {
          const line =
            '< c80df9b30ffbfbf1b9b75af92938a9941215a075 Update crypto library, CryptoJS CVE & deprecation (#9350)'

          const commit = await releaseLib.resolveLine(line, options)

          expect(commit).toMatchObject({
            hash: 'c80df9b30ffbfbf1b9b75af92938a9941215a075',
            message:
              'Update crypto library, CryptoJS CVE & deprecation (#9350)',
          })
        })

        it('resolves an annotated tag', async () => {
          const line = '< 79faf45ead7bdaa351afb7d5f99ca7ee828939bf v6.0.7'

          const commit = await releaseLib.resolveLine(line, options)

          expect(commit).toMatchObject({
            type: 'tag',
            ref: 'v6.0.7',
            pretty: chalk.dim(line),
          })
        })

        it('resolves a release chore', async () => {
          const line =
            "< 7bf030a3c3dd94d7ff95d964d75dc4cd54a0de39 Merge branch 'release/patch/v6.0.7'"

          const commit = await releaseLib.resolveLine(line, options)

          expect(commit).toMatchObject({
            type: 'release-chore',
            pretty: chalk.dim(line),
          })
        })

        it('resolves a commit that revert a commit', async () => {
          const line =
            '< 8469ce6e189b9628f785950b1a0dc800aa7eea3c Revert "feat: Support GraphQL Fragments with Apollo Client and Fragment Registry (#9140)"'

          const commit = await releaseLib.resolveLine(line, options)

          expect(commit).toMatchObject({
            type: 'revert',
            pretty: chalk.underline(line),
          })
        })

        it("parses a commit's pr and fetches its milestone", async () => {
          const line =
            '< 18555d0e196cfc69ed322e24cafeb2d228773ae1 RSC: Smoke test (#9194)'

          const commit = await releaseLib.resolveLine(line, options)

          expect(commit).toMatchObject({
            pr: '9194',
            url: 'https://github.com/redwoodjs/redwood/pull/9194',
            milestone: 'RSC',
          })
        })

        it('checks if a commit is in the `range.to` ref', async () => {
          const line =
            '< 0ec4c5e15488d73e95d08d3965968797ecd23315 chore(deps): update babel monorepo to v7.22.10 (#9016)'

          const commit = await releaseLib.resolveLine(line, options)

          expect(commit).toMatchObject({
            ref: range.to,
            pretty: options.refsToColorFunctions[range.to](
              `${line} (${commit.milestone})`
            ),
          })
        })
      })
    })
  })

  describe('getReleaseBranches', () => {
    it('gets branches prefixed with `release/`', async () => {
      const releaseBranches = await releaseLib.getReleaseBranches()

      // Release branches look like `release/major/v7.0.0`, `release/minor/v6.4.0`, or `release/patch/v6.3.2`.
      const releaseBranchRegExp = /release\/major|minor|patch\/v\d.\d.\d/

      expect(
        releaseBranches.every((releaseBranch) =>
          releaseBranchRegExp.test(releaseBranch)
        )
      ).toEqual(true)
    })

    it("sorts them if there's more than one,", async () => {
      const mockReleaseBranches = [
        `release/major/3.0.0`,
        `release/minor/v2.1.0`,
        `release/patch/v2.0.1`,
        `release/major/v2.0.0`,
      ]

      await Promise.all(
        mockReleaseBranches.map((branch) => $`git branch ${branch}`)
      )

      const releaseBranches = await releaseLib.getReleaseBranches()
      expect(releaseBranches.slice(-4)).toEqual(mockReleaseBranches)

      await Promise.all(
        mockReleaseBranches.map((branch) => $`git branch -D ${branch}`)
      )
    })
  })

  test('getLatestRelease returns a string in the shape of a release tag', async () => {
    const latestRelease = await releaseLib.getLatestRelease()
    expect(latestRelease).toMatch(/v\d\.\d\.\d/)
  })

  describe('resolveBranchStatuses', () => {
    test('getRedwoodRemote', async () => {
      const result = await releaseLib.getRedwoodRemote()
      expect(result.redwoodRemote).toBeDefined()
      expect(result.error).toBeUndefined()
    })

    test('getBranchesToCommits', async () => {
      const branchesToCommits = await releaseLib.getBranchesToCommits(
        ['main', 'next'],
        {
          redwoodRemote: 'origin',
        }
      )

      expect(branchesToCommits).toEqual({
        main: {
          existsOnRedwoodRemote: expect.any(Boolean),
          diverged: expect.any(Boolean),
          upToDate: expect.any(Boolean),
          commitsExclusiveToLocalBranch: expect.any(Number),
          commitsExclusiveToRemoteBranch: expect.any(Number),
        },
        next: {
          existsOnRedwoodRemote: expect.any(Boolean),
          upToDate: expect.any(Boolean),
          commitsExclusiveToLocalBranch: expect.any(Number),
          commitsExclusiveToRemoteBranch: expect.any(Number),
          diverged: expect.any(Boolean),
        },
      })
    })

    describe('handleBranchesToCommits', () => {
      it('handles branches being up to date', async () => {
        console.log = jest.fn()

        const result = await releaseLib.handleBranchesToCommits(
          {
            main: {
              existsOnRedwoodRemote: true,
              upToDate: true,
            },
            next: {
              existsOnRedwoodRemote: true,
              upToDate: true,
            },
          },
          {
            redwoodRemote: 'origin',
          }
        )

        expect(console.log.mock.calls[0][0]).toMatchInlineSnapshot(`
          "╭ 🐙 Branch status(es) ─╮
          │[48;5;236m ✅ [35mmain[39m is up to date [49m│
          │[48;5;236m ✅ [35mnext[39m is up to date [49m│
          ╰───────────────────────╯"
        `)
        expect(result.error).toBeUndefined()
      })

      it('handles diverged branches', async () => {
        console.log = jest.fn()

        const result = await releaseLib.handleBranchesToCommits(
          {
            main: {
              existsOnRedwoodRemote: true,
              upToDate: false,
              diverged: true,
              commitsExclusiveToLocalBranch: 42,
              commitsExclusiveToRemoteBranch: 42,
            },
            next: {
              existsOnRedwoodRemote: true,
              upToDate: false,
              diverged: true,
              commitsExclusiveToLocalBranch: 42,
              commitsExclusiveToRemoteBranch: 42,
            },
          },
          {
            redwoodRemote: 'origin',
          }
        )

        expect(console.log.mock.calls[0][0]).toMatchInlineSnapshot(`
          "╭ 🐙 Branch status(es) ──────────────────────────────────────────╮
          │[48;5;236m 🧮 [35mmain[39m has...                                                 [49m│
          │[48;5;236m    🏠 42 commit(s) locally that the remote branch doesn't have [49m│
          │[48;5;236m    📡 42 commit(s) remotely that the local branch doesn't      [49m│
          │[48;5;236m 🧮 [35mnext[39m has...                                                 [49m│
          │[48;5;236m    🏠 42 commit(s) locally that the remote branch doesn't have [49m│
          │[48;5;236m    📡 42 commit(s) remotely that the local branch doesn't      [49m│
          ╰────────────────────────────────────────────────────────────────╯"
        `)
        expect(result.error).toMatchInlineSnapshot(`
          "The following branch(es) have diverged—they have commits that are exclusive to both the local and remote: [35mmain[39m, [35mnext[39m.
          Trying to triage commits right now probably isn't going to be a good time."
        `)
      })

      it("handles branches that aren't main or next", async () => {
        console.log = jest.fn()

        const result = await releaseLib.handleBranchesToCommits(
          {
            'release/minor/v6.4.0': {
              existsOnRedwoodRemote: true,
              upToDate: true,
            },
            'next-v5-archive': {
              existsOnRedwoodRemote: true,
              upToDate: true,
            },
          },
          {
            redwoodRemote: 'origin',
          }
        )

        expect(console.log.mock.calls[0][0]).toMatchInlineSnapshot(`
          "╭ 🐙 Branch status(es) ─────────────────╮
          │[48;5;236m ✅ [35mrelease/minor/v6.4.0[39m is up to date [49m│
          │[48;5;236m ✅ [35mnext-v5-archive[39m is up to date      [49m│
          ╰───────────────────────────────────────╯"
        `)
        expect(result.error).toBeUndefined()
      })

      it("handles branches that don't have remotes", async () => {
        console.log = jest.fn()

        const result = await releaseLib.handleBranchesToCommits(
          {
            'release/epoch/bighorn': {
              existsOnRedwoodRemote: false,
            },
            'epoch-arapaho-archive': {
              existsOnRedwoodRemote: false,
            },
          },
          {
            redwoodRemote: 'origin',
          }
        )

        expect(console.log.mock.calls[0][0]).toMatchInlineSnapshot(`
          "╭ 🐙 Branch status(es) ─────────────────────────────────────────────────╮
          │[48;5;236m ❓ [35mrelease/epoch/bighorn[39m doesn't exist on the Redwood remote (origin) [49m│
          │[48;5;236m ❓ [35mepoch-arapaho-archive[39m doesn't exist on the Redwood remote (origin) [49m│
          ╰───────────────────────────────────────────────────────────────────────╯"
        `)
        expect(result.error).toBeUndefined()
      })
    })
  })

  test("`getPRMilestoneFromURL` gets a PR's milestone", async () => {
    const pr = {
      url: 'https://github.com/redwoodjs/redwood/pull/9361',
      milestone: 'v6.4.0',
    }

    const milestone = await releaseLib.getPRMilestoneFromURL(pr.url)

    expect(milestone).toEqual(pr.milestone)
    expect(releaseLib.prMilestoneCache.has(pr.url)).toEqual(true)
    expect(releaseLib.prMilestoneCache.get(pr.url)).toEqual(milestone)
  })

  test('`getOctokit` throws if `process.env.GITHUB_TOKEN` is `undefined`', () => {
    const GITHUB_TOKEN = process.env.GITHUB_TOKEN
    delete process.env.GITHUB_TOKEN

    try {
      releaseLib.getOctokit()
    } catch (e) {
      expect(e.message).toMatchInlineSnapshot(`
        "You have to set the [35mGITHUB_TOKEN[39m env var to a personal access token.
        Create a personal access token with the [35mrepo[39m scope here: https://github.com/settings/tokens."
      `)
    }

    process.env.GITHUB_TOKEN = GITHUB_TOKEN
  })
})
