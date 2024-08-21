import { beforeEach, describe, expect, it, vi } from 'vitest'

import { MockAdapter, mockLogger } from '../../core/__tests__/mocks.js'
import { JobManager } from '../../core/JobManager.js'
import { Worker } from '../../core/Worker.js'
import { getWorker, setProcessTitle } from '../rw-jobs-worker.js'

vi.mock('@redwoodjs/cli-helpers/loadEnvFiles', () => {
  return {
    loadEnvFiles: () => {},
  }
})

const mocks = vi.hoisted(() => {
  return {
    loadJobsManager: vi.fn(),
  }
})

vi.mock('../../loaders.js', () => {
  return {
    loadJobsManager: mocks.loadJobsManager,
  }
})

describe('setProcessTitle', () => {
  it('sets the process title for a single queue', () => {
    setProcessTitle({ id: 1, queues: 'default' })

    expect(process.title).toEqual('rw-jobs-worker.default.1')
  })

  it('sets the process title for an array of queues', () => {
    setProcessTitle({ id: 1, queues: ['default', 'email'] })

    expect(process.title).toEqual('rw-jobs-worker.default-email.1')
  })
})

describe('getWorker', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('returns an instance of Worker', async () => {
    mocks.loadJobsManager.mockImplementation(
      () =>
        new JobManager({
          adapters: {
            test: new MockAdapter(),
          },
          logger: mockLogger,
          queues: ['default'],
          workers: [
            {
              adapter: 'test',
              logger: mockLogger,
              queue: '*',
              count: 1,
            },
          ],
        }),
    )

    const worker = await getWorker({
      index: 0,
      workoff: false,
      clear: false,
    })

    expect(worker).toBeInstanceOf(Worker)
  })

  it('calls getWorker on the manager with the proper values', async () => {
    const mockAdapter = new MockAdapter()
    mocks.loadJobsManager.mockImplementation(
      () =>
        new JobManager({
          adapters: {
            test: mockAdapter,
          },
          logger: mockLogger,
          queues: ['default'],
          workers: [
            {
              adapter: 'test',
              logger: mockLogger,
              queue: '*',
              count: 1,
            },
          ],
        }),
    )
    const spy = vi.spyOn(JobManager.prototype, 'createWorker')

    await getWorker({
      index: 0,
      workoff: false,
      clear: false,
    })

    expect(spy).toHaveBeenCalledWith({ index: 0, workoff: false, clear: false })
  })
})
