import { vol } from 'memfs'
import type { TransformPluginContext } from 'rollup'
import {
  afterAll,
  beforeAll,
  describe,
  it,
  expect,
  vi,
  afterEach,
} from 'vitest'

import { rscTransformUseServerPlugin } from '../vite-plugin-rsc-transform-server.js'

vi.mock('fs', async () => ({ default: (await import('memfs')).fs }))

const RWJS_CWD = process.env.RWJS_CWD

beforeAll(() => {
  process.env.RWJS_CWD = '/Users/tobbe/rw-app/'

  // Add a toml entry for getPaths et al.
  vol.fromJSON({ 'redwood.toml': '' }, process.env.RWJS_CWD)
})

afterAll(() => {
  process.env.RWJS_CWD = RWJS_CWD
})

function getPluginTransform() {
  const plugin = rscTransformUseServerPlugin()

  if (typeof plugin.transform !== 'function') {
    throw new Error('Plugin does not have a transform function')
  }

  // Calling `bind` to please TS
  // See https://stackoverflow.com/a/70463512/88106
  // Typecasting because we're only going to call transform, and we don't need
  // anything provided by the context.
  return plugin.transform.bind({} as TransformPluginContext)
}

const pluginTransform = getPluginTransform()

describe('rscTransformUseServerPlugin', () => {
  afterEach(() => {
    vi.resetAllMocks()
  })

  it('should handle module scoped "use server"', async () => {
    const id = 'some/path/to/actions.ts'
    const input = `'use server'

      import fs from 'node:fs'

      export async function formAction(formData: FormData) {
        await fs.promises.writeFile(
          'settings.json',
          \`{ "delay": \${formData.get('delay')} }\n\`
        )
      }`

    const output = await pluginTransform(input, id)

    if (typeof output !== 'string') {
      throw new Error('Expected output to be a string')
    }

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
