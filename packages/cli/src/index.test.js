import path from 'path'

import execa from 'execa'

const rw = path.join(__dirname, '..', 'dist', 'index.js')

const TEST_PROJECT_FIXTURE = path.join(
  process.env.PROJECT_CWD,
  '__fixtures__',
  'test-project'
)

describe('lets the user set the cwd', () => {
  test('--cwd', async () => {
    const { stdout } = await execa.command(
      `node ${rw} --cwd ${TEST_PROJECT_FIXTURE} --help`
    )

    expect(stdout).toContain('rw <command>')
  })

  test(`throws if set via --cwd and there's no "redwood.toml"`, async () => {
    await expect(
      execa.command(
        `node ${rw} --cwd ${path.dirname(TEST_PROJECT_FIXTURE)} --help`
      )
    ).rejects.toThrow()
  })

  test('RWJS_CWD', async () => {
    const { stdout } = await execa.command(`node ${rw} --help`, {
      env: {
        RWJS_CWD: TEST_PROJECT_FIXTURE,
      },
    })

    expect(stdout).toContain('rw <command>')
  })

  test(`throws if set via RWJS_CWD and there's no "redwood.toml"`, async () => {
    await expect(
      execa.command(
        `node ${rw} --cwd ${path.dirname(TEST_PROJECT_FIXTURE)} --help`
      )
    ).rejects.toThrow()
  })

  test('prefers --cwd to RWJS_CWD', async () => {
    const { stdout } = await execa.command(
      `node ${rw} --cwd ${TEST_PROJECT_FIXTURE} --help`,
      {
        env: {
          RWJS_CWD: '/ignored/path',
        },
      }
    )

    expect(stdout).toContain('rw <command>')
  })

  test('findup', async () => {
    const { stdout } = await execa.command(`node ${rw} --help`, {
      cwd: path.join(TEST_PROJECT_FIXTURE, 'api'),
    })

    expect(stdout).toContain('rw <command>')
  })

  test.only(`throws if can't findup "redwood.toml"`, async () => {
    await expect(
      execa.command(`node ${rw} --help`, {
        cwd: path.dirname(TEST_PROJECT_FIXTURE),
      })
    ).rejects.toThrow()
  })
})
