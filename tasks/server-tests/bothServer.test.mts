import { describe, expect, it } from 'vitest'
import { $ } from 'zx'

import { rw, rwServer } from './vitest.setup.mjs'

describe.each([
  [[rw, 'serve']],
  [rwServer],
])('serve both (%s)', (cmd) => {
  it("has help configured", async () => {
    const { stdout } = await $`yarn node ${cmd} --help`
    expect(stdout).toMatchSnapshot()
  })

  it('errors out on unknown args', async () => {
    try {
      await $`yarn node ${cmd} --foo --bar --baz`
      expect(true).toEqual(false)
    } catch (p) {
      expect(p.exitCode).toEqual(1)
      expect(p.stdout).toEqual('')
      expect(p.stderr).toMatchSnapshot()
    }
  })
})
