import fs from 'fs'

import 'src/lib/test'
import path from 'path'
import * as lib from 'src/lib'
import addCSSImports from '..'

jest.mock('src/lib', () => {
  return {
    ...jest.requireActual('src/lib'),
    getPaths: () => ({
      api: {},
      web: {
        src: 'some/path/to/web/src',
      },
    }),
    writeFile: jest.fn(),
  }
})

describe('rw setup tailwind - addCSSImports task', () => {
  const cssPath = path.join(lib.getPaths().web.src, 'index.css')
  const cssImports = fs
    .readFileSync(path.join(__dirname, '..', 'css-imports.template.css'))
    .toString()

  const task = addCSSImports()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('skips if main CSS already includes TailwindCSS imports', () => {
    jest.spyOn(fs, 'readFileSync').mockImplementation(() => {
      // Always return `cssImports`, which means `web/src/index.css` will contain the imports
      return cssImports
    })

    const writeFileSyncSpy = jest.spyOn(fs, 'writeFileSync')

    const taskSkip = jest.fn()
    task(undefined, { skip: taskSkip })

    expect(taskSkip).toHaveBeenCalledWith(`Imports already exist in ${cssPath}`)
    expect(writeFileSyncSpy).not.toHaveBeenCalled()
  })

  it("writes CSS imports to web/src/index.css when they're missing", () => {
    const cssContent = '.beautiful-text { font-family: "Comic Sans" }'

    jest
      .spyOn(fs, 'readFileSync')
      .mockImplementation((path) =>
        path === cssPath ? cssContent : cssImports
      )

    const taskObj = {}
    task(undefined, taskObj)

    expect(lib.writeFile).toHaveBeenCalledWith(
      cssPath,
      cssImports + cssContent,
      { overwriteExisting: true },
      taskObj
    )
  })
})
