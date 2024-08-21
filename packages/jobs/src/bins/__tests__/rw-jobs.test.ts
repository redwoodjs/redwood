import { beforeEach, describe, expect, it, vi } from 'vitest'

import { mockLogger } from '../../core/__tests__/mocks.js'
import { buildNumWorkers, startWorkers } from '../rw-jobs.js'

vi.mock('@redwoodjs/cli-helpers/loadEnvFiles', () => {
  return {
    loadEnvFiles: () => {},
  }
})

const mocks = vi.hoisted(() => {
  return {
    fork: vi.fn(),
  }
})

vi.mock('node:child_process', () => {
  return {
    fork: mocks.fork,
  }
})

describe('buildNumWorkers()', () => {
  it('turns an array of counts config into an array of arrays', () => {
    const config = [
      {
        count: 2,
      },
      {
        count: 1,
      },
    ]

    const result = buildNumWorkers(config)

    expect(result).toEqual([
      [0, 0],
      [0, 1],
      [1, 0],
    ])
  })
})

describe('startWorkers()', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('forks a single worker', () => {
    const mockWorker = {
      on: () => {},
    }
    mocks.fork.mockImplementation(() => mockWorker)

    startWorkers({ numWorkers: [[0, 0]], logger: mockLogger })

    expect(mocks.fork).toHaveBeenCalledWith(
      expect.stringContaining('rw-jobs-worker.js'),
      ['--index', '0', '--id', '0'],
      expect.objectContaining({
        detached: false,
        stdio: 'inherit',
      }),
    )
  })

  it('forks multiple workers', () => {
    const mockWorker = {
      on: () => {},
    }
    mocks.fork.mockImplementation(() => mockWorker)

    startWorkers({
      numWorkers: [
        [0, 0],
        [0, 1],
      ],
      logger: mockLogger,
    })

    expect(mocks.fork).toHaveBeenCalledWith(
      expect.stringContaining('rw-jobs-worker.js'),
      ['--index', '0', '--id', '0'],
      expect.any(Object),
    )
    expect(mocks.fork).toHaveBeenCalledWith(
      expect.stringContaining('rw-jobs-worker.js'),
      ['--index', '0', '--id', '1'],
      expect.any(Object),
    )
  })
})
