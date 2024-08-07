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
          \`{ "delay": \${formData.get('delay')} }\n\`
        )
      }`

    const output = await pluginTransform(input, id)

    if (typeof output !== 'string') {
      throw new Error('Expected output to be a string')
    }

    // Check that the file has a "use server" directive at the top
    // Comments and other directives are allowed before it.
    // Maybe also imports, I'm not sure, but am going to allow it for now. If
    // someone finds a problem with that, we can revisit.
    const outputLines = output.split('\n')
    const firstCodeLineIndex = outputLines.findIndex(
      (line) =>
        line.startsWith('export ') ||
        line.startsWith('async ') ||
        line.startsWith('function ') ||
        line.startsWith('const ') ||
        line.startsWith('let ') ||
        line.startsWith('var '),
    )
    expect(
      outputLines
        .slice(0, firstCodeLineIndex)
        .some((line) => line.startsWith('"use server"')),
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

  it('should handle two functions', async () => {
    const id = 'some/path/to/actions.ts'
    const input = `
      'use server'

      import fs from 'node:fs'

      export async function formAction1(formData: FormData) {
        await fs.promises.writeFile(
          'settings.json',
          \`{ "delay": \${formData.get('delay')} }\n\`
        )
      }

      export async function formAction2(formData: FormData) {
        await fs.promises.writeFile(
          'settings.json',
          \`{ "delay": \${formData.get('delay')} }\n\`
        )
      }`

    const output = await pluginTransform(input, id)

    if (typeof output !== 'string') {
      throw new Error('Expected output to be a string')
    }

    // Check that the file has a "use server" directive at the top
    // Comments and other directives are allowed before it.
    // Maybe also imports, I'm not sure, but am going to allow it for now. If
    // someone finds a problem with that, we can revisit.
    const outputLines = output.split('\n')
    const firstCodeLineIndex = outputLines.findIndex(
      (line) =>
        line.startsWith('export ') ||
        line.startsWith('async ') ||
        line.startsWith('function ') ||
        line.startsWith('const ') ||
        line.startsWith('let ') ||
        line.startsWith('var '),
    )
    expect(
      outputLines
        .slice(0, firstCodeLineIndex)
        .some((line) => line.startsWith('"use server"')),
    ).toBeTruthy()
    expect(output).toContain(
      'import {registerServerReference} from "react-server-dom-webpack/server";',
    )
    expect(output).toContain(
      `registerServerReference(formAction1,"${id}","formAction1");`,
    )
    expect(output).toContain(
      `registerServerReference(formAction2,"${id}","formAction2");`,
    )
    // One import and (exactly) two calls to registerServerReference, so three
    // matches
    expect(output.match(/registerServerReference/g)).toHaveLength(3)
  })

  it('should handle arrow function', async () => {
    const id = 'some/path/to/actions.ts'
    const input = `
      'use server'

      import fs from 'node:fs'

      export const formAction = async (formData: FormData) => {
        await fs.promises.writeFile(
          'settings.json',
          \`{ "delay": \${formData.get('delay')} }\n\`
        )
      }`

    const output = await pluginTransform(input, id)

    if (typeof output !== 'string') {
      throw new Error('Expected output to be a string')
    }

    // Check that the file has a "use server" directive at the top
    // Comments and other directives are allowed before it.
    // Maybe also imports, I'm not sure, but am going to allow it for now. If
    // someone finds a problem with that, we can revisit.
    const outputLines = output.split('\n')
    const firstCodeLineIndex = outputLines.findIndex(
      (line) =>
        line.startsWith('export ') ||
        line.startsWith('async ') ||
        line.startsWith('function ') ||
        line.startsWith('const ') ||
        line.startsWith('let ') ||
        line.startsWith('var '),
    )
    expect(
      outputLines
        .slice(0, firstCodeLineIndex)
        .some((line) => line.startsWith('"use server"')),
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

  it('should handle default exported arrow function', async () => {
    const id = 'some/path/to/actions.ts'
    const input = `
      'use server'

      import fs from 'node:fs'

      export const formAction = async (formData: FormData) => {
        await fs.promises.writeFile(
          'settings.json',
          \`{ "delay": \${formData.get('delay')} }\n\`
        )
      }`

    const output = await pluginTransform(input, id)

    if (typeof output !== 'string') {
      throw new Error('Expected output to be a string')
    }

    // Check that the file has a "use server" directive at the top
    // Comments and other directives are allowed before it.
    // Maybe also imports, I'm not sure, but am going to allow it for now. If
    // someone finds a problem with that, we can revisit.
    const outputLines = output.split('\n')
    const firstCodeLineIndex = outputLines.findIndex(
      (line) =>
        line.startsWith('export ') ||
        line.startsWith('async ') ||
        line.startsWith('function ') ||
        line.startsWith('const ') ||
        line.startsWith('let ') ||
        line.startsWith('var '),
    )
    expect(
      outputLines
        .slice(0, firstCodeLineIndex)
        .some((line) => line.startsWith('"use server"')),
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

  it('should handle default exported named function', async () => {
    const id = 'some/path/to/actions.ts'
    const input = `
      'use server'

      import fs from 'node:fs'

      export default async function formAction(formData: FormData) {
        await fs.promises.writeFile(
          'settings.json',
          \`{ "delay": \${formData.get('delay')} }\n\`
        )
      }`

    const output = await pluginTransform(input, id)

    if (typeof output !== 'string') {
      throw new Error('Expected output to be a string')
    }

    // Check that the file has a "use server" directive at the top
    // Comments and other directives are allowed before it.
    // Maybe also imports, I'm not sure, but am going to allow it for now. If
    // someone finds a problem with that, we can revisit.
    const outputLines = output.split('\n')
    const firstCodeLineIndex = outputLines.findIndex(
      (line) =>
        line.startsWith('export ') ||
        line.startsWith('async ') ||
        line.startsWith('function ') ||
        line.startsWith('const ') ||
        line.startsWith('let ') ||
        line.startsWith('var '),
    )
    expect(
      outputLines
        .slice(0, firstCodeLineIndex)
        .some((line) => line.startsWith('"use server"')),
    ).toBeTruthy()
    expect(output).toContain(
      'import {registerServerReference} from "react-server-dom-webpack/server";',
    )
    expect(output).toContain(
      `registerServerReference(formAction,"${id}","default");`,
    )
    // One import and (exactly) one call to registerServerReference, so two
    // matches
    expect(output.match(/registerServerReference/g)).toHaveLength(2)
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
      }`

    const output = await pluginTransform(input, id)

    if (typeof output !== 'string') {
      throw new Error('Expected output to be a string')
    }

    // Check that the file has a "use server" directive at the top
    // Comments and other directives are allowed before it.
    // Maybe also imports, I'm not sure, but am going to allow it for now. If
    // someone finds a problem with that, we can revisit.
    const outputLines = output.split('\n')
    const firstCodeLineIndex = outputLines.findIndex(
      (line) =>
        line.startsWith('export ') ||
        line.startsWith('async ') ||
        line.startsWith('function ') ||
        line.startsWith('const ') ||
        line.startsWith('let ') ||
        line.startsWith('var '),
    )
    expect(
      outputLines
        .slice(0, firstCodeLineIndex)
        .some((line) => line.startsWith('"use server"')),
    ).toBeTruthy()
    expect(output).toContain(
      'import {registerServerReference} from "react-server-dom-webpack/server";',
    )
    expect(output).toContain(
      `registerServerReference(formAction,"${id}","default");`,
    )
    // One import and (exactly) one call to registerServerReference, so two
    // matches
    expect(output.match(/registerServerReference/g)).toHaveLength(2)
  })
})
