let mockExecutedTaskTitles = []
let mockSkippedTaskTitles = []

vi.mock('fs-extra')

import '../../../lib/mockTelemetry'

import { vol, fs as memfsFs } from 'memfs'
import {
  vi,
  describe,
  it,
  expect,
  beforeEach,
  beforeAll,
  afterAll,
} from 'vitest'

import * as jobsHandler from '../jobs/jobsHandler.js'

vi.mock('fs', async () => ({ ...memfsFs, default: { ...memfsFs } }))
vi.mock('node:fs', async () => ({ ...memfsFs, default: { ...memfsFs } }))

vi.mock('@prisma/internals', async () => ({
  getDMMF: async () => ({
    datamodel: {
      models: [{ name: 'BackgroundJob' }],
    },
  }),
}))

vi.mock('@redwoodjs/cli-helpers', () => ({
  addApiPackages: () => ({
    title: 'Adding required api packages...',
    task: async () => {},
  }),
}))
vi.mock('@redwoodjs/project-config', async (importOriginal) => {
  const path = require('path')
  const originalProjectConfig = await importOriginal()
  return {
    ...originalProjectConfig,
    getPaths: () => {
      const BASE_PATH = '/path/to/project'
      return {
        base: BASE_PATH,
        api: {
          base: path.join(BASE_PATH, 'api'),
          dbSchema: path.join(BASE_PATH, 'api', 'db', 'schema.prisma'),
          lib: path.join(BASE_PATH, 'api', 'src', 'lib'),
          jobs: path.join(BASE_PATH, 'api', 'src', 'jobs'),
        },
        web: {
          base: path.join(BASE_PATH, 'web'),
        },
      }
    },
  }
})

vi.mock('listr2', async () => {
  const ctx = {}
  const listrImpl = (tasks, listrOptions) => {
    return {
      ctx,
      run: async () => {
        mockExecutedTaskTitles = []
        mockSkippedTaskTitles = []

        for (const task of tasks) {
          const skip =
            typeof task.skip === 'function' ? task.skip : () => task.skip

          const skipReturnValue = skip()
          if (typeof skipReturnValue === 'string') {
            mockSkippedTaskTitles.push(skipReturnValue)
          } else if (skipReturnValue) {
            mockSkippedTaskTitles.push(task.title)
          } else {
            const augmentedTask = {
              ...task,
              newListr: listrImpl,
              prompt: async (options) => {
                const enquirer = listrOptions?.injectWrapper?.enquirer

                if (enquirer) {
                  if (!Array.isArray(options)) {
                    options = [{ ...options, name: 'default' }]
                  } else if (options.length === 1) {
                    options[0].name = 'default'
                  }

                  const response = await enquirer.prompt(options)

                  if (options.length === 1) {
                    return response.default
                  }
                }
              },
              skip: (msg) => {
                mockSkippedTaskTitles.push(msg || task.title)
              },
            }
            await task.task(ctx, augmentedTask)

            // storing the title after running the task in case the task
            // modifies its own title
            mockExecutedTaskTitles.push(augmentedTask.title)
          }
        }
      },
    }
  }

  return {
    // Return a constructor function, since we're calling `new` on Listr
    Listr: vi.fn().mockImplementation(listrImpl),
  }
})

beforeAll(() => {
  vi.spyOn(console, 'log')
  vi.spyOn(console, 'error')
})

afterAll(() => {
  vi.mocked(console).log.mockRestore?.()
  vi.mocked(console).error.mockRestore?.()
})

beforeEach(() => {
  vol.reset()
  vol.fromJSON(
    {
      'package.json': '{}',
      'api/tsconfig.json': '',
      'api/db/schema.prisma': '',
      'api/src/lib': {},
      // api/src/jobs already exists – this should not cause an error
      'api/src/jobs': {},
      [__dirname + '/../jobs/templates/jobs.ts.template']: '',
    },
    '/path/to/project',
  )
})

describe('jobsHandler', () => {
  it('skips creating the BackgroundJobs model if it already exists', async () => {
    await jobsHandler.handler({ force: false })

    expect(mockSkippedTaskTitles).toEqual([
      'BackgroundJob model exists, skipping',
    ])
    expect(console.error).not.toHaveBeenCalled()
  })

  it('ignores error for already existing api/src/jobs dir', async () => {
    await jobsHandler.handler({ force: false })

    expect(
      mockExecutedTaskTitles.some(
        (title) => title === 'Creating jobs dir at api/src/jobs...',
      ),
    ).toBeTruthy()
    expect(console.error).not.toHaveBeenCalled()
  })
})
