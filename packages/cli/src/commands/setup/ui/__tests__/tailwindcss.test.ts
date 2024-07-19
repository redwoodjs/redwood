let mockExecutedTaskTitles: Array<string> = []
let mockSkippedTaskTitles: Array<string> = []
let mockSkipValues: Array<string> = []
let mockPrompt: (() => boolean) | undefined

vi.mock('fs', async () => ({ ...memfsFs, default: { ...memfsFs } }))
vi.mock('node:fs', async () => ({ ...memfsFs, default: { ...memfsFs } }))
vi.mock('fs-extra', async () => {
  function outputFileSync(filePath: string, data: string, options?: any) {
    memfsFs.mkdirSync(path.dirname(filePath), { recursive: true })
    memfsFs.writeFileSync(filePath, data, options)
  }

  return {
    ...memfsFs,
    outputFileSync,
    default: {
      ...memfsFs,
      outputFileSync,
    },
  }
})
vi.mock('execa', () => ({
  default: (...args: Array<any>) => {
    // Create an empty config file when `tailwindcss init` is called.
    // If we don't do this, later stages of the setup will fail.
    if (args[0] === 'yarn' && args[1].join(' ').includes('tailwindcss init')) {
      memfsFs.writeFileSync(args[1][args[1].length - 1], '')
    }
  },
}))

vi.mock('listr2', () => {
  return {
    // Return a constructor function, since we're calling `new` on Listr
    Listr: vi.fn().mockImplementation((tasks: Array<any>) => {
      return {
        run: async () => {
          mockExecutedTaskTitles = []
          mockSkippedTaskTitles = []
          mockSkipValues = []

          for (const task of tasks) {
            const skip =
              typeof task.skip === 'function' ? task.skip : () => task.skip

            const skipValue = skip()

            if (skipValue) {
              mockSkippedTaskTitles.push(task.title)
              mockSkipValues.push(skipValue)
            } else {
              mockExecutedTaskTitles.push(task.title)

              task.skip = (reason: string) => {
                mockSkippedTaskTitles.push(task.title)
                mockSkipValues.push(reason)
              }

              if (mockPrompt) {
                task.prompt = mockPrompt
              }

              await task.task({}, task)
            }
          }
        },
      }
    }),
  }
})

import path from 'node:path'

import { vol, fs as memfsFs } from 'memfs'
import {
  vi,
  expect,
  it,
  describe,
  beforeAll,
  beforeEach,
  afterAll,
  afterEach,
} from 'vitest'

// @ts-expect-error - no types
import { handler } from '../libraries/tailwindcss.js'

// Set up RWJS_CWD
let original_RWJS_CWD: string | undefined
const APP_PATH = '/redwood-app'

beforeAll(() => {
  original_RWJS_CWD = process.env.RWJS_CWD
  process.env.RWJS_CWD = APP_PATH
})

beforeEach(() => {
  // The `recommendExtensionsToInstall` function uses `console.log` to output
  // the list of recommended extensions. We mock it to keep the output clean
  // during tests
  vi.spyOn(console, 'log').mockImplementation(() => {})
})

afterEach(() => {
  mockPrompt = undefined
  vi.mocked(console).log.mockRestore()
  vol.reset()
})

afterAll(() => {
  process.env.RWJS_CWD = original_RWJS_CWD
  vi.resetAllMocks()
  vi.resetModules()
})

describe('tasks that should be skipped', () => {
  it('should skip installing if called with `install: false`', async () => {
    setupDefaultProjectStructure()

    await handler({ install: false })

    expect(mockSkippedTaskTitles).toContain(
      'Installing project-wide packages...',
    )
    expect(mockSkippedTaskTitles).toContain('Installing web side packages...')
    expect(Array.isArray(mockSkipValues)).toBe(true)
    expect(mockSkipValues.length).toBeGreaterThanOrEqual(2)
    expect(mockSkipValues[0]).toBe(true)
    expect(mockSkipValues[1]).toBe(true)
  })

  it("should skip adding directives to index.css if they're already in there", async () => {
    setupDefaultProjectStructure({
      'web/src/index.css': [
        '@tailwind base;',
        '@tailwind components;',
        '@tailwind utilities;',
      ].join('\n'),
    })

    await handler({})

    expect(mockSkippedTaskTitles).toContain('Adding directives to index.css...')
    expect(mockSkipValues).toContain('Directives already exist in index.css')
  })

  it("should skip updating scaffold.css if it doesn't exist", async () => {
    // No scaffold.css file is the default
    setupDefaultProjectStructure()

    mockPrompt = vi.fn()

    await handler({})

    expect(mockSkippedTaskTitles).toContain(
      "Updating 'scaffold.css' to use tailwind classes...",
    )
    expect(mockSkipValues).toContain("No 'scaffold.css' file to update")
    expect(mockPrompt).not.toHaveBeenCalled()
  })

  it('should skip updating scaffold.css if the user answers "no" to the prompt', async () => {
    setupDefaultProjectStructure({
      'web/src/scaffold.css': [
        '.rw-scaffold *,',
        '.rw-scaffold ::after,',
        '.rw-scaffold ::before {',
        '  box-sizing: inherit;',
        '}',
      ].join('\n'),
    })

    mockPrompt = vi.fn().mockReturnValue(false)

    await handler({})

    expect(mockSkippedTaskTitles).toContain(
      "Updating 'scaffold.css' to use tailwind classes...",
    )
    expect(mockSkipValues).toContain("Skipping 'scaffold.css' update")
    expect(mockPrompt).toHaveBeenCalledWith({
      type: 'Confirm',
      message:
        "Do you want to override your 'scaffold.css' to use tailwind classes?",
    })
  })

  it('should skip adding recommended VS Code extensions to project settings if the user is not using VS Code', async () => {
    setupDefaultProjectStructure()
    // Delete the .vscode directory to simulate not using VS Code
    memfsFs.rmSync(path.join(APP_PATH, '.vscode'), { recursive: true })

    await handler({})

    expect(mockSkippedTaskTitles).toContain(
      'Adding recommended VS Code extensions to project settings...',
    )
    expect(mockSkipValues).toContain("Looks like you're not using VS Code")
  })

  it('should skip adding tailwind intellisense plugin config to VS Code settings if the user is not using VS Code', async () => {
    setupDefaultProjectStructure()
    memfsFs.rmSync(path.join(APP_PATH, '.vscode'), { recursive: true })

    await handler({})

    expect(mockSkippedTaskTitles).toContain(
      'Adding tailwind intellisense plugin configuration to VS Code settings...',
    )
    expect(mockSkipValues).toContain("Looks like you're not using VS Code")
  })
})

describe('tailwindcss intellisense settings', () => {
  it('creates a new settings file when none exists', async () => {
    setupDefaultProjectStructure({
      '.vscode/': null, // empty directory
    })

    await handler({})

    const settingsJson = JSON.parse(readVsCodeSettings())
    const twClassAttributes = settingsJson['tailwindCSS.classAttributes']

    expect(Array.isArray(twClassAttributes)).toBe(true)
    expect(twClassAttributes).toContain('class')
    expect(twClassAttributes).toContain('className')
    expect(twClassAttributes).toContain('activeClassName')
    expect(twClassAttributes).toContain('errorClassName')
    expect(twClassAttributes.length).toBe(4)
  })

  it('adds to existing empty settings file', async () => {
    setupDefaultProjectStructure({
      '.vscode/settings.json': '',
    })

    await handler({})

    const settingsJson = JSON.parse(readVsCodeSettings())
    const twClassAttributes = settingsJson['tailwindCSS.classAttributes']

    expect(Object.keys(settingsJson).length).toBe(1)
    expect(Array.isArray(twClassAttributes)).toBe(true)
    expect(twClassAttributes).toContain('class')
    expect(twClassAttributes).toContain('className')
    expect(twClassAttributes).toContain('activeClassName')
    expect(twClassAttributes).toContain('errorClassName')
    expect(twClassAttributes.length).toBe(4)
  })

  it('adds to existing settings file without any tailwindCSS settings', async () => {
    setupDefaultProjectStructure({
      '.vscode/settings.json': [
        '{',
        '  "editor.tabSize": 2,',
        '  "editor.codeActionsOnSave": {',
        '    "source.fixAll.eslint": "explicit"',
        '  }',
        '}',
      ].join('\n'),
    })

    await handler({})

    const settingsJson = JSON.parse(readVsCodeSettings())
    const twClassAttributes = settingsJson['tailwindCSS.classAttributes']

    expect(Object.keys(settingsJson).length).toBe(3)
    expect(Array.isArray(twClassAttributes)).toBe(true)
    expect(twClassAttributes).toContain('class')
    expect(twClassAttributes).toContain('className')
    expect(twClassAttributes).toContain('activeClassName')
    expect(twClassAttributes).toContain('errorClassName')
    expect(twClassAttributes.length).toBe(4)
  })

  it('adds to existing settings file with existing tailwindCSS settings', async () => {
    setupDefaultProjectStructure({
      '.vscode/settings.json': [
        '{',
        '  "editor.tabSize": 2,',
        '  "editor.codeActionsOnSave": {',
        '    "source.fixAll.eslint": "explicit"',
        '  },',
        '  "tailwindCSS.emmetCompletions": true',
        '}',
      ].join('\n'),
    })

    await handler({})

    const settingsJson = JSON.parse(readVsCodeSettings())
    const twClassAttributes = settingsJson['tailwindCSS.classAttributes']

    expect(Object.keys(settingsJson).length).toBe(4)
    expect(settingsJson['tailwindCSS.emmetCompletions']).toBeTruthy()
    expect(Array.isArray(twClassAttributes)).toBe(true)
    expect(twClassAttributes).toContain('class')
    expect(twClassAttributes).toContain('className')
    expect(twClassAttributes).toContain('activeClassName')
    expect(twClassAttributes).toContain('errorClassName')
    expect(twClassAttributes.length).toBe(4)
  })

  // This is what I decided to do now. If good arguments are made to change
  // the behavior, feel free to just update the test
  it('adds to existing tailwindCSS classAttributes', async () => {
    setupDefaultProjectStructure({
      '.vscode/settings.json': [
        '{',
        '  "editor.tabSize": 2,',
        '  "editor.codeActionsOnSave": {',
        '    "source.fixAll.eslint": "explicit"',
        '  },',
        '  "tailwindCSS.emmetCompletions": true,',
        '  "tailwindCSS.classAttributes": [',
        '    "class",',
        '    "className",',
        '    "ngClass"',
        '  ]',
        '}',
      ].join('\n'),
    })

    await handler({})

    const settingsJson = JSON.parse(readVsCodeSettings())
    const twClassAttributes = settingsJson['tailwindCSS.classAttributes']

    expect(Object.keys(settingsJson).length).toBe(4)
    expect(settingsJson['tailwindCSS.emmetCompletions']).toBeTruthy()
    expect(Array.isArray(twClassAttributes)).toBe(true)
    expect(twClassAttributes).toContain('class')
    expect(twClassAttributes).toContain('className')
    expect(twClassAttributes).toContain('ngClass')
    expect(twClassAttributes).toContain('activeClassName')
    expect(twClassAttributes).toContain('errorClassName')
    expect(twClassAttributes.length).toBe(5)
  })
})

function setupDefaultProjectStructure(
  volOverride?: Record<string, string | null>,
) {
  vol.fromJSON(
    {
      'redwood.toml': '',
      'prettier.config.js': '',
      'web/config/': null,
      'web/src/index.css': '',
      '.vscode/settings.json': [
        '{',
        '  "editor.tabSize": 2,',
        '  "editor.codeActionsOnSave": {',
        '    "source.fixAll.eslint": "explicit"',
        '  }',
        '}',
      ].join('\n'),
      [path.join(__dirname, '../templates/postcss.config.js.template')]: '',
    },
    APP_PATH,
  )

  if (volOverride) {
    vol.fromJSON(volOverride, APP_PATH)
  }
}

function readVsCodeSettings() {
  return memfsFs.readFileSync(
    '/redwood-app/.vscode/settings.json',
    'utf-8',
    // The types are wrong for memfs.fs.readFileSync, so we cast it to string
    // See https://github.com/streamich/memfs/issues/702
  ) as string
}
