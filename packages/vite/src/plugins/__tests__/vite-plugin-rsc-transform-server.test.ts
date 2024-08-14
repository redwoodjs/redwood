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

describe('rscTransformUseServerPlugin module scoped "use server"', () => {
  afterEach(() => {
    vi.resetAllMocks()
  })

  it('should handle one function', async () => {
    const id = 'some/path/to/actions.ts'
    const input = `
      'use server'

      import fs from 'node:fs'

      export async function formAction(formData: FormData) {
        await fs.promises.writeFile(
          'settings.json',
          \`{ "delay": \${formData.get('delay')} }\`
        )
      }`.trim()

    const output = await pluginTransform(input, id)

    expect(output).toMatchInlineSnapshot(`
      "'use server'

            import fs from 'node:fs'

            export async function formAction(formData: FormData) {
              await fs.promises.writeFile(
                'settings.json',
                \`{ "delay": \${formData.get('delay')} }\`
              )
            }

      import {registerServerReference} from "react-server-dom-webpack/server";
      registerServerReference(formAction,"some/path/to/actions.ts","formAction");
      "
    `)
  })

  it('should handle two functions', async () => {
    const id = 'some/path/to/actions.ts'
    const input = `
      'use server'

      import fs from 'node:fs'

      export async function formAction1(formData: FormData) {
        await fs.promises.writeFile(
          'settings.json',
          \`{ "delay": \${formData.get('delay')} }\`
        )
      }

      export async function formAction2(formData: FormData) {
        await fs.promises.writeFile(
          'settings.json',
          \`{ "delay": \${formData.get('delay')} }\`
        )
      }`.trim()

    const output = await pluginTransform(input, id)

    expect(output).toMatchInlineSnapshot(`
      "'use server'

            import fs from 'node:fs'

            export async function formAction1(formData: FormData) {
              await fs.promises.writeFile(
                'settings.json',
                \`{ "delay": \${formData.get('delay')} }\`
              )
            }

            export async function formAction2(formData: FormData) {
              await fs.promises.writeFile(
                'settings.json',
                \`{ "delay": \${formData.get('delay')} }\`
              )
            }

      import {registerServerReference} from "react-server-dom-webpack/server";
      registerServerReference(formAction1,"some/path/to/actions.ts","formAction1");
      registerServerReference(formAction2,"some/path/to/actions.ts","formAction2");
      "
    `)
  })

  it('should handle arrow function', async () => {
    const id = 'some/path/to/actions.ts'
    const input = `
      'use server'

      import fs from 'node:fs'

      export const formAction = async (formData: FormData) => {
        await fs.promises.writeFile(
          'settings.json',
          \`{ "delay": \${formData.get('delay')} }\`
        )
      }`.trim()

    const output = await pluginTransform(input, id)

    expect(output).toMatchInlineSnapshot(`
      "'use server'

            import fs from 'node:fs'

            export const formAction = async (formData: FormData) => {
              await fs.promises.writeFile(
                'settings.json',
                \`{ "delay": \${formData.get('delay')} }\`
              )
            }

      import {registerServerReference} from "react-server-dom-webpack/server";
      if (typeof formAction === "function") registerServerReference(formAction,"some/path/to/actions.ts","formAction");
      "
    `)
  })

  it.todo('should handle default exported arrow function', async () => {
    const id = 'some/path/to/actions.ts'
    const input = `
      'use server'

      import fs from 'node:fs'

      export default async (formData: FormData) => {
        await fs.promises.writeFile(
          'settings.json',
          \`{ "delay": \${formData.get('delay')} }\`
        )
      }`.trim()

    const output = await pluginTransform(input, id)

    expect(output).toMatchInlineSnapshot(`
      "'use server'

            import fs from 'node:fs'

            export default async (formData: FormData) => {
              await fs.promises.writeFile(
                'settings.json',
                \`{ "delay": \${formData.get('delay')} }\`
              )
            }

      import {registerServerReference} from "react-server-dom-webpack/server";
      registerServerReference(default,"some/path/to/actions.ts","default");
      "
    `)
  })

  it('should handle default exported named function', async () => {
    const id = 'some/path/to/actions.ts'
    const input = `
      "use server"

      import fs from 'node:fs'

      export default async function formAction(formData: FormData) {
        await fs.promises.writeFile(
          'settings.json',
          \`{ "delay": \${formData.get('delay')} }\`
        )
      }`.trim()

    const output = await pluginTransform(input, id)

    expect(output).toMatchInlineSnapshot(`
      ""use server"

            import fs from 'node:fs'

            export default async function formAction(formData: FormData) {
              await fs.promises.writeFile(
                'settings.json',
                \`{ "delay": \${formData.get('delay')} }\`
              )
            }

      import {registerServerReference} from "react-server-dom-webpack/server";
      registerServerReference(formAction,"some/path/to/actions.ts","default");
      "
    `)
  })

  it.todo('should handle default exported anonymous function', async () => {
    const id = 'some/path/to/actions.ts'
    const input = `
      'use server'

      import fs from 'node:fs'

      export default async function (formData: FormData) {
        await fs.promises.writeFile(
          'settings.json',
          \`{ "delay": \${formData.get('delay')} }\n\`
        )
      }`.trim()

    const output = await pluginTransform(input, id)

    expect(output).toMatchInlineSnapshot(`
      "'use server'

            import fs from 'node:fs'

            export async function formAction(formData: FormData) {
              await fs.promises.writeFile(
                'settings.json',
                \`{ "delay": \${formData.get('delay')} }\`
              )
            }

      import {registerServerReference} from "react-server-dom-webpack/server";
      registerServerReference(formAction,"some/path/to/actions.ts","formAction");
      "
    `)
  })
})
