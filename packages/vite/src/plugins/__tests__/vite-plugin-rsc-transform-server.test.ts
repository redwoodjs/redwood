import { vol } from 'memfs'
import {
  afterAll,
  beforeAll,
  describe,
  it,
  expect,
  vi,
  afterEach,
} from 'vitest'

import { rscTransformUseServerPlugin } from '../vite-plugin-rsc-transform-server'

vi.mock('fs', async () => ({ default: (await import('memfs')).fs }))

const RWJS_CWD = process.env.RWJS_CWD

beforeAll(() => {
  // Add a toml entry for getPaths et al.
  process.env.RWJS_CWD = '/Users/tobbe/rw-app/'
  vol.fromJSON(
    {
      'redwood.toml': '',
    },
    process.env.RWJS_CWD,
  )
})

afterAll(() => {
  process.env.RWJS_CWD = RWJS_CWD
})

describe('rscTransformUseServerPlugin', () => {
  afterEach(() => {
    vi.resetAllMocks()
  })

  it('should handle module scoped "use server"', async () => {
    const plugin = rscTransformUseServerPlugin()

    if (typeof plugin.transform !== 'function') {
      expect.fail('Expected plugin to have a transform function')
    }

    const id = 'some/path/to/actions.ts'
    const input = `'use server'

      import fs from 'node:fs'

      export async function formAction(formData: FormData) {
        await fs.promises.writeFile(
          'settings.json',
          \`{ "delay": \${formData.get('delay')} }\n\`
        )
      }`

    const output = await plugin.transform.bind({})(input, id)

    expect(
      output.split('\n').some((line) => line.startsWith('"use server"')),
    ).toBeTruthy()
    expect(output).toContain(
      'import {registerServerReference} from "react-server-dom-webpack/server";',
    )
    expect(output).toContain(
      `registerServerReference(formAction,"${id}","formAction");`,
    )
    // One import and (exactly) one call to registerServerReference, so two
    // matches
    expect(output.match(/registerServerReference/g)).toHaveLength(2)
  })
})
