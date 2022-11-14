import { spawnSync } from 'child_process'
import path from 'path'

describe('The CLI sets `cwd` correctly', () => {
  describe('--cwd', () => {
    it('lets the user set the cwd via the `--cwd` option', async () => {
      const { status, stdout, stderr } = rw([
        '--cwd',
        path.join('__fixtures__', 'test-project'),
        '--version',
      ])

      expect(status).toBe(0)
      expect(stdout).toMatch(VERSION)
      expect(stderr).toBe('')
    })

    it(`throws if set via --cwd and there's no "redwood.toml"`, () => {
      const { status, stdout, stderr } = rw([
        '--cwd',
        '__fixtures__',
        '--version',
      ])

      expect(status).toBe(1)
      expect(stdout).toBe('')
      expect(stderr).toMatchInlineSnapshot(`
        "Couldn't find a "redwood.toml" file in __fixtures__.
        Are you sure you're in a Redwood project?"
      `)
    })
  })

  describe('RWJS_CWD', () => {
    it('lets the user set the cwd via the `--cwd` option', () => {
      const { status, stdout, stderr } = rw(['--version'], {
        env: {
          ...process.env,
          RWJS_CWD: path.join('__fixtures__', 'test-project'),
        },
      })

      expect(status).toBe(0)
      expect(stdout).toMatch(VERSION)
      expect(stderr).toBe('')
    })

    it(`Throws if set via RWJS_CWD and there's no "redwood.toml"`, () => {
      const { status, stdout, stderr } = rw(['--version'], {
        env: {
          ...process.env,
          RWJS_CWD: '__fixtures__',
        },
      })

      expect(status).toBe(1)
      expect(stdout).toBe('')
      expect(stderr).toMatchInlineSnapshot(`
        "Couldn't find a "redwood.toml" file in __fixtures__.
        Are you sure you're in a Redwood project?"
      `)
    })
  })

  describe('--cwd and RWJS_CWD', () => {
    it('prefers --cwd to RWJS_CWD', () => {
      const { status, stdout, stderr } = rw(
        ['--cwd', path.join('__fixtures__', 'test-project'), '--version'],
        {
          env: {
            ...process.env,
            RWJS_CWD: '/ignored/path',
          },
        }
      )

      expect(status).toBe(0)
      expect(stdout).toMatch(VERSION)
      expect(stderr).toBe('')
    })
  })

  describe('find up', () => {
    it("Finds up for a redwood.toml if --cwd and RWJS_CWD aren't set", () => {
      const { status, stdout, stderr } = rw(['--version'], {
        cwd: path.join(BASE_DIR, '__fixtures__', 'test-project', 'api'),
      })

      console.log({
        status,
        stdout,
        stderr,
      })
    })
  })
})

const BASE_DIR = path.resolve(__dirname, '..', '..', '..', '..')
const CLI = path.join(BASE_DIR, 'packages', 'cli', 'dist', 'index.js')

function rw(args, options) {
  const { status, stdout, stderr } = spawnSync('node', [CLI, ...args], {
    cwd: BASE_DIR,
    ...options,
  })

  return {
    status,
    stdout: stdout.toString().trim(),
    stderr: stderr.toString().trim(),
  }
}

const VERSION = /\d.\d.\d/
