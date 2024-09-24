import path from 'node:path'

import { vi, afterEach, beforeEach, describe, it, expect } from 'vitest'

import '../../lib/mockTelemetry'
import { handler } from '../execHandler'

vi.mock('@redwoodjs/project-config', () => ({
  getPaths: () => ({
    scripts: path.join('redwood-app', 'scripts'),
  }),
  resolveFile: (path: string) => path,
}))

vi.mock('@redwoodjs/internal/dist/files', () => ({
  findScripts: () => {
    const scriptsPath = path.join('redwood-app', 'scripts')

    return [
      path.join(scriptsPath, 'one', 'two', 'myNestedScript.ts'),
      path.join(scriptsPath, 'conflicting.js'),
      path.join(scriptsPath, 'conflicting.ts'),
      path.join(scriptsPath, 'normalScript.ts'),
      path.join(scriptsPath, 'secondNormalScript.ts'),
    ]
  },
}))

beforeEach(() => {
  vi.spyOn(console, 'log').mockImplementation(() => {})
})

afterEach(() => {
  vi.mocked(console).log.mockRestore()
})

describe('yarn rw exec --list', () => {
  it('includes nested scripts', async () => {
    await handler({ list: true })
    const scriptPath = path
      .join('one', 'two', 'myNestedScript')
      // Handle Windows path separators
      .replaceAll('\\', '\\\\')
    expect(vi.mocked(console).log).toHaveBeenCalledWith(
      expect.stringMatching(new RegExp('\\b' + scriptPath + '\\b')),
    )
  })

  it("does not include the file extension if there's no ambiguity", async () => {
    await handler({ list: true })
    expect(vi.mocked(console).log).toHaveBeenCalledWith(
      expect.stringMatching(new RegExp('\\bnormalScript\\b')),
    )
    expect(vi.mocked(console).log).toHaveBeenCalledWith(
      expect.stringMatching(new RegExp('\\bsecondNormalScript\\b')),
    )
  })

  it('includes the file extension if there could be ambiguity', async () => {
    await handler({ list: true })
    expect(vi.mocked(console).log).toHaveBeenCalledWith(
      expect.stringMatching(new RegExp('\\bconflicting.js\\b')),
    )
    expect(vi.mocked(console).log).toHaveBeenCalledWith(
      expect.stringMatching(new RegExp('\\bconflicting.ts\\b')),
    )
  })
})
